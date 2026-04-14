const mongoose = require('mongoose');
const { getExtendedConnection } = require('../../config/extendedDatabase');

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
    const dbConn = getExtendedConnection();
    return dbConn.models.DualitySettings || dbConn.model('DualitySettings', dualitySettingsSchema);
};

module.exports = getDualitySettings;
