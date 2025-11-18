const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const checkinSchema = Joi.object({
  moodScore: Joi.number().integer().min(1).max(10).required(),
  stressLevel: Joi.number().integer().min(1).max(10).required(),
  energyLevel: Joi.number().integer().min(1).max(10).required(),
  sleepQuality: Joi.number().integer().min(1).max(10).required(),
  focusLevel: Joi.number().integer().min(1).max(10).required(),
  hoursSlept: Joi.number().min(0).max(24).optional(),
  exerciseMinutes: Joi.number().integer().min(0).optional(),
  screenTime: Joi.number().integer().min(0).optional(),
  socialTime: Joi.number().integer().min(0).optional(),
  studyHours: Joi.number().min(0).max(24).optional(),
  productivityScore: Joi.number().integer().min(1).max(10).optional(),
  motivationLevel: Joi.number().integer().min(1).max(10).optional(),
  anxietyLevel: Joi.number().integer().min(1).max(10).optional(),
  confidenceLevel: Joi.number().integer().min(1).max(10).optional(),
  activities: Joi.array().items(Joi.string()).optional(),
  gratitude: Joi.array().items(Joi.string()).optional(),
  challenges: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional(),
  goals: Joi.array().items(Joi.string()).optional()
});

const goalSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  category: Joi.string().valid(
    'PHYSICAL', 'MENTAL', 'EMOTIONAL', 'SOCIAL', 'ACADEMIC', 
    'SLEEP', 'NUTRITION', 'EXERCISE', 'MINDFULNESS', 'PRODUCTIVITY'
  ).required(),
  targetValue: Joi.number().optional(),
  unit: Joi.string().optional(),
  reminderTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  reminderDays: Joi.array().items(Joi.number().integer().min(0).max(6)).optional()
});

// Calculate overall wellness score
const calculateWellnessScore = (checkin) => {
  const coreMetrics = [
    checkin.moodScore,
    (11 - checkin.stressLevel), // Invert stress (lower is better)
    checkin.energyLevel,
    checkin.sleepQuality,
    checkin.focusLevel
  ];
  
  let totalScore = coreMetrics.reduce((sum, score) => sum + score, 0);
  let count = coreMetrics.length;
  
  // Add optional metrics if provided
  if (checkin.productivityScore) {
    totalScore += checkin.productivityScore;
    count++;
  }
  if (checkin.motivationLevel) {
    totalScore += checkin.motivationLevel;
    count++;
  }
  if (checkin.confidenceLevel) {
    totalScore += checkin.confidenceLevel;
    count++;
  }
  if (checkin.anxietyLevel) {
    totalScore += (11 - checkin.anxietyLevel); // Invert anxiety
    count++;
  }
  
  return Math.round((totalScore / count) * 10) / 10; // Round to 1 decimal
};

// Generate wellness insights
const generateInsights = async (userId, checkin, recentCheckins) => {
  const insights = [];
  
  // Trend analysis
  if (recentCheckins.length >= 3) {
    const recentMoodAvg = recentCheckins.slice(-3).reduce((sum, c) => sum + c.moodScore, 0) / 3;
    const previousMoodAvg = recentCheckins.slice(-6, -3).reduce((sum, c) => sum + c.moodScore, 0) / 3;
    
    if (recentMoodAvg > previousMoodAvg + 1) {
      insights.push({
        type: 'TREND',
        title: 'Mood Improvement Detected',
        description: `Your mood has improved by ${(recentMoodAvg - previousMoodAvg).toFixed(1)} points over the last 3 days!`,
        category: 'MENTAL',
        recommendations: ['Keep up the great work!', 'Consider what positive changes you\'ve made recently'],
        priority: 'MEDIUM'
      });
    }
  }
  
  // Sleep quality insights
  if (checkin.sleepQuality <= 4 && checkin.hoursSlept && checkin.hoursSlept < 7) {
    insights.push({
      type: 'WARNING',
      title: 'Sleep Quality Concern',
      description: 'Poor sleep quality combined with insufficient sleep hours detected.',
      category: 'SLEEP',
      recommendations: [
        'Aim for 7-9 hours of sleep',
        'Create a consistent bedtime routine',
        'Limit screen time before bed'
      ],
      priority: 'HIGH'
    });
  }
  
  // Stress and anxiety correlation
  if (checkin.stressLevel >= 7 && checkin.anxietyLevel && checkin.anxietyLevel >= 7) {
    insights.push({
      type: 'WARNING',
      title: 'High Stress and Anxiety',
      description: 'Both stress and anxiety levels are elevated. Consider stress management techniques.',
      category: 'MENTAL',
      recommendations: [
        'Try deep breathing exercises',
        'Take short breaks during study/work',
        'Consider talking to someone you trust',
        'Practice mindfulness or meditation'
      ],
      priority: 'HIGH'
    });
  }
  
  // Productivity insights
  if (checkin.productivityScore && checkin.focusLevel) {
    if (checkin.productivityScore >= 8 && checkin.focusLevel >= 8) {
      insights.push({
        type: 'ACHIEVEMENT',
        title: 'High Productivity Day',
        description: 'Excellent focus and productivity today! You\'re in the zone.',
        category: 'PRODUCTIVITY',
        recommendations: [
          'Note what made today successful',
          'Try to replicate these conditions tomorrow'
        ],
        priority: 'MEDIUM'
      });
    }
  }
  
  return insights;
};

