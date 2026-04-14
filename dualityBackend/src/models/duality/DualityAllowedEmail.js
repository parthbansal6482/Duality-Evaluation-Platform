const mongoose = require('mongoose');
const { getExtendedConnection } = require('../../config/extendedDatabase');

const allowedEmailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return v.endsWith('@bmu.edu.in');
            },
            message: 'Only @bmu.edu.in emails are allowed',
        },
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DualityUser',
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
});

// Use a lazy getter so the model is created on the DB connection
let DualityAllowedEmail;
const getModel = () => {
    if (!DualityAllowedEmail) {
        const conn = getExtendedConnection();
        DualityAllowedEmail = conn.model('DualityAllowedEmail', allowedEmailSchema);
    }
    return DualityAllowedEmail;
};

module.exports = getModel;
