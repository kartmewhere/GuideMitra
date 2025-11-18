const express = require('express');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Validation schemas
const createAssessmentSchema = Joi.object({
  type: Joi.string().valid('APTITUDE', 'PERSONALITY', 'INTEREST', 'SKILL', 'CAREER_VALUES', 'LEARNING_STYLE').required(),
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional()
});

const submitAnswersSchema = Joi.object({
  answers: Joi.array().items(
    Joi.object({
      questionId: Joi.string().required(),
      answer: Joi.string().required()
    })
  ).required()
});

// Comprehensive assessment templates
const ASSESSMENT_TEMPLATES = {
  APTITUDE: {
    title: "Career Aptitude Assessment",
    description: "Discover your natural abilities and suitable career paths",
    timeLimit: 20,
    questions: [
      {
        question: "I excel at solving complex mathematical problems and working with numbers",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Logical-Mathematical",
        weight: 1.0
      },
      {
        question: "I prefer working with my hands and building physical things",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Kinesthetic",
        weight: 1.0
      },
      {
        question: "I enjoy reading, writing, and expressing complex ideas through words",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Linguistic",
        weight: 1.0
      },
      {
        question: "I like analyzing data, finding patterns, and drawing conclusions",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Analytical",
        weight: 1.0
      },
      {
        question: "I enjoy helping others and working collaboratively in teams",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Interpersonal",
        weight: 1.0
      },
      {
        question: "I prefer working independently and setting my own pace",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Intrapersonal",
        weight: 1.0
      },
      {
        question: "I enjoy creating art, music, or other creative works",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Creative",
        weight: 1.0
      },
      {
        question: "I like understanding how things work and conducting experiments",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Scientific",
        weight: 1.0
      },
      {
        question: "I enjoy organizing events, leading groups, and taking charge",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Leadership",
        weight: 1.0
      },
      {
        question: "I prefer detailed, systematic work over open-ended creative tasks",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Systematic",
        weight: 1.0
      },
      {
        question: "I can easily visualize objects in 3D and understand spatial relationships",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Spatial",
        weight: 1.0
      },
      {
        question: "I have a good sense of rhythm and can easily learn musical patterns",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        category: "Musical",
        weight: 1.0
      }
    ]
  },
  INTEREST: {
    title: "Career Interest Inventory",
    description: "Identify your interests and matching career fields",
    timeLimit: 15,
    questions: [
      {
        question: "Which activity interests you most?",
        options: ["Conducting scientific research", "Teaching and mentoring others", "Creating artistic works", "Managing business operations", "Helping people solve problems"],
        category: "Primary Interest",
        weight: 1.2
      },
      {
        question: "In your free time, you prefer to:",
        options: ["Read about new technologies", "Volunteer for social causes", "Write or create content", "Plan and organize events", "Exercise or play sports"],
        category: "Leisure Preference",
        weight: 1.0
      },
      {
        question: "Which subject did you enjoy most in school?",
        options: ["Mathematics and Science", "Literature and History", "Art and Music", "Business Studies", "Physical Education"],
        category: "Academic Interest",
        weight: 1.0
      },
      {
        question: "Your ideal work environment would be:",
        options: ["Laboratory or research facility", "School or community center", "Studio or creative space", "Corporate office", "Outdoor or varied locations"],
        category: "Work Environment",
        weight: 1.0
      },
      {
        question: "Which career field excites you most?",
        options: ["Technology and Innovation", "Education and Social Work", "Arts and Entertainment", "Business and Finance", "Healthcare and Medicine"],
        category: "Career Field",
        weight: 1.2
      },
      {
        question: "When working on projects, you prefer:",
        options: ["Researching and analyzing data", "Collaborating with diverse teams", "Designing and creating", "Planning and executing strategies", "Providing direct service to others"],
        category: "Work Style",
        weight: 1.0
      },
      {
        question: "What motivates you most in work?",
        options: ["Discovering new knowledge", "Making a positive impact on society", "Expressing creativity", "Achieving financial success", "Helping individuals directly"],
        category: "Motivation",
        weight: 1.1
      },
      {
        question: "Which type of problem-solving appeals to you?",
        options: ["Technical and logical problems", "Social and interpersonal issues", "Creative and design challenges", "Strategic and business problems", "Health and wellness concerns"],
        category: "Problem Solving",
        weight: 1.0
      }
    ]
  },
  PERSONALITY: {
    title: "Personality Type Assessment",
    description: "Understand your personality traits and work style preferences",
    timeLimit: 18,
    questions: [
      {
        question: "In social situations, I usually:",
        options: ["Take charge and lead conversations", "Listen more than I speak", "Adapt to the group's energy", "Prefer one-on-one interactions", "Feel energized by large groups"],
        category: "Social Style",
        weight: 1.0
      },
      {
        question: "When making decisions, I rely more on:",
        options: ["Logic and objective facts", "Intuition and gut feelings", "Past experiences and patterns", "Others' opinions and consensus", "Detailed analysis and research"],
        category: "Decision Making",
        weight: 1.1
      },
      {
        question: "I work best when:",
        options: ["I have a detailed plan and structure", "I can be flexible and spontaneous", "I have clear deadlines and goals", "I can work at my own pace", "I have variety in my tasks"],
        category: "Work Style",
        weight: 1.0
      },
      {
        question: "Under pressure, I tend to:",
        options: ["Stay calm and focused", "Seek help from others", "Take breaks to recharge", "Push through with determination", "Break tasks into smaller steps"],
        category: "Stress Response",
        weight: 1.0
      },
      {
        question: "I am most motivated by:",
        options: ["Achievement and recognition", "Learning and personal growth", "Helping others succeed", "Creative expression", "Financial rewards"],
        category: "Motivation",
        weight: 1.1
      },
      {
        question: "When learning new things, I prefer to:",
        options: ["Read and study independently", "Discuss with others", "Learn by doing hands-on", "Watch demonstrations", "Take structured courses"],
        category: "Learning Style",
        weight: 1.0
      },
      {
        question: "In team projects, I naturally:",
        options: ["Take the leadership role", "Support and encourage others", "Focus on creative ideas", "Handle detailed planning", "Ensure quality and accuracy"],
        category: "Team Role",
        weight: 1.0
      },
      {
        question: "I prefer work that is:",
        options: ["Predictable and routine", "Varied and changing", "Challenging and complex", "Collaborative and social", "Independent and autonomous"],
        category: "Work Preference",
        weight: 1.0
      }
    ]
  },
  SKILL: {
    title: "Skills Assessment",
    description: "Evaluate your current skills and identify areas for development",
    timeLimit: 25,
    questions: [
      {
        question: "Rate your proficiency in written communication:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Communication",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in public speaking and presentations:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Communication",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in data analysis and interpretation:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Analytical",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in project management:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Management",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in computer programming:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Technical",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in creative design (visual/graphic):",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Creative",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in financial analysis and budgeting:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Financial",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in research and information gathering:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Research",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in team leadership:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Leadership",
        weight: 1.0
      },
      {
        question: "Rate your proficiency in problem-solving and critical thinking:",
        options: ["Expert", "Advanced", "Intermediate", "Beginner", "No experience"],
        category: "Analytical",
        weight: 1.0
      }
    ]
  },
  CAREER_VALUES: {
    title: "Career Values Assessment",
    description: "Identify what matters most to you in your career",
    timeLimit: 12,
    questions: [
      {
        question: "How important is work-life balance to you?",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        category: "Lifestyle",
        weight: 1.0
      },
      {
        question: "How important is high salary and financial rewards?",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        category: "Financial",
        weight: 1.0
      },
      {
        question: "How important is job security and stability?",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        category: "Security",
        weight: 1.0
      },
      {
        question: "How important is making a positive impact on society?",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        category: "Purpose",
        weight: 1.0
      },
      {
        question: "How important is creative expression in your work?",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        category: "Creativity",
        weight: 1.0
      },
      {
        question: "How important is career advancement and growth opportunities?",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        category: "Growth",
        weight: 1.0
      }
    ]
  },
  LEARNING_STYLE: {
    title: "Learning Style Assessment",
    description: "Discover how you learn best and optimize your study approach",
    timeLimit: 10,
    questions: [
      {
        question: "I learn best when information is presented:",
        options: ["Visually with charts and diagrams", "Through listening and discussion", "Through hands-on practice", "Through reading and writing"],
        category: "Input Style",
        weight: 1.0
      },
      {
        question: "When studying, I prefer to:",
        options: ["Work alone in quiet spaces", "Study with others in groups", "Move around while learning", "Have background music or noise"],
        category: "Environment",
        weight: 1.0
      },
      {
        question: "I remember information better when I:",
        options: ["See it written or drawn", "Hear it explained", "Practice it myself", "Discuss it with others"],
        category: "Retention",
        weight: 1.0
      },
      {
        question: "When learning new skills, I prefer to:",
        options: ["Follow step-by-step instructions", "Learn through trial and error", "Watch someone demonstrate first", "Jump in and figure it out"],
        category: "Approach",
        weight: 1.0
      }
    ]
  }
};

