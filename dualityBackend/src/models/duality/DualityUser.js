const mongoose = require('mongoose');
const { getDBConnection } = require('../../config/database');

const dualityUserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    avatar: {
        type: String,
        default: '',
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student',
    },
    totalSolved: {
        type: Number,
        default: 0,
    },
    easySolved: {
        type: Number,
        default: 0,
    },
    mediumSolved: {
        type: Number,
        default: 0,
    },
    hardSolved: {
        type: Number,
        default: 0,
    },
    streak: {
        type: Number,
        default: 0,
    },
    lastActiveDate: {
        type: Date,
        default: null,
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

let DualityUser;
const getModel = () => {
    if (!DualityUser) {
        const conn = getDBConnection();
        DualityUser = conn.model('DualityUser', dualityUserSchema);
    }
    return DualityUser;
};

module.exports = getModel;
