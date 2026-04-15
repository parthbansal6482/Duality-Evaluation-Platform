const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    getProfile,
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth');
const {
    adminSignupRules,
    adminLoginRules,
    validate,
} = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', authLimiter, adminLoginRules, validate, login);

// Protected routes
router.get('/profile', protect, adminOnly, getProfile);

module.exports = router;
