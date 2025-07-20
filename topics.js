const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { authenticate, validate, authorize } = require('../debatesphere/backend/middleware');
const { topicValidation } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     TopicList:
 *       type: object
 *       properties:
 *         topics:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DebateTopic'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     TopicSuggestion:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Suggested topic title
 *         description:
 *           type: string
 *           description: Brief description of the topic
 *         category:
 *           type: string
 *           description: Suggested category
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Suggested difficulty level
 *         reasoning:
 *           type: string
 *           description: Explanation for why this topic should be added
 */

/**
 * @swagger
 * /api/topics:
 *   get:
 *     summary: Get all debate topics
 *     tags: [Topics]
 *     parameters:
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
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: approved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *     responses:
 *       200:
 *         description: Topics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TopicList'
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', topicController.getAllTopics);

/**
 * @swagger
 * /api/topics:
 *   post:
 *     summary: Create a new debate topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - difficulty
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 1000
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               arguments:
 *                 type: object
 *                 properties:
 *                   for:
 *                     type: array
 *                     items:
 *                       type: string
 *                   against:
 *                     type: array
 *                     items:
 *                       type: string
 *               evidence:
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
 *     responses:
 *       201:
 *         description: Topic created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateTopic'
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
 */
router.post('/', authenticate, validate(topicValidation.createTopic), topicController.createTopic);

/**
 * @swagger
 * /api/topics/{topicId}:
 *   get:
 *     summary: Get a specific debate topic
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Topic retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateTopic'
 *       404:
 *         description: Topic not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:topicId', topicController.getTopic);

/**
 * @swagger
 * /api/topics/{topicId}:
 *   put:
 *     summary: Update a debate topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               arguments:
 *                 type: object
 *               evidence:
 *                 type: array
 *     responses:
 *       200:
 *         description: Topic updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateTopic'
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
 *         description: Forbidden - not authorized to update this topic
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
router.put('/:topicId', authenticate, validate(topicValidation.updateTopic), topicController.updateTopic);

/**
 * @swagger
 * /api/topics/{topicId}:
 *   delete:
 *     summary: Delete a debate topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Topic deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not authorized to delete this topic
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
router.delete('/:topicId', authenticate, authorize(['admin', 'moderator']), topicController.deleteTopic);

/**
 * @swagger
 * /api/topics/categories:
 *   get:
 *     summary: Get all topic categories
 *     tags: [Topics]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       description:
 *                         type: string
 */
router.get('/categories', topicController.getCategories);

/**
 * @swagger
 * /api/topics/random:
 *   get:
 *     summary: Get a random debate topic
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: exclude
 *         schema:
 *           type: string
 *         description: Comma-separated list of topic IDs to exclude
 *     responses:
 *       200:
 *         description: Random topic retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DebateTopic'
 *       404:
 *         description: No topics found matching criteria
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/random', topicController.getRandomTopic);

/**
 * @swagger
 * /api/topics/suggestions:
 *   get:
 *     summary: Get topic suggestions
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by suggestion status
 *     responses:
 *       200:
 *         description: Topic suggestions retrieved successfully
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
 *                     $ref: '#/components/schemas/TopicSuggestion'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/suggestions', authenticate, topicController.getSuggestions);

/**
 * @swagger
 * /api/topics/suggestions:
 *   post:
 *     summary: Submit a topic suggestion
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - difficulty
 *               - reasoning
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 1000
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               reasoning:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Topic suggestion submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TopicSuggestion'
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
 */
router.post('/suggestions', authenticate, validate(topicValidation.suggestTopic), topicController.suggestTopic);

/**
 * @swagger
 * /api/topics/suggestions/{suggestionId}:
 *   put:
 *     summary: Approve or reject a topic suggestion
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: suggestionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Suggestion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               feedback:
 *                 type: string
 *                 description: Optional feedback for rejected suggestions
 *     responses:
 *       200:
 *         description: Suggestion processed successfully
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
 *         description: Invalid action
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
 *         description: Forbidden - not authorized to process suggestions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Suggestion not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/suggestions/:suggestionId', authenticate, authorize(['admin', 'moderator']), topicController.processSuggestion);

/**
 * @swagger
 * /api/topics/{topicId}/stats:
 *   get:
 *     summary: Get topic statistics
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Topic statistics retrieved successfully
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
 *                     totalSessions:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 *                     winRate:
 *                       type: object
 *                       properties:
 *                         for:
 *                           type: number
 *                         against:
 *                           type: number
 *                     averageDuration:
 *                       type: number
 *                     difficultyRating:
 *                       type: number
 *       404:
 *         description: Topic not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:topicId/stats', topicController.getTopicStats);

module.exports = router; 