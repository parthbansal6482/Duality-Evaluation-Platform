const mongoose = require('mongoose');
const { getExtendedConnection } = require('../../config/extendedDatabase');

const exampleSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
}, { _id: false });

const testCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
}, { _id: false });

const dualityQuestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Question title is required'],
        unique: true,
        trim: true,
    },
    difficulty: {
        type: String,
        required: [true, 'Difficulty level is required'],
        enum: ['Easy', 'Medium', 'Hard'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    constraints: {
        type: [String],
        default: [],
    },
    examples: {
        type: [exampleSchema],
        required: [true, 'At least one example is required'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one example is required',
        },
    },
    testCases: {
        type: [testCaseSchema],
        required: [true, 'At least one test case is required'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one test case is required',
        },
    },
    boilerplate: {
        python: { type: String, default: '# Write your solution here\n' },
        c: { type: String, default: '// Write your solution here\n' },
        cpp: { type: String, default: '// Write your solution here\n' },
        java: { type: String, default: '// Write your solution here\n' },
    },
    driverCode: {
        python: { type: String, default: '' },
        c: { type: String, default: '' },
        cpp: { type: String, default: '' },
        java: { type: String, default: '' },
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DualityUser',
        required: true,
    },
}, {
    timestamps: true,
});

let DualityQuestion;
const getModel = () => {
    if (!DualityQuestion) {
        const conn = getExtendedConnection();
        DualityQuestion = conn.model('DualityQuestion', dualityQuestionSchema);
    }
    return DualityQuestion;
};

module.exports = getModel;
