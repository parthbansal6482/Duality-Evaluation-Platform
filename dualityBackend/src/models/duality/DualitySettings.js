const mongoose = require('mongoose');
const { getDBConnection } = require('../../config/database');

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
    // Return existing model or create new one on the DB connection
    const dbConn = getDBConnection();
    return dbConn.models.DualitySettings || dbConn.model('DualitySettings', dualitySettingsSchema);
};

module.exports = getDualitySettings;
