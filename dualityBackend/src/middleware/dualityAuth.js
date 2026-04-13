const jwt = require('jsonwebtoken');
const getDualityUser = require('../models/duality/DualityUser');

// Protect routes - verify JWT token for Duality users
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

        if (decoded.type !== 'duality') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type for Duality platform',
            });
        }

        const DualityUser = getDualityUser();
        const user = await DualityUser.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        req.dualityUser = user;
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
    if (!req.dualityUser || req.dualityUser.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.',
        });
    }
    next();
};

// Student only middleware
exports.studentOnly = (req, res, next) => {
    if (!req.dualityUser || req.dualityUser.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student only.',
        });
    }
    next();
};
