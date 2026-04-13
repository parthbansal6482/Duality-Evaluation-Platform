const getDualitySettings = require('../../models/duality/DualitySettings');

/**
 * Get current settings
 * GET /api/duality/settings
 */
exports.getSettings = async (req, res) => {
    try {
        const DualitySettings = getDualitySettings();
        let settings = await DualitySettings.findOne();
        
        // Ensure settings document exists
        if (!settings) {
            settings = await DualitySettings.create({ isOpenRegistration: false, isPasteEnabled: true });
        }

        res.status(200).json({
            success: true,
            data: {
                isOpenRegistration: settings.isOpenRegistration,
                isPasteEnabled: settings.isPasteEnabled !== undefined ? settings.isPasteEnabled : true
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching Duality settings'
        });
    }
};

/**
 * Update settings (Admin only)
 * PUT /api/duality/settings
 */
exports.updateSettings = async (req, res) => {
    try {
        const { isOpenRegistration, isPasteEnabled } = req.body;
        
        const DualitySettings = getDualitySettings();
        let settings = await DualitySettings.findOne();
        
        if (!settings) {
            settings = new DualitySettings();
        }
        
        if (typeof isOpenRegistration === 'boolean') {
            settings.isOpenRegistration = isOpenRegistration;
        }
        
        if (typeof isPasteEnabled === 'boolean') {
            settings.isPasteEnabled = isPasteEnabled;
        }

        await settings.save();

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                isOpenRegistration: settings.isOpenRegistration,
                isPasteEnabled: settings.isPasteEnabled !== undefined ? settings.isPasteEnabled : true
            }
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings'
        });
    }
};
