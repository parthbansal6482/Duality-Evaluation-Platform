const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    getProfile,
    googleLogin,
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth');
const {
    adminSignupRules,
    adminLoginRules,
    validate,
} = require('../middleware/validation');

// Public routes
router.post('/signup', adminSignupRules, validate, signup);
router.post('/login', adminLoginRules, validate, login);
router.post('/google-login', googleLogin);

// Protected routes
router.get('/profile', protect, adminOnly, getProfile);

module.exports = router;
