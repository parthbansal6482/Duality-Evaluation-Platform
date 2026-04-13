const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Round = require('../models/Round');
const Team = require('../models/Team');
const { broadcastSubmissionUpdate } = require('../socket');

/**
 * Submit code for a question
 * POST /api/submissions
 */
exports.submitCode = async (req, res) => {
    try {
        const { questionId, roundId, code, language } = req.body;
        const teamId = req.team._id;

        // Validate inputs
        if (!questionId || !roundId || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        // Check if round is active
        const round = await Round.findById(roundId);
        if (!round) {
            return res.status(404).json({
                success: false,
                message: 'Round not found',
            });
        }

        if (round.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Round is not active',
            });
        }


        // Check if question exists and belongs to round
        const question = await Question.findById(questionId).select('+hiddenTestCases');
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        if (!round.questions.includes(questionId)) {
            return res.status(400).json({
                success: false,
                message: 'Question does not belong to this round',
            });
        }

        // Create submission with pending status
        const submission = await Submission.create({
            team: teamId,
            round: roundId,
            question: questionId,
            code,
            language,
            status: 'pending',
            totalTestCases: (question.examples?.length || 0) + (question.hiddenTestCases?.length || 0),
        });

        res.status(201).json({
            success: true,
            message: 'Submission received and being evaluated',
            data: {
                submissionId: submission._id,
                status: 'pending',
            },
        });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing submission',
            error: error.message,
        });
    }
};

/**
 * Get submission by ID
 * GET /api/submissions/:id
 */
exports.getSubmission = async (req, res) => {
    try {
        const { id } = req.params;

        const submission = await Submission.findById(id)
            .populate('question', 'title difficulty')
            .populate('round', 'name')
            .populate('team', 'teamName');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found',
            });
        }

        // Check if user has access to this submission
        if (req.team && submission.team._id.toString() !== req.team._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        res.status(200).json({
            success: true,
            data: submission,
        });
    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message,
        });
    }
};

/**
 * Get team submissions
 * GET /api/submissions/team/:teamId
 */
exports.getTeamSubmissions = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { roundId, questionId } = req.query;

        // Check access
        if (req.team && req.team._id.toString() !== teamId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        const filter = { team: teamId };
        if (roundId) filter.round = roundId;
        if (questionId) filter.question = questionId;

        const submissions = await Submission.find(filter)
            .populate('question', 'title difficulty points')
            .populate('round', 'name')
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            data: submissions,
        });
    } catch (error) {
        console.error('Get team submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message,
        });
    }
};

/**
 * Get leaderboard for a round
 * GET /api/submissions/leaderboard/:roundId
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const { roundId } = req.params;

        // Get all accepted submissions for this round
        const submissions = await Submission.find({
            round: roundId,
            status: 'accepted',
        })
            .populate('team', 'teamName')
            .populate('question', 'title points');

        // Calculate team scores
        const teamScores = {};
        submissions.forEach(sub => {
            const teamId = sub.team._id.toString();
            if (!teamScores[teamId]) {
                teamScores[teamId] = {
                    teamName: sub.team.teamName,
                    totalPoints: 0,
                    solvedProblems: 0,
                    submissions: [],
                };
            }

            // Only count first accepted submission for each question
            const alreadySolved = teamScores[teamId].submissions.some(
                s => s.question.toString() === sub.question._id.toString()
            );

            if (!alreadySolved) {
                teamScores[teamId].totalPoints += sub.points;
                teamScores[teamId].solvedProblems += 1;
                teamScores[teamId].submissions.push({
                    question: sub.question._id,
                    points: sub.points,
                });
            }
        });

        // Convert to array and sort by totalScore
        const leaderboard = Object.values(teamScores)
            .sort((a, b) => {
                if (b.totalPoints !== a.totalPoints) {
                    return b.totalPoints - a.totalPoints;
                }
                return b.solvedProblems - a.solvedProblems;
            })
            .map((team, index) => ({
                rank: index + 1,
                ...team,
            }));

        res.status(200).json({
            success: true,
            data: leaderboard,
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

module.exports = exports;
