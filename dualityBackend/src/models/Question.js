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

const testCaseSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true,
    },
    output: {
        type: String,
        required: true,
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
    // Optional in competition mode; retained for UI compatibility.
    inputFormat: {
        type: String,
        default: '',
    },
    // Optional in competition mode; retained for UI compatibility.
    outputFormat: {
        type: String,
        default: '',
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
        default: [],
        select: false, // Hidden from team-facing queries
    },
    boilerplate: {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Pre-save hook to set points based on difficulty if not provided
questionSchema.pre('save', function (next) {
    // Compatibility: accept legacy constraints string payloads.
    if (typeof this.constraints === 'string') {
        this.constraints = this.constraints
            .split('\n')
            .map((c) => c.trim())
            .filter(Boolean);
    }

    if (!this.points || this.points === 100) {
        if (this.difficulty === 'Easy') this.points = 100;
        else if (this.difficulty === 'Medium') this.points = 150;
        else if (this.difficulty === 'Hard') this.points = 200;
    }
    next();
});

// Backward-compatible aliases for competition UI/routes expecting old names.
questionSchema.virtual('hiddenTestCases')
    .get(function () {
        return this.testCases || [];
    })
    .set(function (value) {
        this.testCases = value || [];
    });

questionSchema.virtual('boilerplateCode')
    .get(function () {
        return this.boilerplate || {};
    })
    .set(function (value) {
        this.boilerplate = value || {};
    });

module.exports = mongoose.model('Question', questionSchema);
