const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    getTeamStats,
    getTeamActivity,
    getLeaderboard,
    purchaseToken,
    activateShield,
    launchSabotage,
} = require('../controllers/team.controller');
const { protect, teamOnly } = require('../middleware/auth');
const {
    teamRegisterRules,
    teamLoginRules,
    validate,
} = require('../middleware/validation');

// Public routes
router.post('/register', teamRegisterRules, validate, register);
router.post('/login', teamLoginRules, validate, login);

// Protected routes
router.get('/profile', protect, teamOnly, getProfile);
router.get('/stats', protect, teamOnly, getTeamStats);
router.get('/activity', protect, teamOnly, getTeamActivity);
router.get('/leaderboard', protect, teamOnly, getLeaderboard);
router.post('/purchase-token', protect, teamOnly, purchaseToken);
router.post('/activate-shield', protect, teamOnly, activateShield);
router.post('/launch-sabotage', protect, teamOnly, launchSabotage);

module.exports = router;
