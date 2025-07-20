const OpenAI = require('openai');
const logger = require('../config/logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * AI Service
 * Handles all AI-related operations including OpenAI integration
 */

/**
 * Generate AI response for debate
 * @param {Object} params - Response generation parameters
 * @returns {Promise<Object>} AI response object
 */
const generateResponse = async (params) => {
  try {
    const { sessionId, userMessage, context, topic, chosenSide, difficulty, session } = params;

    // Build conversation context
    const conversationHistory = context.map(msg => ({
      role: msg.senderType === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Determine AI's side (opposite of user's chosen side)
    const aiSide = chosenSide === 'for' ? 'against' : 'for';

    // Build system prompt
    const systemPrompt = buildSystemPrompt(topic, aiSide, difficulty, session);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages,
      max_tokens: 500,
      temperature: difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 0.3 : 0.5,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const aiContent = completion.choices[0].message.content;

    // Analyze the response type
    const responseType = analyzeResponseType(aiContent, userMessage);

    // Generate confidence score
    const confidence = calculateConfidence(aiContent, topic, aiSide);

    // Generate reasoning and suggestions
    const reasoning = await generateReasoning(aiContent, userMessage, topic);
    const suggestions = await generateSuggestions(aiContent, topic, aiSide);

    return {
      content: aiContent,
      type: responseType,
      confidence,
      reasoning,
      suggestions
    };
  } catch (error) {
    logger.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
};

/**
 * Analyze debate performance
 * @param {string} sessionId - Session ID
 * @param {Array} messages - Debate messages
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Performance analysis
 */
const analyzePerformance = async (sessionId, messages, options = {}) => {
  try {
    const { topic, chosenSide, includeDetailed = true } = options;

    // Filter user messages
    const userMessages = messages.filter(msg => msg.senderType === 'user');

    if (userMessages.length === 0) {
      return {
        argumentStrength: 0,
        logicalConsistency: 0,
        evidenceUse: 0,
        rebuttalQuality: 0,
        overallScore: 0,
        feedback: {
          strengths: [],
          weaknesses: ['No arguments provided'],
          suggestions: ['Start by providing your main argument'],
          detailedAnalysis: 'No debate content to analyze.'
        }
      };
    }

    // Prepare content for analysis
    const debateContent = userMessages.map(msg => msg.content).join('\n\n');

    // Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(debateContent, topic, chosenSide, includeDetailed);

    // Generate analysis using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: debateContent }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const analysisText = completion.choices[0].message.content;

    // Parse the analysis response
    const analysis = parseAnalysisResponse(analysisText);

    return analysis;
  } catch (error) {
    logger.error('Error analyzing performance:', error);
    throw new Error('Failed to analyze performance');
  }
};

/**
 * Generate personalized feedback
 * @param {Object} params - Feedback generation parameters
 * @returns {Promise<Object>} Personalized feedback
 */
const generateFeedback = async (params) => {
  try {
    const { session, metrics, userHistory, focusAreas, skillLevel } = params;

    // Build feedback prompt
    const feedbackPrompt = buildFeedbackPrompt(session, metrics, userHistory, focusAreas, skillLevel);

    // Generate feedback using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: feedbackPrompt },
        { role: 'user', content: 'Generate personalized feedback for this debate session.' }
      ],
      max_tokens: 800,
      temperature: 0.4
    });

    const feedbackText = completion.choices[0].message.content;

    // Parse the feedback response
    const feedback = parseFeedbackResponse(feedbackText);

    return feedback;
  } catch (error) {
    logger.error('Error generating feedback:', error);
    throw new Error('Failed to generate feedback');
  }
};

/**
 * Suggest debate topics
 * @param {Object} params - Topic suggestion parameters
 * @returns {Promise<Array>} Topic suggestions
 */
const suggestTopics = async (params) => {
  try {
    const { interests, skillLevel, category, count, userHistory } = params;

    // Build suggestion prompt
    const suggestionPrompt = buildTopicSuggestionPrompt(interests, skillLevel, category, count, userHistory);

    // Generate suggestions using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: suggestionPrompt },
        { role: 'user', content: 'Suggest debate topics based on the provided criteria.' }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    const suggestionsText = completion.choices[0].message.content;

    // Parse the suggestions response
    const suggestions = parseTopicSuggestions(suggestionsText);

    return suggestions;
  } catch (error) {
    logger.error('Error suggesting topics:', error);
    throw new Error('Failed to suggest topics');
  }
};

/**
 * Improve argument
 * @param {Object} params - Argument improvement parameters
 * @returns {Promise<Object>} Improved argument and suggestions
 */
const improveArgument = async (params) => {
  try {
    const { argument, topic, side, focusAreas } = params;

    // Build improvement prompt
    const improvementPrompt = buildArgumentImprovementPrompt(argument, topic, side, focusAreas);

    // Generate improvements using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: improvementPrompt },
        { role: 'user', content: argument }
      ],
      max_tokens: 600,
      temperature: 0.4
    });

    const improvementText = completion.choices[0].message.content;

    // Parse the improvement response
    const improvements = parseArgumentImprovement(improvementText);

    return improvements;
  } catch (error) {
    logger.error('Error improving argument:', error);
    throw new Error('Failed to improve argument');
  }
};

