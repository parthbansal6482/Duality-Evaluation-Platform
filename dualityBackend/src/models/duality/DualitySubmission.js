const mongoose = require('mongoose');
const { getDBConnection } = require('../../config/database');

const dualitySubmissionSchema = new mongoose.Schema({
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
        required: [true, 'Code is required'],
    },
    language: {
        type: String,
        required: [true, 'Programming language is required'],
        enum: ['python', 'java', 'cpp', 'c'],
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded', 'memory_limit_exceeded'],
        default: 'pending',
    },
    testCasesPassed: {
        type: Number,
        default: 0,
    },
    totalTestCases: {
        type: Number,
        required: true,
    },
    executionTime: {
        type: Number, // in milliseconds
    },
    memoryUsed: {
        type: Number, // in KB
    },
    output: {
        type: String,
    },
    error: {
        type: String,
    },
    testResults: [{
        testCase: Number,
        passed: Boolean,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        error: String,
        executionTime: Number,
        memoryUsed: Number,
    }],
    submittedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Indexes for faster queries
dualitySubmissionSchema.index({ user: 1, question: 1 });
dualitySubmissionSchema.index({ status: 1, createdAt: 1 });

let DualitySubmission;
const getModel = () => {
    if (!DualitySubmission) {
        const conn = getDBConnection();
        DualitySubmission = conn.model('DualitySubmission', dualitySubmissionSchema);
    }
    return DualitySubmission;
};

module.exports = getModel;
