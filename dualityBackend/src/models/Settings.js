const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    isPasteEnabled: {
        type: Boolean,
        default: true
    },
    autoApproveTeams: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