// GET /api/wellness/dashboard - Get wellness dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get recent checkins
    const recentCheckins = await prisma.wellnessCheckin.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get today's checkin
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayCheckin = await prisma.wellnessCheckin.findFirst({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    });
    
    // Get active goals
    const activeGoals = await prisma.wellnessGoal.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get recent insights
    const recentInsights = await prisma.wellnessInsight.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    // Calculate trends
    const monthlyCheckins = await prisma.wellnessCheckin.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Calculate averages
    const averages = monthlyCheckins.length > 0 ? {
      mood: monthlyCheckins.reduce((sum, c) => sum + c.moodScore, 0) / monthlyCheckins.length,
      stress: monthlyCheckins.reduce((sum, c) => sum + c.stressLevel, 0) / monthlyCheckins.length,
      energy: monthlyCheckins.reduce((sum, c) => sum + c.energyLevel, 0) / monthlyCheckins.length,
      sleep: monthlyCheckins.reduce((sum, c) => sum + c.sleepQuality, 0) / monthlyCheckins.length,
      focus: monthlyCheckins.reduce((sum, c) => sum + c.focusLevel, 0) / monthlyCheckins.length,
      overall: monthlyCheckins.reduce((sum, c) => sum + (c.overallScore || 0), 0) / monthlyCheckins.length
    } : null;
    
    // Calculate streak
    let currentStreak = 0;
    const sortedCheckins = await prisma.wellnessCheckin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    for (let i = 0; i < sortedCheckins.length; i++) {
      const checkinDate = new Date(sortedCheckins[i].createdAt);
      const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      
      if (checkinDate.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    res.json({
      todayCheckin,
      recentCheckins: recentCheckins.slice(0, 7),
      activeGoals,
      recentInsights,
      stats: {
        currentStreak,
        totalCheckins: sortedCheckins.length,
        averages
      },
      trends: monthlyCheckins.map(c => ({
        date: c.createdAt,
        mood: c.moodScore,
        stress: c.stressLevel,
        energy: c.energyLevel,
        sleep: c.sleepQuality,
        focus: c.focusLevel,
        overall: c.overallScore
      }))
    });
    
  } catch (error) {
    console.error('Error fetching wellness dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch wellness dashboard' });
  }
});

