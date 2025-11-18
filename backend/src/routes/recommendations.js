const express = require('express');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Validation schemas
const roadmapSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  targetRole: Joi.string().min(2).max(100).required(),
  milestones: Joi.array().items(
    Joi.object({
      title: Joi.string().min(3).max(100).required(),
      description: Joi.string().max(300).optional(),
      type: Joi.string().valid('COURSE', 'PROJECT', 'SKILL', 'CERTIFICATION', 'EXPERIENCE').required(),
      resources: Joi.object().optional()
    })
  ).min(1).required()
});

// Course-to-Career mapping data
const COURSE_CAREER_MAPPING = {
  'Computer Science Engineering': {
    careers: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Tech Entrepreneur', 'AI/ML Engineer'],
    skills: ['Programming', 'Data Structures', 'Algorithms', 'System Design'],
    averageSalary: '₹6-25 LPA',
    topColleges: ['IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'NIT Trichy'],
    entranceExams: ['JEE Main', 'JEE Advanced', 'BITSAT']
  },
  'MBBS': {
    careers: ['General Physician', 'Specialist Doctor', 'Surgeon', 'Medical Researcher', 'Public Health Officer'],
    skills: ['Medical Knowledge', 'Patient Care', 'Communication', 'Empathy'],
    averageSalary: '₹8-30 LPA',
    topColleges: ['AIIMS Delhi', 'CMC Vellore', 'JIPMER', 'KGMU'],
    entranceExams: ['NEET UG']
  },
  'Mechanical Engineering': {
    careers: ['Mechanical Engineer', 'Automotive Engineer', 'Manufacturing Engineer', 'Design Engineer'],
    skills: ['CAD/CAM', 'Thermodynamics', 'Manufacturing', 'Problem Solving'],
    averageSalary: '₹4-15 LPA',
    topColleges: ['IIT Madras', 'IIT Kharagpur', 'NIT Warangal'],
    entranceExams: ['JEE Main', 'JEE Advanced']
  },
  'Business Administration': {
    careers: ['Business Analyst', 'Marketing Manager', 'Consultant', 'Entrepreneur', 'Operations Manager'],
    skills: ['Leadership', 'Finance', 'Marketing', 'Strategy', 'Communication'],
    averageSalary: '₹5-20 LPA',
    topColleges: ['IIM Ahmedabad', 'ISB Hyderabad', 'XLRI Jamshedpur'],
    entranceExams: ['CAT', 'XAT', 'GMAT']
  }
};

// Sample recommendation data (in production, this would come from ML models)
const SAMPLE_RECOMMENDATIONS = {
  'software-engineer': {
    courses: [
      { title: 'JavaScript Fundamentals', provider: 'FreeCodeCamp', url: 'https://freecodecamp.org', difficulty: 'Beginner' },
      { title: 'React Development', provider: 'Coursera', url: 'https://coursera.org', difficulty: 'Intermediate' },
      { title: 'Node.js Backend Development', provider: 'Udemy', url: 'https://udemy.com', difficulty: 'Intermediate' }
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Git', 'SQL', 'Problem Solving'],
    projects: [
      { title: 'Personal Portfolio Website', description: 'Build a responsive portfolio using React' },
      { title: 'Todo App with Backend', description: 'Full-stack application with CRUD operations' },
      { title: 'E-commerce Platform', description: 'Complete online store with payment integration' }
    ]
  },
  'data-scientist': {
    courses: [
      { title: 'Python for Data Science', provider: 'Coursera', url: 'https://coursera.org', difficulty: 'Beginner' },
      { title: 'Machine Learning Basics', provider: 'edX', url: 'https://edx.org', difficulty: 'Intermediate' },
      { title: 'Deep Learning Specialization', provider: 'Coursera', url: 'https://coursera.org', difficulty: 'Advanced' }
    ],
    skills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'Statistics'],
    projects: [
      { title: 'Data Analysis Project', description: 'Analyze real-world dataset and create visualizations' },
      { title: 'Predictive Model', description: 'Build ML model to predict outcomes' },
      { title: 'Deep Learning Application', description: 'Create neural network for image classification' }
    ]
  }
};

// Get personalized recommendations
router.get('/career/:role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    const normalizedRole = role.toLowerCase().replace(/\s+/g, '-');
    
    // Get user profile for personalization
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true }
    });

    // In production, this would use ML algorithms
    const recommendations = SAMPLE_RECOMMENDATIONS[normalizedRole] || SAMPLE_RECOMMENDATIONS['software-engineer'];
    
    // Filter based on user's existing skills
    const userSkills = user.profile?.skills || [];
    const newSkills = recommendations.skills.filter(skill => 
      !userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
    );

    res.json({
      role: role,
      recommendations: {
        ...recommendations,
        suggestedNewSkills: newSkills.slice(0, 5)
      },
      personalization: {
        basedOnSkills: userSkills,
        basedOnInterests: user.profile?.interests || []
      }
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Create career roadmap
router.post('/roadmap', authenticateToken, async (req, res) => {
  try {
    const { error, value } = roadmapSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, targetRole, milestones } = value;

    const roadmap = await prisma.careerRoadmap.create({
      data: {
        userId: req.user.id,
        title,
        description,
        targetRole,
        milestones: {
          create: milestones.map((milestone, index) => ({
            ...milestone,
            order: index + 1
          }))
        }
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.status(201).json({
      message: 'Career roadmap created successfully',
      roadmap
    });
  } catch (error) {
    console.error('Create roadmap error:', error);
    res.status(500).json({ error: 'Failed to create roadmap' });
  }
});

// Get user's roadmaps
router.get('/roadmaps', authenticateToken, async (req, res) => {
  try {
    const roadmaps = await prisma.careerRoadmap.findMany({
      where: { userId: req.user.id },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(roadmaps);
  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

// Update milestone completion
router.patch('/milestone/:milestoneId/complete', authenticateToken, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { isCompleted } = req.body;

    // Verify milestone belongs to user
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: {
        id: milestoneId,
        roadmap: { userId: req.user.id }
      },
      include: { roadmap: true }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Update milestone
    const updatedMilestone = await prisma.roadmapMilestone.update({
      where: { id: milestoneId },
      data: { isCompleted: Boolean(isCompleted) }
    });

    // Recalculate roadmap progress
    const allMilestones = await prisma.roadmapMilestone.findMany({
      where: { roadmapId: milestone.roadmapId }
    });

    const completedCount = allMilestones.filter(m => m.isCompleted).length;
    const progress = (completedCount / allMilestones.length) * 100;

    await prisma.careerRoadmap.update({
      where: { id: milestone.roadmapId },
      data: { progress }
    });

    res.json({
      message: 'Milestone updated successfully',
      milestone: updatedMilestone,
      roadmapProgress: progress
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// Get personalized course recommendations using AI
router.get('/courses', authenticateToken, async (req, res) => {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get user's assessment results for better recommendations
    const assessments = await prisma.assessment.findMany({
      where: { 
        userId: req.user.id,
        isCompleted: true
      },
      include: { results: true }
    });

    // Build AI prompt for personalized recommendations
    const prompt = `
You are an expert career counselor for Indian students. Based on the following student profile, recommend 5 most suitable courses/degree programs:

Student Profile:
- Age: ${userProfile.age || 'Not specified'}
- Class: ${userProfile.class || 'Not specified'}
- Location: ${userProfile.location || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Career Goals: ${userProfile.careerGoals?.join(', ') || 'Not specified'}
- Academic Performance: ${userProfile.academicPerformance || 'Not specified'}

Assessment Results:
${assessments.map(a => `${a.type}: ${a.results?.percentage || 0}%`).join('\n')}

For each recommendation, provide:
1. Course name
2. Brief reason why it matches the student
3. Duration
4. Top 3 career paths
5. Average salary range in India
6. Top 3 colleges in India
7. Main entrance exams

Format as JSON array with objects containing: courseName, reason, duration, careerPaths, salaryRange, topColleges, entranceExams.
`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      let aiRecommendations = [];
      try {
        aiRecommendations = JSON.parse(response.text());
      } catch (parseError) {
        console.error('AI response parsing error:', parseError);
        // Fallback to rule-based recommendations
        aiRecommendations = generateRuleBasedRecommendations(userProfile);
      }

      res.json({ 
        recommendations: aiRecommendations,
        source: 'ai'
      });

    } catch (aiError) {
      console.error('AI recommendation error:', aiError);
      // Fallback to rule-based recommendations
      const recommendations = generateRuleBasedRecommendations(userProfile);
      res.json({ 
        recommendations,
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('Course recommendations error:', error);
    res.status(500).json({ error: 'Failed to get course recommendations' });
  }
});

// Rule-based recommendation fallback
function generateRuleBasedRecommendations(userProfile) {
  const recommendations = [];
  const interests = userProfile.interests || [];
  const careerGoals = userProfile.careerGoals || [];

  if (interests.includes('Technology') || careerGoals.includes('Software Engineer')) {
    recommendations.push({
      courseName: 'Computer Science Engineering',
      reason: 'Matches your interest in technology and programming',
      duration: '4 years',
      careerPaths: ['Software Engineer', 'Data Scientist', 'Product Manager'],
      salaryRange: '₹6-25 LPA',
      topColleges: ['IIT Delhi', 'IIT Bombay', 'BITS Pilani'],
      entranceExams: ['JEE Main', 'JEE Advanced', 'BITSAT']
    });
  }

  if (interests.includes('Medicine') || careerGoals.includes('Doctor')) {
    recommendations.push({
      courseName: 'MBBS',
      reason: 'Aligns with your interest in healthcare and helping others',
      duration: '5.5 years',
      careerPaths: ['General Physician', 'Specialist Doctor', 'Surgeon'],
      salaryRange: '₹8-30 LPA',
      topColleges: ['AIIMS Delhi', 'CMC Vellore', 'JIPMER'],
      entranceExams: ['NEET UG']
    });
  }

  if (interests.includes('Business') || careerGoals.includes('Entrepreneur')) {
    recommendations.push({
      courseName: 'Business Administration',
      reason: 'Perfect for your entrepreneurial and business interests',
      duration: '3 years',
      careerPaths: ['Business Analyst', 'Marketing Manager', 'Entrepreneur'],
      salaryRange: '₹5-20 LPA',
      topColleges: ['IIM Ahmedabad', 'ISB Hyderabad', 'XLRI Jamshedpur'],
      entranceExams: ['CAT', 'XAT', 'GMAT']
    });
  }

  return recommendations;
}

// Get career recommendations
router.get('/careers', authenticateToken, async (req, res) => {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get assessment results for better career matching
    const assessments = await prisma.assessment.findMany({
      where: { 
        userId: req.user.id,
        isCompleted: true
      },
      include: { results: true }
    });

    const prompt = `
Based on this student's profile and assessment results, recommend 5 specific career paths with detailed information:

Student Profile:
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Career Goals: ${userProfile.careerGoals?.join(', ') || 'Not specified'}
- Academic Performance: ${userProfile.academicPerformance || 'Not specified'}

Assessment Results:
${assessments.map(a => `${a.type}: ${a.results?.percentage || 0}%`).join('\n')}

For each career recommendation, provide:
1. Career title
2. Description (2-3 sentences)
3. Required skills
4. Educational path
5. Average salary in India
6. Growth prospects
7. Job market demand

Format as JSON array with objects containing: careerTitle, description, requiredSkills, educationalPath, averageSalary, growthProspects, marketDemand.
`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      let careerRecommendations = [];
      try {
        careerRecommendations = JSON.parse(response.text());
      } catch (parseError) {
        // Fallback recommendations
        careerRecommendations = generateRuleBasedCareerRecommendations(userProfile);
      }

      res.json({ 
        recommendations: careerRecommendations,
        source: 'ai'
      });

    } catch (aiError) {
      console.error('AI career recommendation error:', aiError);
      const recommendations = generateRuleBasedCareerRecommendations(userProfile);
      res.json({ 
        recommendations,
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('Career recommendations error:', error);
    res.status(500).json({ error: 'Failed to get career recommendations' });
  }
});

function generateRuleBasedCareerRecommendations(userProfile) {
  const recommendations = [];
  const interests = userProfile.interests || [];

  interests.forEach(interest => {
    switch (interest) {
      case 'Technology':
        recommendations.push({
          careerTitle: 'Software Engineer',
          description: 'Design and develop software applications, websites, and systems. Work with cutting-edge technologies to solve real-world problems.',
          requiredSkills: ['Programming', 'Problem Solving', 'Teamwork', 'Communication'],
          educationalPath: 'B.Tech Computer Science or related field',
          averageSalary: '₹6-25 LPA',
          growthProspects: 'Excellent - High demand and growth potential',
          marketDemand: 'Very High'
        });
        break;
      case 'Medicine':
        recommendations.push({
          careerTitle: 'Medical Doctor',
          description: 'Diagnose and treat patients, provide healthcare services, and contribute to public health. Make a direct impact on people\'s lives.',
          requiredSkills: ['Medical Knowledge', 'Empathy', 'Communication', 'Decision Making'],
          educationalPath: 'MBBS followed by specialization',
          averageSalary: '₹8-30 LPA',
          growthProspects: 'Excellent - Always in demand',
          marketDemand: 'Very High'
        });
        break;
    }
  });

  return recommendations;
}

// Get course-to-career mapping
router.get('/course-mapping', async (req, res) => {
  try {
    const { course } = req.query;

    if (course && COURSE_CAREER_MAPPING[course]) {
      res.json({ 
        course,
        mapping: COURSE_CAREER_MAPPING[course]
      });
    } else {
      res.json({ 
        mappings: COURSE_CAREER_MAPPING
      });
    }
  } catch (error) {
    console.error('Course mapping error:', error);
    res.status(500).json({ error: 'Failed to get course mapping' });
  }
});

// Get courses from database
router.get('/courses/all', async (req, res) => {
  try {
    const { level, field } = req.query;
    
    const where = {};
    if (level) where.level = level;
    if (field) where.field = { contains: field, mode: 'insensitive' };

    const courses = await prisma.course.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;