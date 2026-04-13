const mongoose = require('mongoose');
const { getPracticeConnection } = require('../../config/practiceDatabase');

const dualitySettingsSchema = new mongoose.Schema({
    isOpenRegistration: {
        type: Boolean,
        default: false
    },
    isPasteEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const getDualitySettings = () => {
    // Return existing model or create new one on the practice DB connection
    const practiceDb = getPracticeConnection();
    return practiceDb.models.DualitySettings || practiceDb.model('DualitySettings', dualitySettingsSchema);
};

module.exports = getDualitySettings;
