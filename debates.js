const express = require('express');
const router = express.Router();
const debateController = require('../controllers/debateController');
const { authenticate, validate } = require('../debatesphere/backend/middleware');
const { debateValidation } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     DebateSessionList:
 *       type: object
 *       properties:
 *         sessions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DebateSession'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     DebateMessageList:
 *       type: object
 *       properties:
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DebateMessage'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/debates/start:
 *   post:
 *     summary: Start a new debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicId
 *               - chosenSide
 *             properties:
 *               topicId:
 *                 type: string
 *                 description: ID of the debate topic
 *               chosenSide:
 *                 type: string
 *                 enum: [for, against]
 *                 description: User's chosen side in the debate
 *               timeLimit:
 *                 type: integer
 *                 minimum: 300
 *                 maximum: 3600
 *                 default: 1800
 *                 description: Time limit in seconds (5-60 minutes)
 *     responses:
 *       201:
 *         description: Debate session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateSession'
 *       400:
 *         description: Validation error or invalid topic
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Topic not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/start', authenticate, validate(debateValidation.startSession), debateController.startSession);

/**
 * @swagger
 * /api/debates/{sessionId}:
 *   get:
 *     summary: Get debate session details
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *     responses:
 *       200:
 *         description: Debate session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateSession'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to access this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:sessionId', authenticate, debateController.getSession);

/**
 * @swagger
 * /api/debates/{sessionId}/messages:
 *   get:
 *     summary: Get debate messages
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of messages per page
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this timestamp
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateMessageList'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to access this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:sessionId/messages', authenticate, debateController.getMessages);

/**
 * @swagger
 * /api/debates/{sessionId}/messages:
 *   post:
 *     summary: Send a message in debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: Message content
 *               type:
 *                 type: string
 *                 enum: [argument, rebuttal, question, clarification]
 *                 default: argument
 *                 description: Type of message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateMessage'
 *       400:
 *         description: Validation error or session not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to send messages in this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:sessionId/messages', authenticate, validate(debateValidation.sendMessage), debateController.sendMessage);

/**
 * @swagger
 * /api/debates/{sessionId}/pause:
 *   post:
 *     summary: Pause debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *     responses:
 *       200:
 *         description: Session paused successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateSession'
 *       400:
 *         description: Session cannot be paused
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to pause this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:sessionId/pause', authenticate, debateController.pauseSession);

/**
 * @swagger
 * /api/debates/{sessionId}/resume:
 *   post:
 *     summary: Resume debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *     responses:
 *       200:
 *         description: Session resumed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateSession'
 *       400:
 *         description: Session cannot be resumed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to resume this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:sessionId/resume', authenticate, debateController.resumeSession);

/**
 * @swagger
 * /api/debates/{sessionId}/end:
 *   post:
 *     summary: End debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [completed, time_up, user_ended, abandoned]
 *                 default: completed
 *                 description: Reason for ending the session
 *     responses:
 *       200:
 *         description: Session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateSession'
 *       400:
 *         description: Session cannot be ended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to end this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:sessionId/end', authenticate, validate(debateValidation.endSession), debateController.endSession);

/**
 * @swagger
 * /api/debates/{sessionId}/analysis:
 *   get:
 *     summary: Get debate analysis and performance metrics
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *     responses:
 *       200:
 *         description: Analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/DebateSession'
 *                     metrics:
 *                       $ref: '#/components/schemas/PerformanceMetrics'
 *                     analysis:
 *                       type: object
 *                       properties:
 *                         strengths:
 *                           type: array
 *                           items:
 *                             type: string
 *                         weaknesses:
 *                           type: array
 *                           items:
 *                             type: string
 *                         suggestions:
 *                           type: array
 *                           items:
 *                             type: string
 *                         overallFeedback:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to access this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:sessionId/analysis', authenticate, debateController.getAnalysis);

/**
 * @swagger
 * /api/debates/{sessionId}/feedback:
 *   post:
 *     summary: Submit feedback for debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - feedback
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Overall rating of the debate experience
 *               feedback:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Detailed feedback about the debate
 *               aiQuality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating of AI opponent quality
 *               topicQuality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating of topic quality
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to submit feedback for this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:sessionId/feedback', authenticate, validate(debateValidation.submitFeedback), debateController.submitFeedback);

/**
 * @swagger
 * /api/debates/active:
 *   get:
 *     summary: Get user's active debate sessions
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DebateSession'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/active', authenticate, debateController.getActiveSessions);

/**
 * @swagger
 * /api/debates/{sessionId}/messages/{messageId}/react:
 *   post:
 *     summary: React to a debate message
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debate session ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reaction
 *             properties:
 *               reaction:
 *                 type: string
 *                 enum: [like, dislike, helpful, unclear]
 *                 description: Type of reaction
 *     responses:
 *       200:
 *         description: Reaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateMessage'
 *       400:
 *         description: Invalid reaction or already reacted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session or message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:sessionId/messages/:messageId/react', authenticate, validate(debateValidation.addReaction), debateController.addReaction);

module.exports = router; 