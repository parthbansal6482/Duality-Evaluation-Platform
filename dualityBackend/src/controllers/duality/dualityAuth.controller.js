const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const xlsx = require('xlsx');
const getDualityUser = require('../../models/duality/DualityUser');
const getDualityAllowedEmail = require('../../models/duality/DualityAllowedEmail');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const POINTS_BY_DIFFICULTY = {
    Easy: 100,
    Medium: 200,
    Hard: 300,
};

const getUserPoints = (user) =>
    (user.easySolved || 0) * POINTS_BY_DIFFICULTY.Easy
    + (user.mediumSolved || 0) * POINTS_BY_DIFFICULTY.Medium
    + (user.hardSolved || 0) * POINTS_BY_DIFFICULTY.Hard;

const detectYearFromEmail = (email) => {
    const lowerEmail = email.toLowerCase();
    if (lowerEmail.includes('25')) return '1';
    if (lowerEmail.includes('24')) return '2';
    if (lowerEmail.includes('23')) return '3';
    if (lowerEmail.includes('22')) return '4';
    return null;
};

const sortByPointsAndActivity = (a, b) => {
    const pointsDiff = getUserPoints(b) - getUserPoints(a);
    if (pointsDiff !== 0) return pointsDiff;

    const solvedDiff = (b.totalSolved || 0) - (a.totalSolved || 0);
    if (solvedDiff !== 0) return solvedDiff;

    const aTime = a.lastActiveDate ? new Date(a.lastActiveDate).getTime() : 0;
    const bTime = b.lastActiveDate ? new Date(b.lastActiveDate).getTime() : 0;
    return bTime - aTime;
};

const mapUserWithPoints = (user, rank) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    totalSolved: user.totalSolved,
    easySolved: user.easySolved,
    mediumSolved: user.mediumSolved,
    hardSolved: user.hardSolved,
    totalPoints: getUserPoints(user),
    streak: user.streak,
    joinDate: user.joinDate,
    lastActiveDate: user.lastActiveDate,
    rank,
});

/**
 * Google Login
 * POST /api/duality/auth/google
 */
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
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token',
            });
        }

        const { sub: googleId, email, name, picture } = payload;

        // 1. Enforce @bmu.edu.in domain
        if (!email.endsWith('@bmu.edu.in')) {
            console.warn(`[Auth] Blocked login attempt from non-authorized domain: ${email}`);
            return res.status(403).json({
                success: false,
                message: 'Access Denied: Only @bmu.edu.in email addresses are allowed.',
            });
        }



        // 3. Find or create the user
        const DualityUser = getDualityUser();
        let user = await DualityUser.findOne({ googleId });

        if (!user) {
            // Check if a user with this email already exists (edge case)
            user = await DualityUser.findOne({ email: email.toLowerCase() });

            // Pull cohort info from Master List (Excel Import)
            const DualityAllowedEmail = getDualityAllowedEmail();
            const masterEntry = await DualityAllowedEmail.findOne({ email: email.toLowerCase() });

            if (user) {
                // Link Google ID to existing user
                user.googleId = googleId;
                user.avatar = picture || user.avatar;
                if (masterEntry) {
                    user.year = masterEntry.year || user.year;
                    user.section = masterEntry.section || user.section;
                }
                // Auto-detect year from email
                const detectedYear = detectYearFromEmail(email);
                if (detectedYear) user.year = detectedYear;

                await user.save();
            } else {
                // Create new user
                const detectedYear = detectYearFromEmail(email);
                user = await DualityUser.create({
                    googleId,
                    name,
                    email: email.toLowerCase(),
                    avatar: picture || '',
                    role: 'student', // Default role
                    year: detectedYear || (masterEntry ? masterEntry.year : null),
                    section: masterEntry ? masterEntry.section : null,
                });
            }
        } else {
            // Update existing user with latest info from Master List
            const DualityAllowedEmail = getDualityAllowedEmail();
            const masterEntry = await DualityAllowedEmail.findOne({ email: email.toLowerCase() });
            
            if (masterEntry) {
                user.year = masterEntry.year || user.year;
                user.section = masterEntry.section || user.section;
            }

            // Auto-detect year from email
            const detectedYear = detectYearFromEmail(email);
            if (detectedYear) user.year = detectedYear;

            // Update avatar and last active
            user.avatar = picture || user.avatar;
            user.name = name || user.name;

            // Update streak
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
            if (lastActive) {
                lastActive.setHours(0, 0, 0, 0);
                const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    user.streak += 1;
                } else if (diffDays > 1) {
                    user.streak = 1;
                }
                // diffDays === 0 means same day, streak unchanged
            } else {
                user.streak = 1;
            }
            user.lastActiveDate = new Date();
            await user.save();
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, type: 'duality', role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        let rank = null;
        if (user.role === 'student') {
            const DualityUser = getDualityUser();
            const students = await DualityUser.find({ role: 'student' }).select('easySolved mediumSolved hardSolved totalSolved lastActiveDate').lean();
            const sortedStudents = students.sort(sortByPointsAndActivity);
            rank = sortedStudents.findIndex((u) => u._id.toString() === user._id.toString()) + 1;
            rank = rank > 0 ? rank : null;
        }

        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    totalSolved: user.totalSolved,
                    easySolved: user.easySolved,
                    mediumSolved: user.mediumSolved,
                    hardSolved: user.hardSolved,
                    totalPoints: getUserPoints(user),
                    rank,
                    streak: user.streak,
                    joinDate: user.joinDate,
                },
            },
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during authentication',
            error: error.message,
        });
    }
};

