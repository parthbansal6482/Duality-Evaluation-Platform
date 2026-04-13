const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../../middleware/dualityAuth');
const {
    createQuiz,
    getQuizzes,
    getQuiz,
    updateQuiz,
    deleteQuiz,
    activateQuiz,
    endQuiz,
    submitQuizAnswer,
    getQuizResults,
    getMyQuizResult,
} = require('../../controllers/duality/quiz.controller');

// All quiz routes require authentication
router.use(protect);

// Quiz CRUD
router.post('/', adminOnly, createQuiz);
router.get('/', getQuizzes);
router.get('/:id', getQuiz);
router.patch('/:id', adminOnly, updateQuiz);
router.delete('/:id', adminOnly, deleteQuiz);

// Quiz lifecycle
router.patch('/:id/activate', adminOnly, activateQuiz);
router.patch('/:id/end', adminOnly, endQuiz);

// Submissions
router.post('/:id/submit', submitQuizAnswer);
router.get('/:id/results', adminOnly, getQuizResults);
router.get('/:id/my-result', getMyQuizResult);

module.exports = router;
