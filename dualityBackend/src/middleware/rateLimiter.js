const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const connection = require('../config/redis');

/**
 * Common Rate Limiter Factory
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Max number of requests per window
 * @param {string} prefix - Unique prefix for Redis keys
 */
const createLimiter = (windowMs, max, prefix) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true, // Return rate limit info in headers
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many requests, please slow down.',
        },
        store: new RedisStore({
            // @ts-expect-error - ioredis type mismatch in rate-limit-redis
            sendCommand: (...args) => connection.call(...args),
            prefix: `rate-limit:${prefix}:`,
        }),
    });
};

// 1. Strict limit for submissions (e.g., 5 per minute)
const submissionLimiter = createLimiter(60 * 1000, 5, 'submission');

// 2. Moderate limit for "Run Code" (e.g., 10 per minute)
const runLimiter = createLimiter(60 * 1000, 10, 'run');

// 3. General API limiter (e.g., 500 per minute)
const apiLimiter = createLimiter(60 * 1000, 500, 'api');

// 4. Auth limiter — protects login from brute force (50 per 15 min)
const authLimiter = createLimiter(15 * 60 * 1000, 50, 'auth');

module.exports = {
    submissionLimiter,
    runLimiter,
    apiLimiter,
    authLimiter,
};