/**
 * Validate evidence
 * @param {Object} params - Evidence validation parameters
 * @returns {Promise<Object>} Evidence validation results
 */
const validateEvidence = async (params) => {
  try {
    const { argument, topic, existingEvidence } = params;

    // Build validation prompt
    const validationPrompt = buildEvidenceValidationPrompt(argument, topic, existingEvidence);

    // Generate validation using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: validationPrompt },
        { role: 'user', content: 'Validate and suggest evidence for this argument.' }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const validationText = completion.choices[0].message.content;

    // Parse the validation response
    const validation = parseEvidenceValidation(validationText);

    return validation;
  } catch (error) {
    logger.error('Error validating evidence:', error);
    throw new Error('Failed to validate evidence');
  }
};

/**
 * Generate learning path
 * @param {Object} params - Learning path parameters
 * @returns {Promise<Object>} Learning path recommendations
 */
const generateLearningPath = async (params) => {
  try {
    const { skillLevel, interests, goals, stats, topicPreferences } = params;

    // Build learning path prompt
    const learningPathPrompt = buildLearningPathPrompt(skillLevel, interests, goals, stats, topicPreferences);

    // Generate learning path using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: learningPathPrompt },
        { role: 'user', content: 'Generate a personalized learning path for debate improvement.' }
      ],
      max_tokens: 1000,
      temperature: 0.4
    });

    const learningPathText = completion.choices[0].message.content;

    // Parse the learning path response
    const learningPath = parseLearningPath(learningPathText);

    return learningPath;
  } catch (error) {
    logger.error('Error generating learning path:', error);
    throw new Error('Failed to generate learning path');
  }
};

// Helper functions for building prompts and parsing responses

const buildSystemPrompt = (topic, aiSide, difficulty, session) => {
  const difficultyLevels = {
    easy: 'Beginner-friendly responses with clear explanations',
    medium: 'Balanced responses with moderate complexity',
    hard: 'Advanced responses with sophisticated arguments'
  };

  return `You are an AI debate opponent in a formal debate setting. You are arguing for the ${aiSide} side of the topic: "${topic.title}".

Topic Description: ${topic.description}
Your Side: ${aiSide}
Difficulty Level: ${difficultyLevels[difficulty]}

Guidelines:
- Stay in character as a debate opponent
- Use logical arguments and evidence when available
- Respond appropriately to the user's arguments
- Maintain a respectful and professional tone
- Keep responses concise but substantive
- Ask clarifying questions when needed
- Provide counter-arguments and rebuttals
- Use the provided evidence and arguments from the topic when relevant

Available evidence for your side: ${JSON.stringify(topic.evidence || [])}
Available arguments for your side: ${JSON.stringify(topic.arguments?.[aiSide] || [])}

Respond naturally to the user's message while following these guidelines.`;
};

const buildAnalysisPrompt = (debateContent, topic, chosenSide, includeDetailed) => {
  return `Analyze the following debate performance and provide a comprehensive evaluation.

Topic: ${topic.title}
User's Side: ${chosenSide}
Debate Content: ${debateContent}

Please provide an analysis in the following JSON format:
{
  "argumentStrength": <score 0-10>,
  "logicalConsistency": <score 0-10>,
  "evidenceUse": <score 0-10>,
  "rebuttalQuality": <score 0-10>,
  "overallScore": <score 0-10>,
  "feedback": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "detailedAnalysis": "comprehensive analysis text"
  }
}

Scoring criteria:
- Argument Strength: Quality and persuasiveness of arguments
- Logical Consistency: Coherence and logical flow
- Evidence Use: Appropriate use of facts and examples
- Rebuttal Quality: Effectiveness of counter-arguments
- Overall Score: Weighted average considering all factors

${includeDetailed ? 'Provide detailed analysis with specific examples from the debate content.' : 'Provide concise analysis focusing on key points.'}`;
};

