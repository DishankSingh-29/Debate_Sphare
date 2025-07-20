const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: process.env.SWAGGER_TITLE || 'DebateSphere API',
      version: process.env.SWAGGER_VERSION || '1.0.0',
      description: process.env.SWAGGER_DESCRIPTION || 'AI-powered argumentation platform API documentation',
      contact: {
        name: 'DebateSphere Support',
        email: 'support@debatesphere.ai',
        url: 'https://debatesphere.ai'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.debatesphere.ai',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'User ID' },
            name: { type: 'string', description: 'User full name' },
            email: { type: 'string', format: 'email', description: 'User email' },
            profileImage: { type: 'string', description: 'Profile image URL' },
            skillLevel: { 
              type: 'string', 
              enum: ['beginner', 'intermediate', 'advanced', 'expert'],
              description: 'User debate skill level'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        DebateTopic: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Topic ID' },
            title: { type: 'string', description: 'Topic title' },
            description: { type: 'string', description: 'Topic description' },
            category: { type: 'string', description: 'Topic category' },
            difficultyLevel: { 
              type: 'string', 
              enum: ['easy', 'medium', 'hard', 'expert'],
              description: 'Topic difficulty level'
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        DebateSession: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Session ID' },
            userId: { type: 'string', description: 'User ID' },
            topicId: { type: 'string', description: 'Topic ID' },
            chosenSide: { 
              type: 'string', 
              enum: ['pro', 'con'],
              description: 'User chosen side'
            },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            finalScore: { type: 'number', description: 'Final debate score' },
            status: { 
              type: 'string', 
              enum: ['active', 'completed', 'abandoned'],
              description: 'Session status'
            }
          }
        },
        DebateMessage: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Message ID' },
            sessionId: { type: 'string', description: 'Session ID' },
            senderType: { 
              type: 'string', 
              enum: ['user', 'ai'],
              description: 'Message sender type'
            },
            content: { type: 'string', description: 'Message content' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        PerformanceMetrics: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Metrics ID' },
            userId: { type: 'string', description: 'User ID' },
            sessionId: { type: 'string', description: 'Session ID' },
            argumentStrength: { type: 'number', description: 'Argument strength score' },
            rebuttalQuality: { type: 'number', description: 'Rebuttal quality score' },
            clarity: { type: 'number', description: 'Clarity score' },
            evidenceUse: { type: 'number', description: 'Evidence usage score' },
            overallScore: { type: 'number', description: 'Overall performance score' },
            feedback: { type: 'string', description: 'Detailed feedback' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            status: { type: 'number', description: 'HTTP status code' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './models/*.js',
    './middleware/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 