// POST /api/wellness/checkin - Create daily wellness checkin
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const { error, value } = checkinSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const userId = req.user.id;
    
    // Check if user already checked in today
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const existingCheckin = await prisma.wellnessCheckin.findFirst({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    });
    
    if (existingCheckin) {
      return res.status(400).json({ error: 'You have already checked in today' });
    }
    
    // Calculate overall wellness score
    const overallScore = calculateWellnessScore(value);
    
    // Create checkin
    const checkin = await prisma.wellnessCheckin.create({
      data: {
        ...value,
        userId,
        overallScore
      }
    });
    
    // Get recent checkins for insight generation
    const recentCheckins = await prisma.wellnessCheckin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Generate insights
    const insights = await generateInsights(userId, checkin, recentCheckins);
    
    // Save insights
    for (const insight of insights) {
      await prisma.wellnessInsight.create({
        data: {
          ...insight,
          userId,
          triggerData: { checkinId: checkin.id }
        }
      });
    }
    
    res.status(201).json({
      checkin,
      insights: insights.length,
      message: 'Wellness checkin completed successfully'
    });
    
  } catch (error) {
    console.error('Error creating wellness checkin:', error);
    res.status(500).json({ error: 'Failed to create wellness checkin' });
  }
});

// PUT /api/wellness/checkin/:id - Update today's checkin
router.put('/checkin/:id', authenticateToken, async (req, res) => {
  try {
    const { error, value } = checkinSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const userId = req.user.id;
    const checkinId = req.params.id;
    
    // Verify ownership and that it's today's checkin
    const existingCheckin = await prisma.wellnessCheckin.findFirst({
      where: {
        id: checkinId,
        userId
      }
    });
    
    if (!existingCheckin) {
      return res.status(404).json({ error: 'Checkin not found' });
    }
    
    // Check if it's today's checkin (allow updates only for today)
    const today = new Date();
    const checkinDate = new Date(existingCheckin.createdAt);
    if (checkinDate.toDateString() !== today.toDateString()) {
      return res.status(400).json({ error: 'Can only update today\'s checkin' });
    }
    
    // Calculate new overall score
    const overallScore = calculateWellnessScore(value);
    
    // Update checkin
    const updatedCheckin = await prisma.wellnessCheckin.update({
      where: { id: checkinId },
      data: {
        ...value,
        overallScore
      }
    });
    
    res.json({
      checkin: updatedCheckin,
      message: 'Wellness checkin updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating wellness checkin:', error);
    res.status(500).json({ error: 'Failed to update wellness checkin' });
  }
});

// GET /api/wellness/goals - Get user's wellness goals
router.get('/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const goals = await prisma.wellnessGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(goals);
    
  } catch (error) {
    console.error('Error fetching wellness goals:', error);
    res.status(500).json({ error: 'Failed to fetch wellness goals' });
  }
});

// POST /api/wellness/goals - Create wellness goal
router.post('/goals', authenticateToken, async (req, res) => {
  try {
    const { error, value } = goalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const userId = req.user.id;
    
    const goal = await prisma.wellnessGoal.create({
      data: {
        ...value,
        userId
      }
    });
    
    res.status(201).json(goal);
    
  } catch (error) {
    console.error('Error creating wellness goal:', error);
    res.status(500).json({ error: 'Failed to create wellness goal' });
  }
});

// PUT /api/wellness/goals/:id - Update wellness goal
router.put('/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { error, value } = goalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const userId = req.user.id;
    const goalId = req.params.id;
    
    // Verify ownership
    const existingGoal = await prisma.wellnessGoal.findFirst({
      where: {
        id: goalId,
        userId
      }
    });
    
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const updatedGoal = await prisma.wellnessGoal.update({
      where: { id: goalId },
      data: value
    });
    
    res.json(updatedGoal);
    
  } catch (error) {
    console.error('Error updating wellness goal:', error);
    res.status(500).json({ error: 'Failed to update wellness goal' });
  }
});

// DELETE /api/wellness/goals/:id - Delete wellness goal
router.delete('/goals/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    
    // Verify ownership
    const existingGoal = await prisma.wellnessGoal.findFirst({
      where: {
        id: goalId,
        userId
      }
    });
    
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    await prisma.wellnessGoal.delete({
      where: { id: goalId }
    });
    
    res.json({ message: 'Goal deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting wellness goal:', error);
    res.status(500).json({ error: 'Failed to delete wellness goal' });
  }
});

// GET /api/wellness/insights - Get wellness insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, unreadOnly = false } = req.query;
    
    const where = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }
    
    const insights = await prisma.wellnessInsight.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit)
    });
    
    res.json(insights);
    
  } catch (error) {
    console.error('Error fetching wellness insights:', error);
    res.status(500).json({ error: 'Failed to fetch wellness insights' });
  }
});

