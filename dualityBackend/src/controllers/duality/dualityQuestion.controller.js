const getDualityQuestion = require('../../models/duality/DualityQuestion');

/**
 * Get all questions
 * GET /api/duality/questions
 */
exports.getAllQuestions = async (req, res) => {
    try {
        const DualityQuestion = getDualityQuestion();

        let query = DualityQuestion.find();

        // Only include testCases for admins
        if (req.dualityUser?.role !== 'admin') {
            query = query.select('-testCases');
        }

        const questions = await query.sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching questions', error: error.message });
    }
};

/**
 * Get a single question by ID
 * GET /api/duality/questions/:id
 */
exports.getQuestion = async (req, res) => {
    try {
        const DualityQuestion = getDualityQuestion();
        let query = DualityQuestion.findById(req.params.id);

        // Only include testCases for admins
        if (req.dualityUser?.role !== 'admin') {
            query = query.select('-testCases');
        }

        const question = await query;

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        res.status(200).json({ success: true, data: question });
    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({ success: false, message: 'Error fetching question', error: error.message });
    }
};

/**
 * Create a new question (Admin only)
 * POST /api/duality/questions
 */
exports.createQuestion = async (req, res) => {
    try {
        const { title, difficulty, category, description, constraints, examples, testCases, boilerplate } = req.body;

        const DualityQuestion = getDualityQuestion();
        const question = await DualityQuestion.create({
            title,
            difficulty,
            category,
            description,
            constraints: constraints || [],
            examples,
            testCases,
            boilerplate: boilerplate || {},
            createdBy: req.dualityUser._id,
        });

        // Broadcast question update via socket
        const { broadcastDualityQuestionUpdate } = require('../../socket');
        broadcastDualityQuestionUpdate();

        res.status(201).json({ success: true, data: question });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ success: false, message: 'Error creating question', error: error.message });
    }
};

/**
 * Update a question (Admin only)
 * PUT /api/duality/questions/:id
 */
exports.updateQuestion = async (req, res) => {
    try {
        const DualityQuestion = getDualityQuestion();
        const question = await DualityQuestion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const { broadcastDualityQuestionUpdate } = require('../../socket');
        broadcastDualityQuestionUpdate();

        res.status(200).json({ success: true, data: question });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ success: false, message: 'Error updating question', error: error.message });
    }
};

/**
 * Delete a question (Admin only)
 * DELETE /api/duality/questions/:id
 */
exports.deleteQuestion = async (req, res) => {
    try {
        const DualityQuestion = getDualityQuestion();
        const question = await DualityQuestion.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const { broadcastDualityQuestionUpdate } = require('../../socket');
        broadcastDualityQuestionUpdate();

        res.status(200).json({ success: true, message: 'Question deleted' });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ success: false, message: 'Error deleting question', error: error.message });
    }
};
