const getDualityDraft = require('../../models/duality/DualityDraft');

/**
 * POST /api/duality/submissions/draft
 * Save practice bank code draft.
 */
exports.savePracticeDraft = async (req, res) => {
    try {
        const DualityDraft = getDualityDraft();
        const { questionId, code, language } = req.body;
        const userId = req.dualityUser._id;

        if (!questionId || code === undefined || !language) {
            return res.status(400).json({ success: false, message: 'questionId, code, and language are required' });
        }

        const draft = await DualityDraft.findOneAndUpdate(
            { user: userId, question: questionId },
            { code, language },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: 'Practice draft saved', data: draft });
    } catch (error) {
        console.error('savePracticeDraft error:', error);
        res.status(500).json({ success: false, message: 'Error saving draft', error: error.message });
    }
};

/**
 * GET /api/duality/submissions/draft/:questionId
 * Get practice bank code draft for a question.
 */
exports.getPracticeDraft = async (req, res) => {
    try {
        const DualityDraft = getDualityDraft();
        const { questionId } = req.params;
        const userId = req.dualityUser._id;

        const draft = await DualityDraft.findOne({ user: userId, question: questionId });

        res.status(200).json({ success: true, data: draft });
    } catch (error) {
        console.error('getPracticeDraft error:', error);
        res.status(500).json({ success: false, message: 'Error fetching draft', error: error.message });
    }
};
