const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, validate } = require('../debatesphere/backend/middleware');
const { aiValidation } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     AIResponse:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: AI-generated response content
 *         type:
 *           type: string
 *           enum: [argument, rebuttal, question, clarification]
 *           description: Type of AI response
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: AI confidence in the response
 *         reasoning:
 *           type: string
 *           description: AI's reasoning for the response
 *         suggestions:
 *           type: array
 *           items:
 *             type: string
 *           description: Suggested follow-up points
 *     AIAnalysis:
 *       type: object
 *       properties:
 *         argumentStrength:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Strength of arguments presented
 *         logicalConsistency:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Logical consistency of arguments
 *         evidenceUse:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Quality of evidence usage
 *         rebuttalQuality:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Quality of rebuttals
 *         overallScore:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Overall performance score
 *         feedback:
 *           type: object
 *           properties:
 *             strengths:
 *               type: array
 *               items:
 *                 type: string
 *             weaknesses:
 *               type: array
 *               items:
 *                 type: string
 *             suggestions:
 *               type: array
 *               items:
 *                 type: string
 *             detailedAnalysis:
 *               type: string
 */

/**
 * @swagger
 * /api/ai/respond:
 *   post:
 *     summary: Get AI response for debate
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userMessage
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Debate session ID
 *               userMessage:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: User's message to respond to
 *               context:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Previous messages for context
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 default: medium
 *                 description: AI difficulty level
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AIResponse'
 *       400:
 *         description: Validation error or invalid session
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
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/respond', authenticate, validate(aiValidation.getResponse), aiController.getResponse);

/**
 * @swagger
 * /api/ai/analyze:
 *   post:
 *     summary: Analyze debate performance
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Debate session ID
 *               includeDetailed:
 *                 type: boolean
 *                 default: true
 *                 description: Include detailed analysis
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AIAnalysis'
 *       400:
 *         description: Validation error or session not completed
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
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/analyze', authenticate, validate(aiValidation.analyzePerformance), aiController.analyzePerformance);

/**
 * @swagger
 * /api/ai/generate-feedback:
 *   post:
 *     summary: Generate personalized feedback
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Debate session ID
 *               focusAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [argumentation, evidence, logic, rebuttal, delivery]
 *                 description: Specific areas to focus feedback on
 *               skillLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, expert]
 *                 description: User's skill level for tailored feedback
 *     responses:
 *       200:
 *         description: Feedback generated successfully
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
 *                     summary:
 *                       type: string
 *                       description: Overall performance summary
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                     areasForImprovement:
 *                       type: array
 *                       items:
 *                         type: string
 *                     specificSuggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           area:
 *                             type: string
 *                           suggestion:
 *                             type: string
 *                           example:
 *                             type: string
 *                     practiceRecommendations:
 *                       type: array
 *                       items:
 *                         type: string
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
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate-feedback', authenticate, validate(aiValidation.generateFeedback), aiController.generateFeedback);

/**
 * @swagger
 * /api/ai/suggest-topics:
 *   post:
 *     summary: Get AI-suggested debate topics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User's areas of interest
 *               skillLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, expert]
 *                 description: User's skill level
 *               category:
 *                 type: string
 *                 description: Preferred category
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *                 description: Number of topics to suggest
 *     responses:
 *       200:
 *         description: Topics suggested successfully
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
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                       reasoning:
 *                         type: string
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
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/suggest-topics', authenticate, validate(aiValidation.suggestTopics), aiController.suggestTopics);

/**
 * @swagger
 * /api/ai/improve-argument:
 *   post:
 *     summary: Get AI suggestions to improve an argument
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - argument
 *               - topic
 *             properties:
 *               argument:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 description: The argument to improve
 *               topic:
 *                 type: string
 *                 description: Debate topic context
 *               side:
 *                 type: string
 *                 enum: [for, against]
 *                 description: Which side the argument is for
 *               focusAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [clarity, evidence, logic, structure, persuasiveness]
 *                 description: Areas to focus improvement on
 *     responses:
 *       200:
 *         description: Argument improvement suggestions generated
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
 *                     improvedArgument:
 *                       type: string
 *                       description: Improved version of the argument
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           example:
 *                             type: string
 *                     reasoning:
 *                       type: string
 *                       description: Explanation of improvements
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
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/improve-argument', authenticate, validate(aiValidation.improveArgument), aiController.improveArgument);

/**
 * @swagger
 * /api/ai/validate-evidence:
 *   post:
 *     summary: Validate and suggest evidence for arguments
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - argument
 *               - topic
 *             properties:
 *               argument:
 *                 type: string
 *                 description: The argument to find evidence for
 *               topic:
 *                 type: string
 *                 description: Debate topic context
 *               existingEvidence:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     source:
 *                       type: string
 *                     description:
 *                       type: string
 *                     url:
 *                       type: string
 *                 description: Existing evidence to validate
 *     responses:
 *       200:
 *         description: Evidence validation and suggestions completed
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
 *                     validation:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           evidence:
 *                             type: object
 *                           isValid:
 *                             type: boolean
 *                           issues:
 *                             type: array
 *                             items:
 *                               type: string
 *                           suggestions:
 *                               type: array
 *                               items:
 *                                 type: string
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           source:
 *                             type: string
 *                           description:
 *                             type: string
 *                           relevance:
 *                             type: number
 *                           credibility:
 *                             type: number
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
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/validate-evidence', authenticate, validate(aiValidation.validateEvidence), aiController.validateEvidence);

/**
 * @swagger
 * /api/ai/learning-path:
 *   get:
 *     summary: Get personalized learning path recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skillLevel
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced, expert]
 *         description: Current skill level
 *       - in: query
 *         name: interests
 *         schema:
 *           type: string
 *         description: Comma-separated list of interests
 *       - in: query
 *         name: goals
 *         schema:
 *           type: string
 *         description: Learning goals
 *     responses:
 *       200:
 *         description: Learning path generated successfully
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
 *                     currentLevel:
 *                       type: string
 *                     targetLevel:
 *                       type: string
 *                     milestones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           difficulty:
 *                             type: string
 *                           estimatedTime:
 *                             type: string
 *                           topics:
 *                             type: array
 *                             items:
 *                               type: string
 *                     recommendedTopics:
 *                       type: array
 *                       items:
 *                         type: object
 *                     practiceExercises:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid parameters
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
 */
router.get('/learning-path', authenticate, aiController.getLearningPath);

module.exports = router; 