// PUT /api/wellness/insights/:id/read - Mark insight as read
router.put('/insights/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const insightId = req.params.id;
    
    // Verify ownership
    const existingInsight = await prisma.wellnessInsight.findFirst({
      where: {
        id: insightId,
        userId
      }
    });
    
    if (!existingInsight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    const updatedInsight = await prisma.wellnessInsight.update({
      where: { id: insightId },
      data: { isRead: true }
    });
    
    res.json(updatedInsight);
    
  } catch (error) {
    console.error('Error marking insight as read:', error);
    res.status(500).json({ error: 'Failed to mark insight as read' });
  }
});

// GET /api/wellness/analytics - Get wellness analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    
    const checkins = await prisma.wellnessCheckin.findMany({
      where: {
        userId,
        createdAt: { gte: daysAgo }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (checkins.length === 0) {
      return res.json({
        period: parseInt(period),
        totalCheckins: 0,
        averages: null,
        trends: [],
        correlations: null
      });
    }
    
    // Calculate averages
    const averages = {
      mood: checkins.reduce((sum, c) => sum + c.moodScore, 0) / checkins.length,
      stress: checkins.reduce((sum, c) => sum + c.stressLevel, 0) / checkins.length,
      energy: checkins.reduce((sum, c) => sum + c.energyLevel, 0) / checkins.length,
      sleep: checkins.reduce((sum, c) => sum + c.sleepQuality, 0) / checkins.length,
      focus: checkins.reduce((sum, c) => sum + c.focusLevel, 0) / checkins.length,
      overall: checkins.reduce((sum, c) => sum + (c.overallScore || 0), 0) / checkins.length
    };
    
    // Calculate trends (weekly averages)
    const weeklyTrends = [];
    for (let i = 0; i < Math.ceil(checkins.length / 7); i++) {
      const weekCheckins = checkins.slice(i * 7, (i + 1) * 7);
      if (weekCheckins.length > 0) {
        weeklyTrends.push({
          week: i + 1,
          mood: weekCheckins.reduce((sum, c) => sum + c.moodScore, 0) / weekCheckins.length,
          stress: weekCheckins.reduce((sum, c) => sum + c.stressLevel, 0) / weekCheckins.length,
          energy: weekCheckins.reduce((sum, c) => sum + c.energyLevel, 0) / weekCheckins.length,
          sleep: weekCheckins.reduce((sum, c) => sum + c.sleepQuality, 0) / weekCheckins.length,
          focus: weekCheckins.reduce((sum, c) => sum + c.focusLevel, 0) / weekCheckins.length,
          overall: weekCheckins.reduce((sum, c) => sum + (c.overallScore || 0), 0) / weekCheckins.length
        });
      }
    }
    
    // Simple correlation analysis
    const correlations = {
      sleepMood: calculateCorrelation(checkins.map(c => c.sleepQuality), checkins.map(c => c.moodScore)),
      stressEnergy: calculateCorrelation(checkins.map(c => c.stressLevel), checkins.map(c => c.energyLevel)),
      exerciseMood: checkins.filter(c => c.exerciseMinutes).length > 5 ? 
        calculateCorrelation(
          checkins.filter(c => c.exerciseMinutes).map(c => c.exerciseMinutes),
          checkins.filter(c => c.exerciseMinutes).map(c => c.moodScore)
        ) : null
    };
    
    res.json({
      period: parseInt(period),
      totalCheckins: checkins.length,
      averages,
      trends: weeklyTrends,
      correlations,
      dailyData: checkins.map(c => ({
        date: c.createdAt,
        mood: c.moodScore,
        stress: c.stressLevel,
        energy: c.energyLevel,
        sleep: c.sleepQuality,
        focus: c.focusLevel,
        overall: c.overallScore
      }))
    });
    
  } catch (error) {
    console.error('Error fetching wellness analytics:', error);
    res.status(500).json({ error: 'Failed to fetch wellness analytics' });
  }
});

// Helper function to calculate correlation
function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return null;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

module.exports = router;