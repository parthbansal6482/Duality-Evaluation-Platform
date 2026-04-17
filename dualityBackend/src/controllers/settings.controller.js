const Settings = require('../models/Settings');

/**
 * Get current settings
 * GET /api/settings
 */
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        // Ensure settings document exists
        if (!settings) {
            settings = await Settings.create({ isPasteEnabled: true });
        }

        res.status(200).json({
            success: true,
            data: {
                isPasteEnabled: settings.isPasteEnabled,
                autoApproveTeams: settings.autoApproveTeams,
                sabotageCost: settings.sabotageCost,
                shieldCost: settings.shieldCost
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings'
        });
    }
};

/**
 * Update settings (Admin only)
 * PUT /api/settings
 */
exports.updateSettings = async (req, res) => {
    try {
        const { isPasteEnabled, autoApproveTeams, sabotageCost, shieldCost } = req.body;
        
        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = new Settings();
        }
        
        if (typeof isPasteEnabled === 'boolean') {
            settings.isPasteEnabled = isPasteEnabled;
        }

        if (typeof autoApproveTeams === 'boolean') {
            settings.autoApproveTeams = autoApproveTeams;
        }
        
        if (typeof sabotageCost === 'number' && sabotageCost >= 0) {
            settings.sabotageCost = sabotageCost;
        }
        
        if (typeof shieldCost === 'number' && shieldCost >= 0) {
            settings.shieldCost = shieldCost;
        }

        await settings.save();

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                isPasteEnabled: settings.isPasteEnabled,
                autoApproveTeams: settings.autoApproveTeams,
                sabotageCost: settings.sabotageCost,
                shieldCost: settings.shieldCost
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
