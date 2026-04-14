const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Round name is required'],
        unique: true,
        trim: true,
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute'],
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }],
    status: {
        type: String,
        required: true,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming',
    },
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
}, {
    timestamps: true,
});

// Index for faster queries
roundSchema.index({ status: 1, startTime: 1 });

// Pre-save hook to calculate endTime
roundSchema.pre('save', function (next) {
    // Calculate endTime if startTime and duration are present
    if (this.startTime && this.duration) {
        // duration is in minutes, convert to milliseconds
        const durationMs = this.duration * 60 * 1000;
        this.endTime = new Date(this.startTime.getTime() + durationMs);
    }
    next();
});

// Virtual for checking if round is currently active
roundSchema.virtual('isActive').get(function () {
    if (this.status !== 'active') return false;
    const now = new Date();
    return this.startTime <= now && (!this.endTime || this.endTime >= now);
});

module.exports = mongoose.model('Round', roundSchema);
