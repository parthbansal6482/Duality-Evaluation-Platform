const Question = require('../models/Question');

const normalizeQuestionPayload = (payload = {}) => {
    const normalized = { ...payload };

    // Accept both string and string[] constraints from clients.
    if (typeof normalized.constraints === 'string') {
        normalized.constraints = normalized.constraints
            .split('\n')
            .map((c) => c.trim())
            .filter(Boolean);
    }

    // Legacy compatibility: map hiddenTestCases -> testCases for old competition UI payloads.
    if (!Array.isArray(normalized.testCases) && Array.isArray(normalized.hiddenTestCases)) {
        normalized.testCases = normalized.hiddenTestCases;
    }

    // Legacy compatibility: map boilerplateCode -> boilerplate.
    if (!normalized.boilerplate && normalized.boilerplateCode) {
        normalized.boilerplate = normalized.boilerplateCode;
    }

    return normalized;
};

const serializeCompetitionQuestion = (questionDoc) => {
    const q = questionDoc.toObject ? questionDoc.toObject() : { ...questionDoc };
    const hidden = Array.isArray(q.testCases) ? q.testCases : [];

    return {
        ...q,
        // Keep legacy response fields used by existing competition dashboard/UI.
        constraints: Array.isArray(q.constraints) ? q.constraints.join('\n') : q.constraints,
        hiddenTestCases: hidden,
        boilerplateCode: q.boilerplate || {},
        testCases: (q.examples?.length || 0) + hidden.length,
    };
};

/**
 * @desc    Create a new question
 * @route   POST /api/questions
 * @access  Private/Admin
 */
const createQuestion = async (req, res) => {
    try {
        const questionData = {
            ...normalizeQuestionPayload(req.body),
            createdBy: req.admin._id,
        };

        const question = await Question.create(questionData);

        res.status(201).json({
            success: true,
            data: serializeCompetitionQuestion(question),
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

        const questions = await Question.find(filter).select('+testCases')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: questions.length,
            data: questions.map(serializeCompetitionQuestion),
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
        const question = await Question.findById(req.params.id).select('+testCases')
            .populate('createdBy', 'name email');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        res.status(200).json({
            success: true,
            data: serializeCompetitionQuestion(question),
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
            normalizeQuestionPayload(req.body),
            {
                new: true,
                runValidators: true,
            }
        ).select('+testCases');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        res.status(200).json({
            success: true,
            data: serializeCompetitionQuestion(question),
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
