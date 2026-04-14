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
    saveQuizDraft,
    finalizeQuizSubmission
} = require('../../controllers/duality/quiz.controller');

// All quiz routes require authentication
router.use(protect);

router.route('/')
    .post(adminOnly, createQuiz)
    .get(getQuizzes);

router.route('/:id')
    .get(getQuiz)
    .put(adminOnly, updateQuiz)
    .patch(adminOnly, updateQuiz)
    .delete(adminOnly, deleteQuiz);

// Quiz lifecycle
router.patch('/:id/activate', adminOnly, activateQuiz);
router.patch('/:id/end', adminOnly, endQuiz);

// Submissions
router.post('/:id/submit', submitQuizAnswer);
router.post('/:id/save-draft', saveQuizDraft);
router.post('/:id/finalize', finalizeQuizSubmission);
router.get('/:id/results', adminOnly, getQuizResults);
router.get('/:id/my-result', getMyQuizResult);

module.exports = router;
