/**
 * Enhanced Security Headers Middleware
 * Implements comprehensive security headers following OWASP recommendations
 */

const helmet = require('helmet');

/**
 * Configure Helmet with strict security settings
 */
const configureSecurityHeaders = () => {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production if possible
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://generativelanguage.googleapis.com'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },

    // Strict Transport Security (HTTPS)
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // X-Frame-Options
    frameguard: {
      action: 'deny', // Prevent clickjacking
    },

    // X-Content-Type-Options
    noSniff: true, // Prevent MIME type sniffing

    // X-XSS-Protection
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },

    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false,
    },

    // X-Download-Options
    ieNoOpen: true,

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // Expect-CT
    expectCt: {
      maxAge: 86400, // 24 hours
      enforce: true,
    },
  });
};

/**
 * Additional custom security headers
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // X-Robots-Tag (prevent search engine indexing of API)
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  // Cache-Control for API responses
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  next();
};

/**
 * CORS configuration with security best practices
 */
const configureCORS = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com'] // Update with actual production domain
    : ['http://localhost:3000', 'http://localhost:3001'];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 hours
  };
};

/**
 * Request ID middleware for tracing
 */
const requestIdMiddleware = (req, res, next) => {
  const requestId =
    req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36)}`;
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

/**
 * Rate limiting configuration
 */
const rateLimitConfig = {
  // Standard rate limit
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false,
  },

  // Strict rate limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  },

  // Strict rate limit for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
      error: 'Too many password reset attempts, please try again later.',
      retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Remove null bytes from strings
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((key) => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Security headers validation endpoint
 */
const validateSecurityHeaders = (req, res) => {
  const headers = {
    'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
    'Strict-Transport-Security': res.getHeader('Strict-Transport-Security'),
    'X-Frame-Options': res.getHeader('X-Frame-Options'),
    'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
    'X-XSS-Protection': res.getHeader('X-XSS-Protection'),
    'Referrer-Policy': res.getHeader('Referrer-Policy'),
    'Permissions-Policy': res.getHeader('Permissions-Policy'),
    'Cross-Origin-Embedder-Policy': res.getHeader(
      'Cross-Origin-Embedder-Policy'
    ),
    'Cross-Origin-Opener-Policy': res.getHeader('Cross-Origin-Opener-Policy'),
    'Cross-Origin-Resource-Policy': res.getHeader(
      'Cross-Origin-Resource-Policy'
    ),
  };

  const missingHeaders = Object.entries(headers)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  res.json({
    status: 'Security Headers Check',
    timestamp: new Date().toISOString(),
    headers: headers,
    missingHeaders: missingHeaders,
    score: missingHeaders.length === 0 ? 'A+' : 'Needs Improvement',
  });
};

module.exports = {
  configureSecurityHeaders,
  additionalSecurityHeaders,
  configureCORS,
  requestIdMiddleware,
  rateLimitConfig,
  sanitizeInput,
  validateSecurityHeaders,
};

