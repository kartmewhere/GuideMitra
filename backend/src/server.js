const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const {
  configureSecurityHeaders,
  additionalSecurityHeaders,
  configureCORS,
  requestIdMiddleware,
  rateLimitConfig,
  sanitizeInput,
  validateSecurityHeaders,
} = require('./middleware/securityHeaders');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Request ID middleware (for tracing)
app.use(requestIdMiddleware);

// Enhanced security headers
app.use(configureSecurityHeaders());
app.use(additionalSecurityHeaders);

// CORS with strict configuration
app.use(cors(configureCORS()));

// Rate limiting
const limiter = rateLimit(rateLimitConfig.standard);
const authLimiter = rateLimit(rateLimitConfig.auth);
const passwordResetLimiter = rateLimit(rateLimitConfig.passwordReset);

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);

// Body parsing middleware with size limits
const maxRequestSize = process.env.MAX_REQUEST_SIZE || '10mb';
app.use(express.json({ limit: maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: maxRequestSize }));

// Input sanitization
app.use(sanitizeInput);

// Logging with request ID
app.use(
  morgan(
    ':id :method :url :status :res[content-length] - :response-time ms',
    {
      // Add request ID to morgan tokens
      skip: (req) => req.path === '/health', // Skip health check logs
    }
  )
);
morgan.token('id', (req) => req.id);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    requestId: req.id,
  });
});

// Readiness check (for Kubernetes/container orchestration)
app.get('/ready', (req, res) => {
  // Add database connectivity check here if needed
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// Liveness check (for Kubernetes/container orchestration)
app.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Security headers validation endpoint (for testing)
app.get('/security-headers', (req, res) => {
  validateSecurityHeaders(req, res);
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/user', require('./routes/user'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/wellness', require('./routes/wellness'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;