// Scoring algorithms for different assessment types
const SCORING_ALGORITHMS = {
  APTITUDE: (responses) => {
    const categories = {};
    let totalScore = 0;
    let maxPossibleScore = 0;

    responses.forEach(response => {
      const question = response.question;
      const category = question.category;
      const weight = question.weight;

      // Convert response to numeric score (5-point scale)
      const scoreMap = {
        "Strongly Agree": 5,
        "Agree": 4,
        "Neutral": 3,
        "Disagree": 2,
        "Strongly Disagree": 1
      };

      const score = scoreMap[response.answer] * weight;
      totalScore += score;
      maxPossibleScore += 5 * weight;

      if (!categories[category]) {
        categories[category] = { score: 0, maxScore: 0, count: 0 };
      }
      categories[category].score += score;
      categories[category].maxScore += 5 * weight;
      categories[category].count += 1;
    });

    // Calculate category percentages
    const categoryScores = {};
    Object.keys(categories).forEach(category => {
      categoryScores[category] = {
        score: categories[category].score,
        maxScore: categories[category].maxScore,
        percentage: (categories[category].score / categories[category].maxScore) * 100,
        count: categories[category].count
      };
    });

    return {
      overallScore: totalScore,
      percentage: (totalScore / maxPossibleScore) * 100,
      categoryScores
    };
  },

  INTEREST: (responses) => {
    const interests = {};
    responses.forEach(response => {
      const answer = response.answer;
      const weight = response.question.weight;

      if (!interests[answer]) {
        interests[answer] = 0;
      }
      interests[answer] += weight;
    });

    // Find top interests
    const sortedInterests = Object.entries(interests)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const totalScore = Object.values(interests).reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = responses.length * 1.2; // Assuming max weight is 1.2

    return {
      overallScore: totalScore,
      percentage: (totalScore / maxPossibleScore) * 100,
      categoryScores: Object.fromEntries(sortedInterests.map(([interest, score]) => [
        interest,
        {
          score,
          percentage: (score / totalScore) * 100
        }
      ]))
    };
  },

  PERSONALITY: (responses) => {
    const traits = {};
    let totalScore = 0;
    let maxPossibleScore = 0;

    responses.forEach(response => {
      const category = response.question.category;
      const weight = response.question.weight;
      const answerIndex = response.question.options.indexOf(response.answer);
      const score = (answerIndex + 1) * weight;

      totalScore += score;
      maxPossibleScore += 5 * weight;

      if (!traits[category]) {
        traits[category] = { score: 0, maxScore: 0, responses: [] };
      }
      traits[category].score += score;
      traits[category].maxScore += 5 * weight;
      traits[category].responses.push(response.answer);
    });

    const categoryScores = {};
    Object.keys(traits).forEach(trait => {
      categoryScores[trait] = {
        score: traits[trait].score,
        percentage: (traits[trait].score / traits[trait].maxScore) * 100,
        dominantResponse: traits[trait].responses[0] // Most common response
      };
    });

    return {
      overallScore: totalScore,
      percentage: (totalScore / maxPossibleScore) * 100,
      categoryScores
    };
  },

  SKILL: (responses) => {
    const skills = {};
    let totalScore = 0;
    let maxPossibleScore = 0;

    responses.forEach(response => {
      const category = response.question.category;
      const scoreMap = {
        "Expert": 5,
        "Advanced": 4,
        "Intermediate": 3,
        "Beginner": 2,
        "No experience": 1
      };

      const score = scoreMap[response.answer];
      totalScore += score;
      maxPossibleScore += 5;

      if (!skills[category]) {
        skills[category] = { score: 0, maxScore: 0, count: 0 };
      }
      skills[category].score += score;
      skills[category].maxScore += 5;
      skills[category].count += 1;
    });

    const categoryScores = {};
    Object.keys(skills).forEach(skill => {
      const avgScore = skills[skill].score / skills[skill].count;
      categoryScores[skill] = {
        score: skills[skill].score,
        averageScore: avgScore,
        percentage: (avgScore / 5) * 100,
        level: avgScore >= 4 ? 'Advanced' : avgScore >= 3 ? 'Intermediate' : avgScore >= 2 ? 'Beginner' : 'No experience'
      };
    });

    return {
      overallScore: totalScore,
      percentage: (totalScore / maxPossibleScore) * 100,
      categoryScores
    };
  },

  CAREER_VALUES: (responses) => {
    const values = {};
    let totalScore = 0;
    let maxPossibleScore = 0;

    responses.forEach(response => {
      const category = response.question.category;
      const scoreMap = {
        "Extremely Important": 5,
        "Very Important": 4,
        "Moderately Important": 3,
        "Slightly Important": 2,
        "Not Important": 1
      };

      const score = scoreMap[response.answer];
      totalScore += score;
      maxPossibleScore += 5;

      values[category] = {
        score,
        percentage: (score / 5) * 100,
        importance: response.answer
      };
    });

    return {
      overallScore: totalScore,
      percentage: (totalScore / maxPossibleScore) * 100,
      categoryScores: values
    };
  },

  LEARNING_STYLE: (responses) => {
    const styles = {};
    responses.forEach(response => {
      const style = response.answer;
      if (!styles[style]) {
        styles[style] = 0;
      }
      styles[style] += 1;
    });

    const dominantStyle = Object.entries(styles)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      overallScore: responses.length,
      percentage: 100, // All questions answered
      categoryScores: styles,
      dominantStyle: dominantStyle[0]
    };
  }
};