const buildFeedbackPrompt = (session, metrics, userHistory, focusAreas, skillLevel) => {
  return `Generate personalized feedback for a debate session.

Session Details:
- Topic: ${session.topicId.title}
- User's Side: ${session.chosenSide}
- Final Score: ${metrics.overallScore}
- Skill Level: ${skillLevel}

Performance Metrics:
- Argument Strength: ${metrics.argumentStrength}/10
- Logical Consistency: ${metrics.logicalConsistency}/10
- Evidence Use: ${metrics.evidenceUse}/10
- Rebuttal Quality: ${metrics.rebuttalQuality}/10

User History: ${userHistory.length} previous debates
Focus Areas: ${focusAreas?.join(', ') || 'General improvement'}

Provide feedback in the following JSON format:
{
  "summary": "overall performance summary",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "specificSuggestions": [
    {
      "area": "argumentation",
      "suggestion": "specific suggestion",
      "example": "example or explanation"
    }
  ],
  "practiceRecommendations": ["recommendation1", "recommendation2"]
}

Focus on actionable advice tailored to the user's skill level and specific areas for improvement.`;
};

const buildTopicSuggestionPrompt = (interests, skillLevel, category, count, userHistory) => {
  return `Suggest debate topics based on the following criteria:

User Interests: ${interests?.join(', ') || 'General topics'}
Skill Level: ${skillLevel}
Preferred Category: ${category || 'Any'}
Number of Suggestions: ${count}
Previous Topics: ${userHistory.map(h => h.topicId.title).join(', ')}

Provide suggestions in the following JSON format:
[
  {
    "title": "Debate topic title",
    "description": "Brief description of the topic",
    "category": "topic category",
    "difficulty": "easy/medium/hard",
    "reasoning": "Why this topic is suitable"
  }
]

Consider the user's interests, skill level, and previous debate history to provide relevant and engaging topic suggestions.`;
};

const buildArgumentImprovementPrompt = (argument, topic, side, focusAreas) => {
  return `Improve the following argument for a debate.

Original Argument: ${argument}
Topic: ${topic}
Side: ${side}
Focus Areas: ${focusAreas?.join(', ') || 'General improvement'}

Provide improvements in the following JSON format:
{
  "improvedArgument": "enhanced version of the argument",
  "suggestions": [
    {
      "type": "clarity/evidence/logic/structure/persuasiveness",
      "description": "specific suggestion",
      "example": "example or explanation"
    }
  ],
  "reasoning": "explanation of improvements made"
}

Focus on making the argument more persuasive, logical, and well-supported while maintaining the original intent.`;
};

const buildEvidenceValidationPrompt = (argument, topic, existingEvidence) => {
  return `Validate and suggest evidence for the following argument.

Argument: ${argument}
Topic: ${topic}
Existing Evidence: ${JSON.stringify(existingEvidence || [])}

Provide validation in the following JSON format:
{
  "validation": [
    {
      "evidence": { "source": "...", "description": "..." },
      "isValid": true/false,
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "suggestions": [
    {
      "source": "evidence source",
      "description": "evidence description",
      "relevance": <score 0-10>,
      "credibility": <score 0-10>
    }
  ]
}

Evaluate the quality, relevance, and credibility of existing evidence and suggest additional evidence that would strengthen the argument.`;
};

const buildLearningPathPrompt = (skillLevel, interests, goals, stats, topicPreferences) => {
  return `Generate a personalized learning path for debate improvement.

Current Status:
- Skill Level: ${skillLevel}
- Interests: ${interests?.join(', ') || 'General'}
- Goals: ${goals || 'Improve debate skills'}
- Total Debates: ${stats.totalDebates}
- Average Score: ${stats.averageScore}
- Topic Preferences: ${topicPreferences.map(p => p._id).join(', ')}

Provide learning path in the following JSON format:
{
  "currentLevel": "beginner/intermediate/advanced/expert",
  "targetLevel": "next level to achieve",
  "milestones": [
    {
      "title": "milestone title",
      "description": "milestone description",
      "difficulty": "easy/medium/hard",
      "estimatedTime": "time estimate",
      "topics": ["topic1", "topic2"]
    }
  ],
  "recommendedTopics": ["topic1", "topic2"],
  "practiceExercises": ["exercise1", "exercise2"]
}

Create a structured learning path that builds upon the user's current skills and addresses their specific areas for improvement.`;
};

