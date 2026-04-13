const express = require('express');
const router = express.Router();
const { submitCode, getSubmission, getUserSubmissions, getQuestionSubmissions, runCode, getAllSubmissions, getQueueStatus } = require('../../controllers/duality/dualitySubmission.controller');
const { protect, adminOnly } = require('../../middleware/dualityAuth');

const { submissionLimiter, runLimiter } = require('../../middleware/rateLimiter');

router.use(protect);

router.get('/status', adminOnly, getQueueStatus);
router.post('/', submissionLimiter, submitCode);
router.post('/run', runLimiter, runCode);
router.get('/all', adminOnly, getAllSubmissions);
router.get('/user/me', getUserSubmissions);
router.get('/question/:questionId', getQuestionSubmissions);
router.get('/:id', getSubmission);

module.exports = router;
