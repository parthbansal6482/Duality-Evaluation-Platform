const mongoose = require('mongoose');
const { getExtendedConnection } = require('../../config/extendedDatabase');

const dualityDraftSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DualityUser',
        required: true,
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DualityQuestion',
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
        enum: ['python', 'java', 'cpp', 'c'],
    },
}, {
    timestamps: true,
});

// One draft per user per question
dualityDraftSchema.index({ user: 1, question: 1 }, { unique: true });

let DualityDraft;
const getModel = () => {
    if (!DualityDraft) {
        const conn = getExtendedConnection();
        DualityDraft = conn.model('DualityDraft', dualityDraftSchema);
    }
    return DualityDraft;
};

module.exports = getModel;