// Response parsing functions
const parseAnalysisResponse = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    logger.error('Error parsing analysis response:', error);
    return {
      argumentStrength: 5,
      logicalConsistency: 5,
      evidenceUse: 5,
      rebuttalQuality: 5,
      overallScore: 5,
      feedback: {
        strengths: ['Analysis completed'],
        weaknesses: ['Unable to parse detailed analysis'],
        suggestions: ['Continue practicing debate skills'],
        detailedAnalysis: text
      }
    };
  }
};

const parseFeedbackResponse = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    logger.error('Error parsing feedback response:', error);
    return {
      summary: 'Feedback generated successfully',
      strengths: ['Good effort in the debate'],
      areasForImprovement: ['Continue practicing'],
      specificSuggestions: [],
      practiceRecommendations: ['Practice regularly']
    };
  }
};

const parseTopicSuggestions = (text) => {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON array found in response');
  } catch (error) {
    logger.error('Error parsing topic suggestions:', error);
    return [];
  }
};

const parseArgumentImprovement = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    logger.error('Error parsing argument improvement:', error);
    return {
      improvedArgument: text,
      suggestions: [],
      reasoning: 'Improvement suggestions generated'
    };
  }
};

const parseEvidenceValidation = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    logger.error('Error parsing evidence validation:', error);
    return {
      validation: [],
      suggestions: []
    };
  }
};

const parseLearningPath = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    logger.error('Error parsing learning path:', error);
    return {
      currentLevel: 'beginner',
      targetLevel: 'intermediate',
      milestones: [],
      recommendedTopics: [],
      practiceExercises: []
    };
  }
};

// Utility functions
const analyzeResponseType = (content, userMessage) => {
  const lowerContent = content.toLowerCase();
  const lowerUserMessage = userMessage.toLowerCase();

  if (lowerContent.includes('question') || lowerContent.includes('?')) {
    return 'question';
  }
  if (lowerContent.includes('rebuttal') || lowerContent.includes('counter') || lowerContent.includes('however')) {
    return 'rebuttal';
  }
  if (lowerContent.includes('clarify') || lowerContent.includes('explain')) {
    return 'clarification';
  }
  return 'argument';
};

const calculateConfidence = (content, topic, aiSide) => {
  // Simple confidence calculation based on content length and complexity
  const wordCount = content.split(' ').length;
  const hasEvidence = content.includes('study') || content.includes('research') || content.includes('data');
  const hasLogic = content.includes('because') || content.includes('therefore') || content.includes('since');
  
  let confidence = 0.5; // Base confidence
  
  if (wordCount > 50) confidence += 0.1;
  if (wordCount > 100) confidence += 0.1;
  if (hasEvidence) confidence += 0.2;
  if (hasLogic) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
};

const generateReasoning = async (content, userMessage, topic) => {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: 'Provide a brief explanation of the reasoning behind this debate response.' },
        { role: 'user', content: `Response: ${content}\nUser's message: ${userMessage}\nTopic: ${topic.title}` }
      ],
      max_tokens: 100,
      temperature: 0.3
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    return 'Response generated based on debate context and topic information.';
  }
};

const generateSuggestions = async (content, topic, aiSide) => {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: 'Suggest 2-3 follow-up points or questions for the debate.' },
        { role: 'user', content: `Current response: ${content}\nTopic: ${topic.title}\nAI side: ${aiSide}` }
      ],
      max_tokens: 150,
      temperature: 0.6
    });
    
    const suggestions = completion.choices[0].message.content.split('\n').filter(s => s.trim());
    return suggestions.slice(0, 3);
  } catch (error) {
    return ['Continue the debate with your next argument.', 'Consider addressing the counter-points raised.'];
  }
};

module.exports = {
  generateResponse,
  analyzePerformance,
  generateFeedback,
  suggestTopics,
  improveArgument,
  validateEvidence,
  generateLearningPath
}; 