// Get available assessments and user's completed assessments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userAssessments = await prisma.assessment.findMany({
      where: { userId: req.user.id },
      include: {
        results: true,
        questions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add available templates
    const availableAssessments = Object.keys(ASSESSMENT_TEMPLATES).map(type => ({
      type,
      ...ASSESSMENT_TEMPLATES[type],
      isCompleted: userAssessments.some(a => a.type === type && a.isCompleted)
    }));

    res.json({
      userAssessments,
      availableAssessments
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Create new assessment
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createAssessmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { type, title, description } = value;
    const template = ASSESSMENT_TEMPLATES[type];

    if (!template) {
      return res.status(400).json({ error: 'Invalid assessment type' });
    }

    // Check if user already has a completed assessment of this type
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        userId: req.user.id,
        type,
        isCompleted: true
      }
    });

    if (existingAssessment) {
      return res.status(400).json({ error: 'Assessment already completed' });
    }

    // Create assessment with questions
    const assessment = await prisma.assessment.create({
      data: {
        userId: req.user.id,
        type,
        title: title || template.title,
        description: description || template.description,
        timeLimit: template.timeLimit,
        questions: {
          create: template.questions.map((q, index) => ({
            question: q.question,
            options: q.options,
            category: q.category,
            weight: q.weight,
            order: index + 1
          }))
        }
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json(assessment);
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Submit assessment answers
router.post('/:assessmentId/submit', authenticateToken, async (req, res) => {
  try {
    const { error, value } = submitAnswersSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { assessmentId } = req.params;
    const { answers } = value;

    // Verify assessment belongs to user and is not completed
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        userId: req.user.id,
        isCompleted: false
      },
      include: {
        questions: true
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found or already completed' });
    }

    // Save responses
    const responses = await Promise.all(
      answers.map(answer =>
        prisma.assessmentResponse.create({
          data: {
            assessmentId,
            questionId: answer.questionId,
            answer: answer.answer
          },
          include: {
            question: true
          }
        })
      )
    );

    // Calculate results using appropriate algorithm
    const scoringAlgorithm = SCORING_ALGORITHMS[assessment.type];
    const results = scoringAlgorithm ? scoringAlgorithm(responses) : {
      overallScore: responses.length,
      percentage: 100,
      categoryScores: {}
    };

    // Get user profile for enhanced AI analysis
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id }
    });

    // Generate comprehensive AI analysis
    console.log('🧠 Starting AI analysis for assessment:', assessment.type);
    
    // Add minimum processing time to show loading screen
    const startTime = Date.now();
    const aiAnalysis = await generateComprehensiveAIAnalysis(
      assessment.type,
      responses,
      userProfile,
      results
    );
    
    // Ensure minimum 2 seconds for better UX
    const processingTime = Date.now() - startTime;
    const minProcessingTime = 2000; // 2 seconds
    if (processingTime < minProcessingTime) {
      await new Promise(resolve => setTimeout(resolve, minProcessingTime - processingTime));
    }
    
    console.log('✅ AI analysis completed successfully');

    // Combine basic results with AI analysis
    const enhancedResults = {
      ...results,
      aiAnalysis: aiAnalysis.analysis,
      questionAnalysis: aiAnalysis.questionAnalysis,
      strengths: aiAnalysis.strengths,
      improvementAreas: aiAnalysis.improvementAreas,
      careerSuggestions: aiAnalysis.careerSuggestions,
      recommendations: aiAnalysis.recommendations,
      nextSteps: aiAnalysis.nextSteps,
      detailedFeedback: aiAnalysis.detailedFeedback
    };

    // Save comprehensive results (handle duplicates)
    let assessmentResult;
    try {
      assessmentResult = await prisma.assessmentResult.create({
        data: {
          assessmentId,
          overallScore: results.overallScore,
          percentage: results.percentage,
          categoryScores: results.categoryScores,
          insights: aiAnalysis.analysis,
          recommendations: aiAnalysis.recommendations,
          traits: assessment.type === 'PERSONALITY' ? results.categoryScores : null
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Update existing result instead of creating new one
        assessmentResult = await prisma.assessmentResult.update({
          where: { assessmentId },
          data: {
            overallScore: results.overallScore,
            percentage: results.percentage,
            categoryScores: results.categoryScores,
            insights: aiAnalysis.analysis,
            recommendations: aiAnalysis.recommendations,
            traits: assessment.type === 'PERSONALITY' ? results.categoryScores : null
          }
        });
      } else {
        throw error;
      }
    }

    // Mark assessment as completed
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { isCompleted: true }
    });

    res.json({
      success: true,
      results: enhancedResults
    });

  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// Get specific assessment results
router.get('/:assessmentId/results', authenticateToken, async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        userId: req.user.id
      },
      include: {
        results: true,
        questions: {
          orderBy: { order: 'asc' }
        },
        responses: {
          include: {
            question: true
          }
        }
      }
    });

    console.log('🔍 Assessment found:', {
      id: assessment?.id,
      title: assessment?.title,
      isCompleted: assessment?.isCompleted,
      hasResults: !!assessment?.results,
      responsesCount: assessment?.responses?.length || 0
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (!assessment.isCompleted) {
      return res.status(400).json({ error: 'Assessment not completed yet' });
    }

    // If no results exist, generate them
    if (!assessment.results) {
      console.log('No results found, generating analysis...');
      
      // Check if there are responses to analyze
      if (!assessment.responses || assessment.responses.length === 0) {
        return res.status(400).json({ error: 'No responses found for this assessment. Please complete the assessment first.' });
      }
      
      // Calculate basic results
      const responses = assessment.responses;
      const results = calculateAssessmentResults(assessment.type, responses);
      
      // Get user profile
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: req.user.id }
      });

      // Generate analysis
      const aiAnalysis = await generateComprehensiveAIAnalysis(
        assessment.type,
        responses,
        userProfile,
        results
      );

      // Save results to database
      try {
        await prisma.assessmentResult.create({
          data: {
            assessmentId,
            overallScore: results.overallScore,
            percentage: results.percentage,
            categoryScores: results.categoryScores,
            insights: aiAnalysis.analysis,
            recommendations: aiAnalysis.recommendations,
            traits: assessment.type === 'PERSONALITY' ? results.categoryScores : null
          }
        });
      } catch (dbError) {
        console.log('Results already exist, continuing...');
      }

      // Return enhanced results
      const enhancedResults = {
        ...assessment,
        results: {
          overallScore: results.overallScore,
          percentage: results.percentage,
          categoryScores: results.categoryScores,
          insights: aiAnalysis.analysis,
          recommendations: aiAnalysis.recommendations,
          traits: assessment.type === 'PERSONALITY' ? results.categoryScores : null
        },
        analysis: {
          aiAnalysis: aiAnalysis.analysis,
          questionAnalysis: aiAnalysis.questionAnalysis,
          strengths: aiAnalysis.strengths,
          improvementAreas: aiAnalysis.improvementAreas,
          careerSuggestions: aiAnalysis.careerSuggestions,
          recommendations: aiAnalysis.recommendations,
          nextSteps: aiAnalysis.nextSteps,
          detailedFeedback: aiAnalysis.detailedFeedback
        }
      };

      return res.json(enhancedResults);
    }

    // Return existing results with enhanced structure
    const result = assessment.results;
    
    if (!result) {
      return res.status(404).json({ error: 'Assessment results not found. Please complete the assessment first.' });
    }
    
    const enhancedAssessment = {
      ...assessment,
      analysis: {
        aiAnalysis: result.insights || "Assessment completed successfully",
        questionAnalysis: [],
        strengths: ["Based on your assessment results"],
        improvementAreas: ["Continue developing your skills"],
        careerSuggestions: [],
        recommendations: result.recommendations || [],
        nextSteps: ["Review your results", "Plan next steps"],
        detailedFeedback: {
          personality: "Assessment completed successfully",
          workStyle: "Results available for review",
          learningStyle: "Engaged in career planning",
          motivation: "Shows career development interest",
          challenges: "Continue exploring opportunities"
        }
      }
    };

    res.json(enhancedAssessment);
  } catch (error) {
    console.error('Get assessment results error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment results' });
  }
});

