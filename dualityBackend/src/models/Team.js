const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide member name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide member email'],
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
    },
    { _id: false }
);

const teamSchema = new mongoose.Schema(
    {
        teamName: {
            type: String,
            required: [true, 'Please provide a team name'],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 6,
            select: false,
        },
        members: {
            type: [memberSchema],
            validate: {
                validator: function (members) {
                    return members.length >= 2 && members.length <= 3;
                },
                message: 'Team must have 2 to 3 members',
            },
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        points: {
            type: Number,
            default: 0,
        },
        score: {
            type: Number,
            default: 0,
        },
        sabotageTokens: {
            type: Number,
            default: 0,
        },
        shieldTokens: {
            type: Number,
            default: 0,
        },
        shieldActive: {
            type: Boolean,
            default: false,
        },
        shieldExpiresAt: {
            type: Date,
            default: null,
        },
        shieldCooldownUntil: {
            type: Date,
            default: null,
        },
        sabotageCooldownUntil: {
            type: Date,
            default: null,
        },
        registrationDate: {
            type: Date,
            default: Date.now,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        approvedAt: {
            type: Date,
        },
        disqualifiedRounds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Round',
        }],
        completedRounds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Round',
        }],
        activeSabotages: [{
            type: {
                type: String,
                enum: ['blackout', 'typing-delay', 'format-chaos', 'ui-glitch'],
            },
            startTime: Date,
            endTime: Date,
            fromTeamName: String,
        }],
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
teamSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
teamSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Team', teamSchema);
