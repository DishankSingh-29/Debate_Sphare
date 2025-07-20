const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DebateSession = require('../models/DebateSession');
const DebateMessage = require('../models/DebateMessage');
const logger = require('../config/logger');

/**
 * WebSocket connection handler
 */
const socketHandler = (io) => {
  // Store active sessions and users
  const activeSessions = new Map();
  const connectedUsers = new Map();

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.email} (${socket.id})`);
    
    // Store connected user
    connectedUsers.set(socket.id, {
      userId: socket.user._id,
      email: socket.user.email,
      name: socket.user.name,
      socketId: socket.id,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(`user:${socket.user._id}`);

    // Handle joining a debate session
    socket.on('join-debate', async (data) => {
      try {
        const { sessionId } = data;
        
        if (!sessionId) {
          socket.emit('error', { message: 'Session ID is required' });
          return;
        }

        // Verify session exists and user has access
        const session = await DebateSession.findById(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        if (session.userId.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Access denied to this session' });
          return;
        }

        // Join session room
        socket.join(`session:${sessionId}`);
        
        // Store session info
        activeSessions.set(sessionId, {
          sessionId,
          userId: socket.user._id,
          status: session.status,
          startTime: session.startTime,
          lastActivity: new Date()
        });

        // Send session info to client
        socket.emit('session-joined', {
          sessionId,
          status: session.status,
          topic: session.topicId,
          chosenSide: session.chosenSide,
          startTime: session.startTime
        });

        // Notify other users in session (if any)
        socket.to(`session:${sessionId}`).emit('user-joined', {
          userId: socket.user._id,
          name: socket.user.name
        });

        logger.info(`User ${socket.user.email} joined debate session ${sessionId}`);
      } catch (error) {
        logger.error('Error joining debate session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Handle leaving a debate session
    socket.on('leave-debate', (data) => {
      const { sessionId } = data;
      
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
        activeSessions.delete(sessionId);
        
        socket.to(`session:${sessionId}`).emit('user-left', {
          userId: socket.user._id,
          name: socket.user.name
        });
        
        logger.info(`User ${socket.user.email} left debate session ${sessionId}`);
      }
    });

    // Handle sending a message
    socket.on('send-message', async (data) => {
      try {
        const { sessionId, content, messageType = 'general' } = data;
        
        if (!sessionId || !content) {
          socket.emit('error', { message: 'Session ID and content are required' });
          return;
        }

        // Verify session exists and user has access
        const session = await DebateSession.findById(sessionId);
        if (!session || session.userId.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Access denied to this session' });
          return;
        }

        if (session.status !== 'active') {
          socket.emit('error', { message: 'Session is not active' });
          return;
        }

        // Get next turn number
        const lastMessage = await DebateMessage.findOne({ sessionId })
          .sort({ turnNumber: -1 })
          .limit(1);
        
        const turnNumber = lastMessage ? lastMessage.turnNumber + 1 : 1;

        // Create message
        const message = await DebateMessage.create({
          sessionId,
          senderType: 'user',
          content: content.trim(),
          turnNumber,
          messageType
        });

        // Update session message count
        await session.incrementMessageCount('user');

        // Emit message to all users in session
        io.to(`session:${sessionId}`).emit('new-message', {
          messageId: message._id,
          sessionId,
          senderType: 'user',
          content: message.content,
          timestamp: message.timestamp,
          turnNumber: message.turnNumber,
          messageType: message.messageType,
          sender: {
            id: socket.user._id,
            name: socket.user.name
          }
        });

        // Update session activity
        await session.updateActivity();

        logger.info(`Message sent in session ${sessionId} by ${socket.user.email}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { sessionId, isTyping } = data;
      
      if (sessionId) {
        socket.to(`session:${sessionId}`).emit('user-typing', {
          userId: socket.user._id,
          name: socket.user.name,
          isTyping
        });
      }
    });

    // Handle session pause
    socket.on('pause-session', async (data) => {
      try {
        const { sessionId } = data;
        
        const session = await DebateSession.findById(sessionId);
        if (!session || session.userId.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        await session.pauseSession();
        
        io.to(`session:${sessionId}`).emit('session-paused', {
          sessionId,
          pausedAt: new Date()
        });
        
        logger.info(`Session ${sessionId} paused by ${socket.user.email}`);
      } catch (error) {
        logger.error('Error pausing session:', error);
        socket.emit('error', { message: 'Failed to pause session' });
      }
    });

    // Handle session resume
    socket.on('resume-session', async (data) => {
      try {
        const { sessionId } = data;
        
        const session = await DebateSession.findById(sessionId);
        if (!session || session.userId.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        await session.resumeSession();
        
        io.to(`session:${sessionId}`).emit('session-resumed', {
          sessionId,
          resumedAt: new Date()
        });
        
        logger.info(`Session ${sessionId} resumed by ${socket.user.email}`);
      } catch (error) {
        logger.error('Error resuming session:', error);
        socket.emit('error', { message: 'Failed to resume session' });
      }
    });

    // Handle session end
    socket.on('end-session', async (data) => {
      try {
        const { sessionId } = data;
        
        const session = await DebateSession.findById(sessionId);
        if (!session || session.userId.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        await session.endSession();
        
        io.to(`session:${sessionId}`).emit('session-ended', {
          sessionId,
          endedAt: new Date()
        });
        
        // Remove from active sessions
        activeSessions.delete(sessionId);
        
        logger.info(`Session ${sessionId} ended by ${socket.user.email}`);
      } catch (error) {
        logger.error('Error ending session:', error);
        socket.emit('error', { message: 'Failed to end session' });
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.email} (${socket.id})`);
      
      // Remove from connected users
      connectedUsers.delete(socket.id);
      
      // Remove from active sessions
      for (const [sessionId, session] of activeSessions.entries()) {
        if (session.userId.toString() === socket.user._id.toString()) {
          activeSessions.delete(sessionId);
          io.to(`session:${sessionId}`).emit('user-disconnected', {
            userId: socket.user._id,
            name: socket.user.name
          });
        }
      }
    });
  });

  // Utility functions for external use
  const utilities = {
    // Send AI message to session
    sendAIMessage: async (sessionId, content, messageType = 'general') => {
      try {
        const session = await DebateSession.findById(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        // Get next turn number
        const lastMessage = await DebateMessage.findOne({ sessionId })
          .sort({ turnNumber: -1 })
          .limit(1);
        
        const turnNumber = lastMessage ? lastMessage.turnNumber + 1 : 1;

        // Create AI message
        const message = await DebateMessage.create({
          sessionId,
          senderType: 'ai',
          content: content.trim(),
          turnNumber,
          messageType
        });

        // Update session message count
        await session.incrementMessageCount('ai');

        // Emit message to session
        io.to(`session:${sessionId}`).emit('new-message', {
          messageId: message._id,
          sessionId,
          senderType: 'ai',
          content: message.content,
          timestamp: message.timestamp,
          turnNumber: message.turnNumber,
          messageType: message.messageType,
          sender: {
            id: 'ai',
            name: 'AI Opponent'
          }
        });

        // Update session activity
        await session.updateActivity();

        logger.info(`AI message sent in session ${sessionId}`);
        return message;
      } catch (error) {
        logger.error('Error sending AI message:', error);
        throw error;
      }
    },

    // Get active sessions
    getActiveSessions: () => {
      return Array.from(activeSessions.values());
    },

    // Get connected users
    getConnectedUsers: () => {
      return Array.from(connectedUsers.values());
    },

    // Check if user is connected
    isUserConnected: (userId) => {
      return Array.from(connectedUsers.values()).some(user => user.userId.toString() === userId.toString());
    },

    // Send notification to user
    sendNotification: (userId, notification) => {
      io.to(`user:${userId}`).emit('notification', notification);
    },

    // Broadcast to all connected users
    broadcast: (event, data) => {
      io.emit(event, data);
    }
  };

  return utilities;
};

module.exports = socketHandler; 