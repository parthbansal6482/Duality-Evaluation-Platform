const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    isPasteEnabled: {
        type: Boolean,
        default: true
    },
    autoApproveTeams: {
        type: Boolean,
        default: false
    },
    sabotageCost: {
        type: Number,
        default: 250
    },
    shieldCost: {
        type: Number,
        default: 200
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
