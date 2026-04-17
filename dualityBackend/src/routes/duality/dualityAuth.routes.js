const express = require('express');
const router = express.Router();
const { googleLogin, getMe, getAllUsers, getLeaderboard, toggleAdminStatus } = require('../../controllers/duality/dualityAuth.controller');
const { protect, adminOnly } = require('../../middleware/dualityAuth');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/google', authLimiter, googleLogin);
router.get('/me', protect, getMe);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/users', protect, adminOnly, getAllUsers);
router.patch('/users/:id/role', protect, adminOnly, toggleAdminStatus);

module.exports = router;
