const express = require('express');
const router = express.Router();
const { googleLogin, getMe, getAllUsers, getLeaderboard } = require('../../controllers/duality/dualityAuth.controller');
const { protect, adminOnly } = require('../../middleware/dualityAuth');

router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/users', protect, adminOnly, getAllUsers);

module.exports = router;
