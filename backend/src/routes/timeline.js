const express = require('express');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  type: Joi.string().valid('EXAM', 'ADMISSION', 'SCHOLARSHIP', 'DEADLINE', 'COUNSELING', 'RESULT').required(),
  eventDate: Joi.date().required(),
  reminderDate: Joi.date().optional(),
  metadata: Joi.object().optional()
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  eventDate: Joi.date().optional(),
  reminderDate: Joi.date().optional(),
  isCompleted: Joi.boolean().optional(),
  metadata: Joi.object().optional()
});

// Get timeline events for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, upcoming, completed } = req.query;
    const currentDate = new Date();

    // Build where clause
    const where = {
      OR: [
        { userId: req.user.id },
        { isGlobal: true }
      ]
    };

    if (type) {
      where.type = type;
    }

    if (upcoming === 'true') {
      where.eventDate = { gte: currentDate };
      where.isCompleted = false;
    }

    if (completed === 'true') {
      where.isCompleted = true;
    }

    const events = await prisma.timelineEvent.findMany({
      where,
      orderBy: [
        { eventDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Categorize events
    const categorizedEvents = {
      upcoming: events.filter(e => e.eventDate >= currentDate && !e.isCompleted),
      past: events.filter(e => e.eventDate < currentDate || e.isCompleted),
      reminders: events.filter(e => e.reminderDate && e.reminderDate >= currentDate && !e.isCompleted)
    };

    res.json({
      events,
      categorized: categorizedEvents
    });
  } catch (error) {
    console.error('Get timeline events error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline events' });
  }
});

// Create personal timeline event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const event = await prisma.timelineEvent.create({
      data: {
        ...value,
        userId: req.user.id,
        isGlobal: false
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create timeline event error:', error);
    res.status(500).json({ error: 'Failed to create timeline event' });
  }
});

// Update timeline event
router.put('/:eventId', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updateEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if event belongs to user
    const existingEvent = await prisma.timelineEvent.findFirst({
      where: {
        id: req.params.eventId,
        userId: req.user.id
      }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    const updatedEvent = await prisma.timelineEvent.update({
      where: { id: req.params.eventId },
      data: value
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update timeline event error:', error);
    res.status(500).json({ error: 'Failed to update timeline event' });
  }
});

// Delete timeline event
router.delete('/:eventId', authenticateToken, async (req, res) => {
  try {
    // Check if event belongs to user
    const existingEvent = await prisma.timelineEvent.findFirst({
      where: {
        id: req.params.eventId,
        userId: req.user.id
      }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    await prisma.timelineEvent.delete({
      where: { id: req.params.eventId }
    });

    res.json({ message: 'Timeline event deleted successfully' });
  } catch (error) {
    console.error('Delete timeline event error:', error);
    res.status(500).json({ error: 'Failed to delete timeline event' });
  }
});

// Get upcoming reminders
router.get('/reminders', authenticateToken, async (req, res) => {
  try {
    const currentDate = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(currentDate.getDate() + 7);

    const reminders = await prisma.timelineEvent.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { isGlobal: true }
        ],
        reminderDate: {
          gte: currentDate,
          lte: nextWeek
        },
        isCompleted: false
      },
      orderBy: { reminderDate: 'asc' }
    });

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Get global/public timeline events (admission dates, exam schedules, etc.)
router.get('/public', async (req, res) => {
  try {
    const { type, year } = req.query;
    const currentDate = new Date();
    
    const where = {
      isGlobal: true,
      eventDate: { gte: currentDate }
    };

    if (type) {
      where.type = type;
    }

    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31);
      where.eventDate = {
        gte: startOfYear,
        lte: endOfYear
      };
    }

    const events = await prisma.timelineEvent.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      take: 50
    });

    res.json(events);
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({ error: 'Failed to fetch public events' });
  }
});

// Mark event as completed
router.patch('/:eventId/complete', authenticateToken, async (req, res) => {
  try {
    const existingEvent = await prisma.timelineEvent.findFirst({
      where: {
        id: req.params.eventId,
        userId: req.user.id
      }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }

    const updatedEvent = await prisma.timelineEvent.update({
      where: { id: req.params.eventId },
      data: { isCompleted: true }
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Complete event error:', error);
    res.status(500).json({ error: 'Failed to complete event' });
  }
});

module.exports = router;