const jwt = require('jsonwebtoken');

// =============================================
// Extended Competition Auth (Admin / Team)
// =============================================

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type === 'admin') {
            const Admin = require('../models/Admin');
            req.admin = await Admin.findById(decoded.id).select('-password');
            req.userType = 'admin';
        } else if (decoded.type === 'team') {
            const Team = require('../models/Team');
            const team = await Team.findById(decoded.id).select('-password');
            if (!team) {
                return res.status(401).json({
                    success: false,
                    message: 'Team not found',
                });
            }
            req.team = team;
            req.userType = 'team';
        } else if (decoded.type === 'duality') {
            // Also support duality user tokens flowing through this middleware
            const getDualityUser = require('../models/duality/DualityUser');
            const DualityUser = getDualityUser();
            const user = await DualityUser.findById(decoded.id);
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            req.dualityUser = user;
            req.userType = user.role;
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
    if (req.userType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.',
        });
    }
    next();
};

// Team only middleware
exports.teamOnly = (req, res, next) => {
    if (req.userType !== 'team') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Team only.',
        });
    }
    next();
};
