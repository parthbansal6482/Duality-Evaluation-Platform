const Question = require('../models/Question');

/**
 * @desc    Create a new question
 * @route   POST /api/questions
 * @access  Private/Admin
 */
const createQuestion = async (req, res) => {
    try {
        const questionData = {
            ...req.body,
            createdBy: req.admin._id,
        };

        const question = await Question.create(questionData);

        res.status(201).json({
            success: true,
            data: question,
        });
    } catch (error) {
        // Handle duplicate title error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A question with this title already exists',
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages,
            });
        }

        console.error('Error creating question:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating question',
            error: error.message,
        });
    }
};

/**
 * @desc    Get all questions
 * @route   GET /api/questions
 * @access  Private/Admin
 */
const getAllQuestions = async (req, res) => {
    try {
        const { difficulty, category, search } = req.query;

        // Build filter object
        const filter = {};
        if (difficulty) filter.difficulty = difficulty;
        if (category) filter.category = category;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const questions = await Question.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: questions.length,
            data: questions,
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching questions',
            error: error.message,
        });
    }
};

/**
 * @desc    Get single question by ID
 * @route   GET /api/questions/:id
 * @access  Private/Admin
 */
const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        res.status(200).json({
            success: true,
            data: question,
        });
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching question',
            error: error.message,
        });
    }
};

/**
 * @desc    Update question
 * @route   PUT /api/questions/:id
 * @access  Private/Admin
 */
const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        res.status(200).json({
            success: true,
            data: question,
        });
    } catch (error) {
        // Handle duplicate title error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A question with this title already exists',
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages,
            });
        }

        console.error('Error updating question:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating question',
            error: error.message,
        });
    }
};

/**
 * @desc    Delete question
 * @route   DELETE /api/questions/:id
 * @access  Private/Admin
 */
const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully',
            data: {},
        });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting question',
            error: error.message,
        });
    }
};

module.exports = {
    createQuestion,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
};
