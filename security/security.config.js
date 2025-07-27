/**
 * Security Configuration for GameDin L3
 * 
 * This file contains security-related configurations and middleware
 * to protect the application from common web vulnerabilities.
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');

// Initialize Redis client for rate limiting
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// More aggressive rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many login attempts, please try again later',
});

// Redis-based rate limiting for API endpoints
const rateLimiterRedis = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ratelimit:',
  points: 100, // Number of points
  duration: 60, // Per second
  blockDuration: 60 * 5, // Block for 5 minutes if exceeded
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*"],
      connectSrc: ["'self'", process.env.RPC_URL || 'http://localhost:8545'],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 63072000, // 2 years in seconds
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
});

// Input validation middleware
const validateInput = (validationRules) => {
  return [
    // Apply validation rules
    ...validationRules,
    // Check for validation errors
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      
      const extractedErrors = [];
      errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
      
      return res.status(422).json({
        success: false,
        errors: extractedErrors,
      });
    },
  ];
};

// Request validation rules
const validationRules = {
  // User authentication
  login: validateInput([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ]),
  
  // Transaction validation
  createTransaction: validateInput([
    body('to').isEthereumAddress(),
    body('value').isNumeric(),
    body('data').optional().isString(),
  ]),
  
  // Contract interaction
  interactWithContract: validateInput([
    body('contractAddress').isEthereumAddress(),
    body('method').isString(),
    body('params').isArray(),
  ]),
};

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Security middleware
const securityMiddleware = (req, res, next) => {
  // Set security headers
  securityHeaders(req, res, () => {});
  
  // Disable X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Set Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Set Feature Policy
  res.setHeader(
    'Feature-Policy', 
    "geolocation 'none'; microphone 'none'; camera 'none';"
  );
  
  next();
};

// Export security utilities
module.exports = {
  apiLimiter,
  authLimiter,
  rateLimiterRedis,
  securityHeaders,
  securityMiddleware,
  validationRules,
  corsOptions,
  // Add other security-related exports as needed
};