/**
 * Get current user profile
 * GET /api/duality/auth/me
 */
exports.getMe = async (req, res) => {
    try {
        const user = req.dualityUser;
        const DualityUser = getDualityUser();
        let rank = null;

        if (user.role === 'student') {
            const students = await DualityUser.find({ role: 'student' }).select('easySolved mediumSolved hardSolved totalSolved lastActiveDate').lean();
            const sortedStudents = students.sort(sortByPointsAndActivity);
            rank = sortedStudents.findIndex((u) => u._id.toString() === user._id.toString()) + 1;
            rank = rank > 0 ? rank : null;
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                totalSolved: user.totalSolved,
                easySolved: user.easySolved,
                mediumSolved: user.mediumSolved,
                hardSolved: user.hardSolved,
                totalPoints: getUserPoints(user),
                rank,
                streak: user.streak,
                joinDate: user.joinDate,
                lastActiveDate: user.lastActiveDate,
            },
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message,
        });
    }
};

/**
 * Get all users (Admin only)
 * GET /api/duality/auth/users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const DualityUser = getDualityUser();
        const users = await DualityUser.find({}).lean();
        const students = users
            .filter((u) => (u.role || 'student') === 'student')
            .sort(sortByPointsAndActivity);

        const admins = users.filter((u) => u.role === 'admin');
        const rankedStudents = students.map((user, index) => mapUserWithPoints(user, index + 1));
        const mappedAdmins = admins.map((user) => mapUserWithPoints(user, null));

        res.status(200).json({
            success: true,
            data: [...rankedStudents, ...mappedAdmins],
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message,
        });
    }
};

/**
 * Get student leaderboard (Admin + Students)
 * GET /api/duality/auth/leaderboard
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const DualityUser = getDualityUser();
        const students = await DualityUser.find({ role: 'student' }).lean();
        const rankedStudents = students
            .sort(sortByPointsAndActivity)
            .map((user, index) => mapUserWithPoints(user, index + 1));

        res.status(200).json({
            success: true,
            data: rankedStudents,
        });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leaderboard',
            error: error.message,
        });
    }
};

/**
 * Upload students list from Excel
 * POST /api/duality/auth/import-students
 * Admin only
 */
exports.uploadStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        const DualityAllowedEmail = getDualityAllowedEmail();
        const DualityUser = getDualityUser();
        
        let importedCount = 0;
        let updatedUserCount = 0;

        for (const row of data) {
            // Flexible header detection
            const email = (row.Email || row.email || row['Email ID'] || '').toString().toLowerCase().trim();
            const name = (row.Name || row.name || '').toString().trim();
            const year = detectYearFromEmail(email);
            const section = null; // Section completely deprecated

            if (!email || !email.endsWith('@bmu.edu.in')) continue;

            // 1. Upsert into Master List (DualityAllowedEmail)
            await DualityAllowedEmail.findOneAndUpdate(
                { email },
                { email, name, year, section, addedBy: req.dualityUser._id },
                { upsert: true, new: true }
            );
            importedCount++;

            // 2. Proactively update existing user if they already exist
            const existingUser = await DualityUser.findOneAndUpdate(
                { email },
                { year, section },
                { new: true }
            );
            if (existingUser) updatedUserCount++;
        }

        res.status(200).json({
            success: true,
            message: `Successfully processed ${importedCount} students.`,
            data: {
                totalRows: data.length,
                imported: importedCount,
                syncedUsers: updatedUserCount
            }
        });
    } catch (error) {
        console.error('uploadStudents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing Excel file',
            error: error.message,
        });
    }
};
