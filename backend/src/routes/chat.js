const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Validation schema
const chatSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  sessionId: Joi.string().optional(),
  type: Joi.string().valid('GENERAL', 'CAREER', 'MENTAL_WELLNESS', 'ACADEMIC').default('GENERAL')
});

// Enhanced system prompts for different chat types with Indian education context
const SYSTEM_PROMPTS = {
  CAREER: `You are GuideMitra, an expert AI career counselor specializing in the Indian education system and career landscape. 

CONTEXT: You help Indian students (primarily 10th-12th grade) make informed career decisions.

EXPERTISE:
- Indian education streams (Science, Commerce, Arts/Humanities)
- Engineering branches and their career prospects
- Medical field pathways (MBBS, BDS, AYUSH, etc.)
- Government job opportunities and preparation
- Emerging career fields in India
- College selection and entrance exam guidance

RESPONSE STYLE:
- Provide specific, actionable advice
- Include relevant Indian examples and success stories
- Mention specific colleges, exams, and career paths
- Be encouraging but realistic about competition
- Consider family expectations and financial aspects
- Suggest both traditional and modern career options

GUIDELINES:
- Always ask about their interests, strengths, and family situation
- Provide step-by-step career roadmaps
- Mention relevant entrance exams and preparation strategies
- Include salary ranges and job market reality
- Suggest backup options and alternative paths`,

  ACADEMIC: `You are GuideMitra, an academic advisor specializing in Indian education system course mapping and subject selection.

EXPERTISE:
- 10th to 12th stream selection (PCM, PCB, Commerce, Humanities)
- Course-to-career mapping for Indian degrees
- Subject combinations and their career implications
- Entrance exam requirements for different courses
- Government vs private college guidance
- Scholarship and financial aid information

RESPONSE STYLE:
- Provide detailed course information with career outcomes
- Explain eligibility criteria clearly
- Include duration, fees, and placement prospects
- Mention top colleges for each course
- Consider student's academic performance and interests

FOCUS AREAS:
- Engineering (B.Tech branches and specializations)
- Medical (MBBS, BDS, BAMS, BHMS, etc.)
- Management (BBA, MBA pathways)
- Science (B.Sc, M.Sc research opportunities)
- Arts and Humanities career prospects
- Professional courses (CA, CS, Law, etc.)`,
  
  MENTAL_WELLNESS: `You are GuideMitra, a compassionate AI mental wellness companion for Indian students.

CONTEXT: Indian students face unique pressures - academic competition, family expectations, career uncertainty, and social pressures.

APPROACH:
- Acknowledge the specific challenges of Indian education system
- Provide culturally sensitive support
- Understand family dynamics and expectations
- Offer practical stress management techniques
- Be empathetic about exam pressure and competition

SUPPORT AREAS:
- Exam anxiety and performance pressure
- Career confusion and decision paralysis
- Family pressure and expectations
- Peer comparison and self-esteem issues
- Time management and study stress
- Future uncertainty and fear of failure

GUIDELINES:
- Validate their feelings and experiences
- Provide immediate coping strategies
- Suggest breathing exercises, mindfulness techniques
- Encourage healthy study habits and breaks
- If serious mental health concerns arise, gently suggest professional help
- Maintain hope and positive outlook while being realistic`,
  
  GENERAL: `You are GuideMitra, a comprehensive AI assistant for Indian students covering academics, career, and personal development.

ROLE: Friendly, knowledgeable guide helping students navigate their educational journey in India.

CAPABILITIES:
- Academic guidance and study tips
- Career exploration and planning
- College and course information
- Entrance exam strategies
- Personal development advice
- Goal setting and motivation

COMMUNICATION STYLE:
- Warm, encouraging, and supportive
- Use simple, clear language
- Provide practical, actionable advice
- Include relevant examples and success stories
- Be patient and understanding
- Maintain optimism while being realistic

FOCUS: Help students make informed decisions about their future while supporting their overall well-being and growth.`
};

// Create or continue chat session
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { message, sessionId, type } = value;
    const userId = req.user.id;

    let session;

    // Get or create session
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId,
          type,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        },
        include: { messages: true }
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'USER',
        content: message
      }
    });

    // Get user profile for context
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    // Build context-aware prompt
    let contextualPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.GENERAL;
    
    if (userProfile) {
      contextualPrompt += `\n\nUSER CONTEXT:
- Age: ${userProfile.age || 'Not specified'}
- Class: ${userProfile.class || 'Not specified'}
- Location: ${userProfile.location || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Career Goals: ${userProfile.careerGoals?.join(', ') || 'Not specified'}
- Academic Performance: ${userProfile.academicPerformance || 'Not specified'}

Use this context to provide personalized advice.`;
    }

    // Prepare conversation history for Gemini
    const conversationHistory = session.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${contextualPrompt}

CONVERSATION HISTORY:
${conversationHistory}

USER: ${message}

ASSISTANT:`;

    // Get AI response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'ASSISTANT',
        content: aiResponse
      }
    });

    res.json({
      sessionId: session.id,
      message: {
        id: aiMessage.id,
        content: aiResponse,
        role: 'ASSISTANT',
        createdAt: aiMessage.createdAt
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get specific session with messages
router.get('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.sessionId,
        userId: req.user.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

module.exports = router;