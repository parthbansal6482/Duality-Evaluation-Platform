const express = require('express');
const router = express.Router();
const { getAllQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion } = require('../../controllers/duality/dualityQuestion.controller');
const { protect, adminOnly } = require('../../middleware/dualityAuth');

router.get('/', protect, getAllQuestions);
router.get('/:id', protect, getQuestion);
router.post('/', protect, adminOnly, createQuestion);
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);

module.exports = router;