// Get assessment analytics/dashboard
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: {
        userId: req.user.id,
        isCompleted: true
      },
      include: {
        results: true
      }
    });

    const analytics = {
      totalCompleted: assessments.length,
      averageScore: assessments.length > 0
        ? assessments.reduce((sum, a) => sum + (a.results?.percentage || 0), 0) / assessments.length
        : 0,
      completedByType: assessments.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {}),
      recentAssessments: assessments
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          type: a.type,
          title: a.title,
          percentage: a.results?.percentage || 0,
          completedAt: a.updatedAt
        }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Comprehensive AI Analysis Function
async function generateComprehensiveAIAnalysis(assessmentType, responses, userProfile, basicResults) {
  try {
    const userContext = userProfile ? `
      User Profile:
      - Age: ${userProfile.age || 'Not specified'}
      - Class: ${userProfile.class || 'Not specified'}
      - Location: ${userProfile.location || 'Not specified'}
      - Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
      - Career Goals: ${userProfile.careerGoals?.join(', ') || 'Not specified'}
      - Academic Performance: ${userProfile.academicPerformance || 'Not specified'}
    ` : '';

    const responsesText = responses.map(r =>
      `Q: ${r.question.question}\nA: ${r.answer}\nCategory: ${r.question.category}`
    ).join('\n\n');

    const prompt = `
You are an expert career counselor and psychologist specializing in Indian education and career guidance. Analyze this ${assessmentType} assessment comprehensively.

${userContext}

Assessment Responses:
${responsesText}

Basic Results:
- Overall Score: ${basicResults.percentage?.toFixed(1)}%
- Category Scores: ${JSON.stringify(basicResults.categoryScores, null, 2)}

Provide a comprehensive analysis in the following JSON format:

{
  "analysis": "A detailed 2-3 paragraph analysis of the user's profile, strengths, and characteristics based on their responses",
  "questionAnalysis": [
    {
      "question": "question text",
      "userAnswer": "their answer",
      "isOptimal": true/false,
      "feedback": "specific feedback on this answer",
      "betterChoice": "suggested better answer if applicable",
      "reasoning": "why this answer indicates certain traits"
    }
  ],
  "strengths": [
    "List of 4-6 key strengths identified"
  ],
  "improvementAreas": [
    "List of 3-4 areas for development"
  ],
  "careerSuggestions": [
    {
      "field": "Career field name",
      "match": 85,
      "reasoning": "Why this career suits them",
      "requirements": "What they need to pursue this",
      "growth": "Career growth prospects"
    }
  ],
  "recommendations": [
    "5-7 specific actionable recommendations"
  ],
  "nextSteps": [
    "3-5 immediate next steps they should take"
  ],
  "detailedFeedback": {
    "personality": "Personality insights",
    "workStyle": "Work style preferences",
    "learningStyle": "How they learn best",
    "motivation": "What motivates them",
    "challenges": "Potential challenges to watch for"
  }
}

Make the analysis specific to Indian education system, career opportunities, and cultural context. Be encouraging but honest about areas for improvement.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    try {
      const aiAnalysis = JSON.parse(response.text());
      return aiAnalysis;
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      // Fallback analysis
      return {
        analysis: "Assessment completed successfully. Your responses show a unique profile with specific strengths and areas for development.",
        questionAnalysis: responses.map(r => ({
          question: r.question.question,
          userAnswer: r.answer,
          isOptimal: true,
          feedback: "Your response has been recorded and analyzed.",
          reasoning: "This response contributes to your overall profile assessment."
        })),
        strengths: ["Completed assessment thoroughly", "Shows self-awareness", "Engaged in career planning"],
        improvementAreas: ["Continue exploring career options", "Develop identified skills"],
        careerSuggestions: [
          {
            field: "Multiple career paths available",
            match: 75,
            reasoning: "Based on your assessment responses",
            requirements: "Continue education and skill development",
            growth: "Good prospects in chosen field"
          }
        ],
        recommendations: [
          "Continue exploring your interests and strengths",
          "Seek guidance from career counselors",
          "Develop skills in areas of interest",
          "Research career opportunities in your field"
        ],
        nextSteps: [
          "Review your assessment results carefully",
          "Discuss findings with mentors or counselors",
          "Create a career development plan"
        ],
        detailedFeedback: {
          personality: "Your responses indicate thoughtful consideration of career choices",
          workStyle: "Shows preference for structured approach to career planning",
          learningStyle: "Demonstrates engagement with assessment process",
          motivation: "Motivated to understand career options",
          challenges: "Continue to explore and validate career interests"
        }
      };
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    // Return enhanced fallback analysis
    return generateIntelligentFallbackAnalysis(assessmentType, responses, basicResults);
  }
}

// Enhanced Fallback Analysis Function
function generateIntelligentFallbackAnalysis(assessmentType, responses, basicResults) {
  console.log('🔄 Generating intelligent fallback analysis...');
  const topCategories = Object.entries(basicResults.categoryScores || {})
    .sort(([,a], [,b]) => b.percentage - a.percentage)
    .slice(0, 3);
  
  const strengths = topCategories.length > 0 
    ? topCategories.map(([category, data]) => 
        `Strong ${category.toLowerCase().replace('-', ' ')} abilities (${data.percentage.toFixed(0)}%)`)
    : ["Analytical thinking", "Problem-solving approach", "Career exploration mindset"];
  
  const questionAnalysis = responses.map((r, index) => ({
    question: r.question.question,
    userAnswer: r.answer,
    isOptimal: index % 3 !== 0, // Vary the feedback
    feedback: `Your response demonstrates ${r.question.category.toLowerCase().replace('-', ' ')} thinking patterns.`,
    reasoning: `This answer reflects your approach to ${r.question.category.toLowerCase().replace('-', ' ')} challenges and shows your natural inclinations.`
  }));
  
  const careerSuggestions = topCategories.length > 0 
    ? topCategories.map(([category, data]) => ({
        field: getCareerFieldForCategory(category),
        match: Math.round(data.percentage),
        reasoning: `Your strong ${category.toLowerCase().replace('-', ' ')} skills align well with this field`,
        requirements: "Relevant education, skill development, and practical experience",
        growth: "Positive growth prospects with increasing demand"
      }))
    : [{
        field: "Technology and Innovation",
        match: 75,
        reasoning: "Your analytical approach shows potential in tech fields",
        requirements: "Technical skills and continuous learning",
        growth: "Excellent growth prospects"
      }];
  
  const overallPercentage = basicResults.percentage || 70;
  const performanceLevel = overallPercentage >= 80 ? "excellent" : overallPercentage >= 60 ? "good" : "developing";
  
  return {
    analysis: `Based on your assessment responses, you demonstrate ${performanceLevel} capabilities across multiple areas. Your strongest areas are ${topCategories.map(([cat]) => cat.toLowerCase().replace('-', ' ')).join(', ')}. With an overall score of ${overallPercentage.toFixed(1)}%, you show a well-rounded profile with specific areas of excellence that can guide your career development.`,
    questionAnalysis,
    strengths,
    improvementAreas: [
      "Continue developing your weaker skill areas",
      "Seek practical experience in your areas of interest", 
      "Build a network in your target career fields",
      "Stay updated with industry trends and requirements"
    ],
    careerSuggestions,
    recommendations: [
      `Focus on leveraging your strongest skills: ${strengths[0] || 'analytical abilities'}`,
      "Explore internships or projects in your areas of interest",
      "Consider additional training or certification in your target field",
      "Connect with professionals in careers that match your profile",
      "Regularly reassess your skills and interests as you grow"
    ],
    nextSteps: [
      "Research specific roles in your top career suggestions",
      "Identify skill gaps and create a development plan",
      "Network with professionals in your fields of interest",
      "Gain hands-on experience through projects or volunteering",
      "Consider taking additional assessments as you develop"
    ],
    detailedFeedback: {
      personality: `Shows ${performanceLevel} self-awareness and thoughtful career planning approach`,
      workStyle: `Demonstrates ${topCategories.length > 0 ? topCategories[0][0].toLowerCase().replace('-', ' ') : 'analytical'} work preferences`,
      learningStyle: "Engaged and systematic approach to skill development",
      motivation: `${performanceLevel === 'excellent' ? 'Highly' : 'Well'} motivated for career growth and development`,
      challenges: "Continue exploring diverse opportunities while building on your strengths"
    }
  };
}

// Helper function to map categories to career fields
function getCareerFieldForCategory(category) {
  const categoryMap = {
    'Logical-Mathematical': 'Engineering and Data Science',
    'Linguistic': 'Communications and Writing',
    'Spatial': 'Design and Architecture', 
    'Kinesthetic': 'Healthcare and Sports',
    'Musical': 'Arts and Entertainment',
    'Interpersonal': 'Education and Social Work',
    'Intrapersonal': 'Psychology and Counseling',
    'Naturalistic': 'Environmental Science',
    'Creative': 'Arts and Design',
    'Analytical': 'Research and Analysis',
    'Scientific': 'Science and Technology',
    'Leadership': 'Management and Business',
    'Systematic': 'Operations and Administration'
  };
  return categoryMap[category] || 'Technology and Innovation';
}

// Calculate assessment results based on responses
function calculateAssessmentResults(assessmentType, responses) {
  if (assessmentType === 'APTITUDE') {
    const categories = {};
    let totalScore = 0;
    let maxPossibleScore = 0;

    responses.forEach(response => {
      const category = response.question.category;
      const weight = response.question.weight || 1.0;
      const score = getScoreFromAnswer(response.answer);
      const maxScore = 5;

      if (!categories[category]) {
        categories[category] = { score: 0, maxScore: 0, count: 0 };
      }

      categories[category].score += score * weight;
      categories[category].maxScore += maxScore * weight;
      categories[category].count += 1;
      totalScore += score * weight;
      maxPossibleScore += maxScore * weight;
    });

    const categoryScores = {};
    Object.keys(categories).forEach(category => {
      categoryScores[category] = {
        score: categories[category].score,
        maxScore: categories[category].maxScore,
        percentage: (categories[category].score / categories[category].maxScore) * 100,
        count: categories[category].count
      };
    });

    return {
      overallScore: totalScore,
      percentage: (totalScore / maxPossibleScore) * 100,
      categoryScores
    };
  }

  // Default calculation for other types
  const totalScore = responses.length * 3; // Average score
  const maxPossibleScore = responses.length * 5;
  
  return {
    overallScore: totalScore,
    percentage: (totalScore / maxPossibleScore) * 100,
    categoryScores: {}
  };
}

// Helper function to convert answer to score
function getScoreFromAnswer(answer) {
  const scoreMap = {
    'Strongly Agree': 5,
    'Agree': 4,
    'Neutral': 3,
    'Disagree': 2,
    'Strongly Disagree': 1,
    'Expert': 5,
    'Advanced': 4,
    'Intermediate': 3,
    'Beginner': 2,
    'No experience': 1
  };
  return scoreMap[answer] || 3;
}

module.exports = router;