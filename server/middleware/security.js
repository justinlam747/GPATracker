const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');

// Rate limiting for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: Math.ceil(15 * 60 / 60) // minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

// Slow down after multiple attempts (updated for v2)
const authSlowDown = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 10, // allow 10 requests per 15 minutes, then...
    delayMs: (used, req) => {
        const delayAfter = req.slowDown.limit;
        return (used - delayAfter) * 250;
    },
    maxDelayMs: 20000 // cap the delay at 20 seconds
});

// General rate limiting for all routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per 15 minutes (increased from 100)
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(15 * 60 / 60)
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply security middleware
const applySecurityMiddleware = (app) => {
    // Trust proxy (important if behind Cloudflare or similar)
    app.set('trust proxy', 1);

    // Security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));

    // CORS configuration
    // CORS configuration
    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            const allowedOrigins = [
                'http://localhost:3000',
                'https://gpa-tracker-1creytmze-justinlam-codes-projects.vercel.app',
                'https://gpa-tracker.vercel.app', // Add your main Vercel domain if different
                process.env.CLIENT_URL
            ].filter(Boolean); // Remove any undefined values

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Set-Cookie']
    }));

    // Body parsing with size limits
    app.use(express.json({ limit: '100kb' }));
    app.use(express.urlencoded({ extended: true, limit: '100kb' }));

    // MongoDB injection protection
    app.use(mongoSanitize());

    // Apply rate limiting
    app.use('/api/auth', authLimiter, authSlowDown);
    app.use('/api', generalLimiter);

    return app;
};

module.exports = { applySecurityMiddleware };
