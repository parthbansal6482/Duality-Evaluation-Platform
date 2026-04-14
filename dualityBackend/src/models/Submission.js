const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
    },
    round: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Round',
        required: true,
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
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
    points: {
        type: Number,
        default: 0,
    },
    executionTime: {
        type: Number, // in milliseconds
    },
    memoryUsed: {
        type: Number, // in KB
    },
    output: {
        type: String, // Program output
    },
    error: {
        type: String, // Error messages
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

// Index for faster queries
submissionSchema.index({ team: 1, round: 1, question: 1 });
submissionSchema.index({ round: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
