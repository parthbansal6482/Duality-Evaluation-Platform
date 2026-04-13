const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Team = require('../models/Team');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request based on type
        if (decoded.type === 'admin') {
            req.admin = await Admin.findById(decoded.id).select('-password');
            req.userType = 'admin';
        } else if (decoded.type === 'team') {
            const team = await Team.findById(decoded.id).select('-password');
            if (!team) {
                return res.status(401).json({
                    success: false,
                    message: 'Team not found',
                });
            }

            // Check if this is the active session (if we decide to implement session IDs)
            // For now, let's just attach the team
            req.team = team;
            req.userType = 'team';
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
