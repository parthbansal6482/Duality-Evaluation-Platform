const express = require('express');
const router = express.Router();
const { submitCode, getSubmission, getUserSubmissions, getQuestionSubmissions, runCode, getAllSubmissions } = require('../../controllers/duality/dualitySubmission.controller');
const { protect, adminOnly } = require('../../middleware/dualityAuth');

router.use(protect);

router.post('/', submitCode);
router.post('/run', runCode);
router.get('/all', adminOnly, getAllSubmissions);
router.get('/user/me', getUserSubmissions);
router.get('/question/:questionId', getQuestionSubmissions);
router.get('/:id', getSubmission);

module.exports = router;
