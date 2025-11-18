const express = require('express');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const profileUpdateSchema = Joi.object({
  age: Joi.number().min(13).max(100).optional(),
  location: Joi.string().max(100).optional(),
  currentEducation: Joi.string().max(200).optional(),
  careerGoals: Joi.array().items(Joi.string().max(100)).optional(),
  skills: Joi.array().items(Joi.string().max(50)).optional(),
  interests: Joi.array().items(Joi.string().max(50)).optional(),
  preferredLanguage: Joi.string().valid('en', 'es', 'fr', 'de', 'hi').optional()
});

const wellnessCheckinSchema = Joi.object({
  moodScore: Joi.number().min(1).max(10).required(),
  stressLevel: Joi.number().min(1).max(10).required(),
  notes: Joi.string().max(500).optional()
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        roadmaps: {
          where: { isActive: true },
          include: {
            milestones: {
              orderBy: { order: 'asc' }
            }
          }
        },
        wellnessCheckins: {
          orderBy: { createdAt: 'desc' },
          take: 7 // Last 7 check-ins
        }
      }
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      roadmaps: user.roadmaps,
      recentWellnessCheckins: user.wellnessCheckins
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { error, value } = profileUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { userId: req.user.id },
      data: value
    });

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create wellness check-in
router.post('/wellness-checkin', authenticateToken, async (req, res) => {
  try {
    const { error, value } = wellnessCheckinSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const checkin = await prisma.wellnessCheckin.create({
      data: {
        userId: req.user.id,
        ...value
      }
    });

    res.status(201).json({
      message: 'Wellness check-in recorded',
      checkin
    });
  } catch (error) {
    console.error('Wellness check-in error:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// Get wellness analytics
router.get('/wellness-analytics', authenticateToken, async (req, res) => {
  try {
    const checkins = await prisma.wellnessCheckin.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30 // Last 30 days
    });

    // Calculate averages and trends
    const avgMood = checkins.reduce((sum, c) => sum + c.moodScore, 0) / checkins.length || 0;
    const avgStress = checkins.reduce((sum, c) => sum + c.stressLevel, 0) / checkins.length || 0;

    res.json({
      checkins,
      analytics: {
        averageMood: Math.round(avgMood * 10) / 10,
        averageStress: Math.round(avgStress * 10) / 10,
        totalCheckins: checkins.length
      }
    });
  } catch (error) {
    console.error('Wellness analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;