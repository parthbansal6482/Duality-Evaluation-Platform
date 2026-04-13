const jwt = require('jsonwebtoken');
const getDualityUser = require('../models/duality/DualityUser');

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
        const DualityUser = getDualityUser();
        const user = await DualityUser.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        req.dualityUser = user;
        req.userType = user.role;

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
