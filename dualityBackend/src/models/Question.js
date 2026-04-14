const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true,
    },
    output: {
        type: String,
        required: true,
    },
    explanation: {
        type: String,
    },
}, { _id: false });

const questionSchema = new mongoose.Schema({
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
    points: {
        type: Number,
        default: 100,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    inputFormat: {
        type: String,
        required: [true, 'Input format is required'],
    },
    outputFormat: {
        type: String,
        required: [true, 'Output format is required'],
    },
    constraints: {
        type: String,
        required: [true, 'Constraints are required'],
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
    hiddenTestCases: {
        type: [exampleSchema],
        default: [],
        select: false, // Hidden from team-facing queries
    },
    testCases: {
        type: Number,
        required: [true, 'Number of test cases is required'],
        min: [1, 'At least one test case is required'],
    },
    boilerplateCode: {
        python: {
            type: String,
            default: '# Write your solution here\n',
        },
        c: {
            type: String,
            default: '// Write your solution here\n',
        },
        cpp: {
            type: String,
            default: '// Write your solution here\n',
        },
        java: {
            type: String,
            default: '// Write your solution here\n',
        },
    },
    driverCode: {
        python: {
            type: String,
            default: '',
        },
        c: {
            type: String,
            default: '',
        },
        cpp: {
            type: String,
            default: '',
        },
        java: {
            type: String,
            default: '',
        },
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
}, {
    timestamps: true,
});

// Pre-save hook to set points based on difficulty if not provided
questionSchema.pre('save', function (next) {
    if (!this.points || this.points === 100) {
        if (this.difficulty === 'Easy') this.points = 100;
        else if (this.difficulty === 'Medium') this.points = 150;
        else if (this.difficulty === 'Hard') this.points = 200;
    }
    next();
});

module.exports = mongoose.model('Question', questionSchema);
