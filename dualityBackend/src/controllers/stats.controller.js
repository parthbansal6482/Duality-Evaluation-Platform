const Team = require('../models/Team');
const Question = require('../models/Question');
const Round = require('../models/Round');

/**
 * @desc    Get overview statistics for admin dashboard
 * @route   GET /api/stats/overview
 * @access  Private/Admin
 */
const getOverviewStats = async (req, res) => {
    try {
        // Get total teams count
        const totalTeams = await Team.countDocuments();

        // Get pending approvals count
        const pendingApprovals = await Team.countDocuments({ status: 'pending' });

        // Get approved teams count
        const approvedTeams = await Team.countDocuments({ status: 'approved' });

        // Get rejected teams count
        const rejectedTeams = await Team.countDocuments({ status: 'rejected' });

        // Get total questions count
        const totalQuestions = await Question.countDocuments();

        // Get active rounds count
        const activeRounds = await Round.countDocuments({ status: 'active' });

        res.status(200).json({
            success: true,
            data: {
                totalTeams,
                pendingApprovals,
                approvedTeams,
                rejectedTeams,
                totalQuestions,
                activeRounds,
            },
        });
    } catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message,
        });
    }
};

/**
 * @desc    Get recent activity for admin dashboard
 * @route   GET /api/stats/activity
 * @access  Private/Admin
 */
const getRecentActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Get recent teams
        const recentTeams = await Team.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('teamName status createdAt');

        // Get recent questions
        const recentQuestions = await Question.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('title createdAt');

        // Get recent rounds
        const recentRounds = await Round.find()
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('name status createdAt updatedAt');

        // Combine and format activities
        const activities = [];

        recentTeams.forEach(team => {
            activities.push({
                type: 'team',
                action: `Team "${team.teamName}" registered`,
                status: team.status,
                timestamp: team.createdAt,
            });
        });

        recentQuestions.forEach(question => {
            activities.push({
                type: 'question',
                action: `Question "${question.title}" added`,
                timestamp: question.createdAt,
            });
        });

        recentRounds.forEach(round => {
            let action = `Round "${round.name}" created`;
            if (round.status === 'active') {
                action = `Round "${round.name}" started`;
            } else if (round.status === 'completed') {
                action = `Round "${round.name}" completed`;
            }
            activities.push({
                type: 'round',
                action,
                status: round.status,
                timestamp: round.updatedAt,
            });
        });

        // Sort by timestamp and limit
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limitedActivities = activities.slice(0, limit);

        res.status(200).json({
            success: true,
            count: limitedActivities.length,
            data: limitedActivities,
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent activity',
            error: error.message,
        });
    }
};

module.exports = {
    getOverviewStats,
    getRecentActivity,
};
