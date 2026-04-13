const express = require('express');
const router = express.Router();
const {
    createQuestion,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
} = require('../controllers/question.controller');
const { protect, adminOnly } = require('../middleware/auth');
const { validateQuestion } = require('../middleware/validation');

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// @route   POST /api/questions
// @desc    Create new question
// @access  Private/Admin
router.post('/', validateQuestion, createQuestion);

// @route   GET /api/questions
// @desc    Get all questions
// @access  Private/Admin
router.get('/', getAllQuestions);

// @route   GET /api/questions/:id
// @desc    Get question by ID
// @access  Private/Admin
router.get('/:id', getQuestionById);

// @route   PUT /api/questions/:id
// @desc    Update question
// @access  Private/Admin
router.put('/:id', validateQuestion, updateQuestion);

// @route   DELETE /api/questions/:id
// @desc    Delete question
// @access  Private/Admin
router.delete('/:id', deleteQuestion);

module.exports = router;
