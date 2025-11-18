const express = require('express');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const searchCollegesSchema = Joi.object({
  location: Joi.string().optional(),
  state: Joi.string().optional(),
  type: Joi.string().valid('GOVERNMENT', 'PRIVATE', 'AUTONOMOUS', 'DEEMED').optional(),
  program: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

// Get colleges with filters
router.get('/', async (req, res) => {
  try {
    const { error, value } = searchCollegesSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { location, state, type, program, page, limit } = value;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (location) {
      where.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { location: { contains: location, mode: 'insensitive' } }
      ];
    }
    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }
    if (type) {
      where.type = type;
    }
    if (program) {
      where.programs = { has: program };
    }

    const [colleges, total] = await Promise.all([
      prisma.college.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { rating: 'desc' },
          { name: 'asc' }
        ]
      }),
      prisma.college.count({ where })
    ]);

    res.json({
      colleges,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search colleges error:', error);
    res.status(500).json({ error: 'Failed to search colleges' });
  }
});

// Get college by ID
router.get('/:collegeId', async (req, res) => {
  try {
    const college = await prisma.college.findUnique({
      where: { id: req.params.collegeId }
    });

    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json(college);
  } catch (error) {
    console.error('Get college error:', error);
    res.status(500).json({ error: 'Failed to fetch college' });
  }
});

// Get colleges near user location (requires authentication for user location)
router.get('/nearby/search', authenticateToken, async (req, res) => {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!userProfile || !userProfile.location) {
      return res.status(400).json({ error: 'User location not set' });
    }

    // Simple location-based search (in a real app, you'd use geospatial queries)
    const colleges = await prisma.college.findMany({
      where: {
        OR: [
          { city: { contains: userProfile.location, mode: 'insensitive' } },
          { state: { contains: userProfile.location, mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { type: 'asc' }, // Government colleges first
        { rating: 'desc' }
      ],
      take: 20
    });

    res.json(colleges);
  } catch (error) {
    console.error('Nearby colleges error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby colleges' });
  }
});

// Get colleges by program/course
router.get('/programs/:program', async (req, res) => {
  try {
    const program = req.params.program;
    
    const colleges = await prisma.college.findMany({
      where: {
        programs: { has: program }
      },
      orderBy: [
        { rating: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(colleges);
  } catch (error) {
    console.error('Get colleges by program error:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// Get available programs/courses
router.get('/meta/programs', async (req, res) => {
  try {
    // Get all unique programs from colleges
    const colleges = await prisma.college.findMany({
      select: { programs: true }
    });

    const allPrograms = new Set();
    colleges.forEach(college => {
      college.programs.forEach(program => allPrograms.add(program));
    });

    const programs = Array.from(allPrograms).sort();

    res.json({ programs });
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get states and cities for filters
router.get('/meta/locations', async (req, res) => {
  try {
    const locations = await prisma.college.groupBy({
      by: ['state', 'city'],
      _count: {
        id: true
      },
      orderBy: [
        { state: 'asc' },
        { city: 'asc' }
      ]
    });

    // Group by state
    const stateData = {};
    locations.forEach(location => {
      if (!stateData[location.state]) {
        stateData[location.state] = {
          cities: [],
          totalColleges: 0
        };
      }
      stateData[location.state].cities.push({
        name: location.city,
        collegeCount: location._count.id
      });
      stateData[location.state].totalColleges += location._count.id;
    });

    res.json({ states: stateData });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

module.exports = router;