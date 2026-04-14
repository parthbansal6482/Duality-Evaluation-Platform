const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwt');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register admin
// @route   POST /api/admin/signup
// @access  Public
exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists',
            });
        }

        // Create admin
        const admin = await Admin.create({
            name,
            email,
            password,
        });

        // Generate token
        const token = generateToken(admin._id, 'admin');

        res.status(201).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for admin
        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate token
        const token = generateToken(admin._id, 'admin');

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
exports.getProfile = async (req, res) => {
    try {
        const admin = req.admin;

        res.status(200).json({
            success: true,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                createdAt: admin.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};
// @desc    Google Login
// @route   POST /api/admin/google-login
// @access  Public
exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required',
            });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email } = payload;

        // Enforce @bmu.edu.in domain
        if (!email.endsWith('@bmu.edu.in')) {
            return res.status(403).json({
                success: false,
                message: 'Only @bmu.edu.in email addresses are allowed',
            });
        }

        // Check for admin
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'No admin account found with this email',
            });
        }

        // Generate token
        const token = generateToken(admin._id, 'admin');

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
        });
    } catch (error) {
        console.error('Admin Google login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during authentication',
            error: error.message,
        });
    }
};
