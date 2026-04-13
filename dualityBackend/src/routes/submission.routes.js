const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { protect, teamOnly } = require('../middleware/auth');

// All routes require team authentication
router.use(protect);
router.use(teamOnly);

// Submit code
router.post('/', submissionController.submitCode);

// Get submission by ID
router.get('/:id', submissionController.getSubmission);

// Get team submissions
router.get('/team/:teamId', submissionController.getTeamSubmissions);

// Get leaderboard for a round
router.get('/leaderboard/:roundId', submissionController.getLeaderboard);

module.exports = router;
