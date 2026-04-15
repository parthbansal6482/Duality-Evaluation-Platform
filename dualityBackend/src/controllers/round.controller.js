const Round = require('../models/Round');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const { getVisibleCases, getAllCases } = require('../utils/questionTestCases');

const hasId = (arr = [], id) => arr.some((v) => String(v) === String(id));

const lockRoundProgressForApprovedTeams = async (roundId) => {
    await Team.updateMany(
        { status: 'approved' },
        { $addToSet: { completedRounds: roundId } }
    );
};

const completeRoundAndLockProgress = async (roundId, endTime = new Date()) => {
    const round = await Round.findByIdAndUpdate(
        roundId,
        { $set: { status: 'completed', endTime } },
        { new: true }
    );

    if (!round) return null;

    await lockRoundProgressForApprovedTeams(roundId);
    return round;
};

const isRoundExpired = (round) =>
    round?.status === 'active' && round?.endTime && new Date(round.endTime).getTime() <= Date.now();

const finalizeRoundIfExpired = async (round) => {
    if (!isRoundExpired(round)) return null;

    const completedRound = await completeRoundAndLockProgress(
        round._id,
        round.endTime || new Date()
    );

    if (completedRound) {
        const { broadcastRoundUpdate } = require('../socket');
        broadcastRoundUpdate(completedRound);
    }

    return completedRound;
};

const finalizeAllExpiredRounds = async () => {
    const now = new Date();
    const expiredRounds = await Round.find({
        status: 'active',
        endTime: { $lte: now },
    }).select('_id endTime');

    if (!expiredRounds.length) return;

    const { broadcastRoundUpdate } = require('../socket');

    for (const round of expiredRounds) {
        const completedRound = await completeRoundAndLockProgress(round._id, round.endTime || now);
        if (completedRound) {
            broadcastRoundUpdate(completedRound);
        }
    }
};

// ... existing admin functions ...

/**
 * @desc    Get active rounds for teams
 * @route   GET /api/rounds/active
 * @access  Private/Team
 */
const getActiveRounds = async (req, res) => {
    try {
        await finalizeAllExpiredRounds();

        const rounds = await Round.find({ status: { $in: ['active', 'upcoming'] } })
            .select('name duration status startTime endTime')
            .sort({ startTime: 1 });

        // Calculate time remaining for active rounds
        const roundsWithTime = rounds.map(round => {
            const roundObj = round.toObject();
            if (round.status === 'active' && round.endTime) {
                const now = new Date();
                const timeRemaining = Math.max(0, Math.floor((round.endTime - now) / 1000));
                roundObj.timeRemaining = timeRemaining;
            }
            return roundObj;
        });

        res.status(200).json({
            success: true,
            count: roundsWithTime.length,
            data: roundsWithTime,
        });
    } catch (error) {
        console.error('Error fetching active rounds:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active rounds',
            error: error.message,
        });
    }
};

/**
 * @desc    Get round questions for teams
 * @route   GET /api/rounds/:id/questions
 * @access  Private/Team
 */
const getRoundQuestions = async (req, res) => {
    try {
        console.log('getRoundQuestions called with roundId:', req.params.id);
        console.log('Team ID:', req.team?._id);

        const round = await Round.findById(req.params.id)
            .populate('questions', '-createdBy -createdAt -updatedAt -testCases -hiddenTestCases')
            .select('name duration status startTime endTime questions');

        console.log('Round found:', round ? 'Yes' : 'No');
        if (round) {
            console.log('Round status:', round.status);
            console.log('Questions count:', round.questions?.length);
        }

        if (!round) {
            return res.status(404).json({
                success: false,
                message: 'Round not found',
            });
        }

        if (await finalizeRoundIfExpired(round)) {
            return res.status(403).json({
                success: false,
                message: 'This round has ended',
            });
        }

        // Only allow access to active rounds
        if (round.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'This round is not currently active',
            });
        }

        // Check if team is disqualified from this round
        if (req.team.disqualifiedRounds && hasId(req.team.disqualifiedRounds, req.params.id)) {
            return res.status(403).json({
                success: false,
                message: 'Your team has been disqualified from this round',
            });
        }

        // Check if team has already completed this round
        if (req.team.completedRounds && hasId(req.team.completedRounds, req.params.id)) {
            return res.status(403).json({
                success: false,
                message: 'You have already completed this round and cannot re-enter',
            });
        }

        // Get team's submissions for this round
        const submissions = await Submission.find({
            team: req.team._id,
            round: req.params.id,
        }).select('question status points testCasesPassed totalTestCases');

        console.log('Submissions found:', submissions.length);

        // Map submissions to questions
        const submissionMap = {};
        submissions.forEach(sub => {
            const questionId = sub.question.toString();
            if (!submissionMap[questionId] || sub.status === 'accepted') {
                submissionMap[questionId] = {
                    status: sub.status,
                    points: sub.points,
                    testCasesPassed: sub.testCasesPassed,
                    totalTestCases: sub.totalTestCases,
                };
            }
        });

        // Add submission status to questions
        const questionsWithStatus = round.questions.map(q => {
            const questionObj = q.toObject();
            const submission = submissionMap[q._id.toString()];

            // Map backend submission status to frontend status
            if (submission) {
                if (submission.status === 'accepted') {
                    questionObj.submissionStatus = 'solved';
                } else {
                    questionObj.submissionStatus = 'attempted';
                }
                questionObj.earnedPoints = submission.points;
            } else {
                questionObj.submissionStatus = 'unsolved';
                questionObj.earnedPoints = 0;
            }

            return questionObj;
        });

        // Calculate endTime if not set (for backward compatibility)
        let endTime = round.endTime;
        if (!endTime && round.startTime && round.duration) {
            const durationMs = round.duration * 60 * 1000; // duration is in minutes
            endTime = new Date(new Date(round.startTime).getTime() + durationMs);
            console.log('Calculated endTime:', endTime.toISOString());
        }

        res.status(200).json({
            success: true,
            data: {
                round: {
                    _id: round._id,
                    name: round.name,
                    duration: round.duration,
                    status: round.status,
                    startTime: round.startTime,
                    endTime: endTime,
                },
                questions: questionsWithStatus,
            },
        });
    } catch (error) {
        console.error('Error fetching round questions:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching round questions',
            error: error.message,
        });
    }
};

/**
 * @desc    Run code against sample test cases (no submission)
 * @route   POST /api/rounds/:id/run
 * @access  Private/Team
 */
const runCode = async (req, res) => {
    try {
        const { id: roundId } = req.params;
        const { questionId, code, language } = req.body;
        const teamId = req.team._id;

        console.log('Run code request:', { roundId, questionId, language });

        // Validate input
        if (!questionId || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Question ID, code, and language are required',
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

        if (await finalizeRoundIfExpired(round)) {
            return res.status(403).json({
                success: false,
                message: 'This round has ended',
            });
        }

        if (round.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'This round is not currently active',
            });
        }

        // Check if team is disqualified from this round
        if (req.team.disqualifiedRounds && hasId(req.team.disqualifiedRounds, roundId)) {
            return res.status(403).json({
                success: false,
                message: 'Your team has been disqualified from this round',
            });
        }

        // Check if question exists and belongs to this round
        const question = await Question.findById(questionId).select('+testCases +hiddenTestCases');
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        if (!hasId(round.questions, questionId)) {
            return res.status(400).json({
                success: false,
                message: 'This question does not belong to this round',
            });
        }

        // Run code against sample test cases (examples only, not hidden test cases)
        const { runTestCases } = require('../services/execution.service');

        const testCases = getVisibleCases(question);

        const driverCode = question.driverCode ? question.driverCode[language] : '';
        const result = await runTestCases(code, language, testCases, driverCode);

        // Return results without creating submission
        res.status(200).json({
            success: true,
            message: 'Code executed successfully',
            data: {
                totalTests: result.totalTests,
                passedTests: result.passedTests,
                failedTests: result.failedTests,
                results: result.results,
                allPassed: result.passedTests === result.totalTests,
            },
        });
    } catch (error) {
        console.error('Error running code:', error);
        res.status(500).json({
            success: false,
            message: 'Error running code',
            error: error.message,
        });
    }
};

/**
 * @desc    Submit solution for a question
 * @route   POST /api/rounds/:id/submit
 * @access  Private/Team
 */
const submitSolution = async (req, res) => {
    const { runTestCases } = require('../services/execution.service');

    try {
        console.log('=== SUBMISSION REQUEST ===');
        console.log('Body:', JSON.stringify(req.body));
        console.log('Round ID:', req.params.id);
        console.log('Team ID:', req.team?._id);

        const { questionId, code, language } = req.body;
        const roundId = req.params.id;
        const teamId = req.team._id;

        console.log('Extracted values:');
        console.log('- questionId:', questionId);
        console.log('- language:', language);
        console.log('- code length:', code?.length);

        // Validate input
        if (!questionId || !code || !language) {
            console.log('Validation failed!');
            console.log('Missing:', {
                questionId: !questionId,
                code: !code,
                language: !language
            });
            return res.status(400).json({
                success: false,
                message: 'Question ID, code, and language are required',
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

        if (await finalizeRoundIfExpired(round)) {
            return res.status(403).json({
                success: false,
                message: 'This round has ended',
            });
        }

        if (round.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'This round is not currently active',
            });
        }

        // Check if team is disqualified from this round
        if (req.team.disqualifiedRounds && hasId(req.team.disqualifiedRounds, roundId)) {
            return res.status(403).json({
                success: false,
                message: 'Your team has been disqualified from this round',
            });
        }

        // Check if question exists and belongs to this round
        const question = await Question.findById(questionId).select('+testCases +hiddenTestCases');
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        if (!hasId(round.questions, questionId)) {
            return res.status(400).json({
                success: false,
                message: 'This question does not belong to this round',
            });
        }

        // Combine visible + hidden cases (supports both new and legacy docs).
        const testCases = getAllCases(question);

        // Run test cases synchronously
        const driverCode = question.driverCode ? question.driverCode[language] : '';
        const result = await runTestCases(code, language, testCases, driverCode);
        console.log('Test results:', result);

        // Determine status
        let status = 'accepted';
        if (result.passedTests === 0) {
            status = 'wrong_answer';
        } else if (result.passedTests < result.totalTests) {
            status = 'wrong_answer';
        }

        // Check for errors
        const hasErrors = result.results.some(r => r.error && r.error.includes('timeout'));
        if (hasErrors) {
            status = 'time_limit_exceeded';
        }

        const hasRuntimeErrors = result.results.some(r => r.error && !r.error.includes('timeout'));
        if (hasRuntimeErrors && status !== 'time_limit_exceeded') {
            status = 'runtime_error';
        }

        // Calculate points (proportional to passed tests)
        const points = status === 'accepted'
            ? question.points || 100
            : Math.floor((result.passedTests / result.totalTests) * (question.points || 100));

        // Get average execution time and max memory
        const avgExecutionTime = result.results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / result.results.length;
        const maxMemory = Math.max(...result.results.map(r => r.memoryUsed || 0));

        // Create submission with results
        const submission = await Submission.create({
            team: teamId,
            round: roundId,
            question: questionId,
            code,
            language,
            status,
            totalTestCases: result.totalTests,
            testCasesPassed: result.passedTests,
            points,
            executionTime: Math.round(avgExecutionTime),
            memoryUsed: maxMemory,
            testResults: result.results,
        });

        // If accepted, update team points and score
        if (status === 'accepted') {
            // Check if this is the first accepted submission for this question
            const previousAccepted = await Submission.findOne({
                team: teamId,
                round: roundId,
                question: questionId,
                status: 'accepted',
                _id: { $ne: submission._id },
            });

            if (!previousAccepted) {
                // Calculate time-based points (currency)
                const startTime = new Date(round.startTime).getTime();
                const now = Date.now();
                const totalDurationMs = round.duration * 60 * 1000;
                const elapsedMs = now - startTime;

                // Points = QuestionPoints * (percentage of time remaining)
                // Minimum 20% of base points awarded even if solved late
                const timeRemainingRatio = Math.max(0.2, 1 - (elapsedMs / totalDurationMs));
                const currencyPoints = Math.floor((question.points || 100) * timeRemainingRatio);

                // Score = QuestionPoints (fixed for leaderboard)
                const scoreReward = question.points || 100;

                await Team.findByIdAndUpdate(teamId, {
                    $inc: {
                        points: currencyPoints,
                        score: scoreReward
                    },
                });

                console.log(`Team awarded ${scoreReward} score and ${currencyPoints} currency points for solving ${question.title}`);

                // Real-time broadcasts
                const { broadcastLeaderboardUpdate, broadcastTeamStatsUpdate, broadcastSubmissionUpdate } = require('../socket');
                broadcastLeaderboardUpdate();
                broadcastTeamStatsUpdate(teamId);

                // Also broadcast submission for current team's round view
                broadcastSubmissionUpdate(teamId, {
                    question: questionId,
                    status,
                    points: currencyPoints,
                    submittedAt: submission.submittedAt,
                });
            }
        }

        res.status(201).json({
            success: true,
            message: status === 'accepted' ? 'All test cases passed!' : 'Submission evaluated',
            data: {
                submissionId: submission._id,
                status,
                totalTestCases: result.totalTests,
                testCasesPassed: result.passedTests,
                points: status === 'accepted' ? points : 0,
                executionTime: Math.round(avgExecutionTime),
                memoryUsed: maxMemory,
                results: result.results,
                allPassed: result.passedTests === result.totalTests,
            },
        });
    } catch (error) {
        console.error('Error submitting solution:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting solution',
            error: error.message,
        });
    }
};

/**
 * Run code asynchronously and update submission
 */
async function runCodeAsync(submissionId, code, language, question, teamId) {
    const { runTestCases } = require('../services/execution.service');

    try {
        // Prepare test cases - combine examples and hidden test cases
        const testCases = getAllCases(question);

        // Run test cases
        const driverCode = question.driverCode ? question.driverCode[language] : '';
        const result = await runTestCases(code, language, testCases, driverCode);
        console.log(result);

        // Determine status
        let status = 'accepted';
        if (result.passedTests === 0) {
            status = 'wrong_answer';
        } else if (result.passedTests < result.totalTests) {
            status = 'wrong_answer';
        }

        // Check for errors
        const hasErrors = result.results.some(r => r.error && r.error.includes('timeout'));
        if (hasErrors) {
            status = 'time_limit_exceeded';
        }

        const hasRuntimeErrors = result.results.some(r => r.error && !r.error.includes('timeout'));
        if (hasRuntimeErrors && status !== 'time_limit_exceeded') {
            status = 'runtime_error';
        }

        // Calculate points (proportional to passed tests)
        const points = status === 'accepted'
            ? question.points || 100
            : Math.floor((result.passedTests / result.totalTests) * (question.points || 100));

        // Get average execution time and max memory
        const avgExecutionTime = result.results.reduce((sum, r) => sum + r.executionTime, 0) / result.results.length;
        const maxMemory = Math.max(...result.results.map(r => r.memoryUsed));

        // Update submission
        await Submission.findByIdAndUpdate(submissionId, {
            status,
            testCasesPassed: result.passedTests,
            points,
            executionTime: Math.round(avgExecutionTime),
            memoryUsed: maxMemory,
            testResults: result.results,
        });

        // If accepted, update team points
        if (status === 'accepted') {
            const submission = await Submission.findById(submissionId);

            // Check if this is the first accepted submission for this question
            const previousAccepted = await Submission.findOne({
                team: teamId,
                round: submission.round,
                question: submission.question,
                status: 'accepted',
                _id: { $ne: submissionId },
            });

            if (!previousAccepted) {
                await Team.findByIdAndUpdate(teamId, {
                    $inc: { points },
                });
            }
        }
    } catch (error) {
        console.error('Code execution error:', error);

        // Update submission with error
        await Submission.findByIdAndUpdate(submissionId, {
            status: 'runtime_error',
            error: error.message,
        });
    }
}

/**
 * @desc    Get team's submissions for a round
 * @route   GET /api/rounds/:id/submissions
 * @access  Private/Team
 */
const getRoundSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({
            team: req.team._id,
            round: req.params.id,
        })
            .populate('question', 'title difficulty')
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions,
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message,
        });
    }
};


/**
 * @desc    Create a new round
 * @route   POST /api/rounds
 * @access  Private/Admin
 */
const createRound = async (req, res) => {
    try {
        // Verify all questions exist
        if (req.body.questions && req.body.questions.length > 0) {
            const questions = await Question.find({ _id: { $in: req.body.questions } });
            if (questions.length !== req.body.questions.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more questions not found',
                });
            }
        }

        const roundData = {
            ...req.body,
            createdBy: req.admin._id,
        };

        const round = await Round.create(roundData);
        const populatedRound = await Round.findById(round._id).populate('questions', 'title difficulty category');

        res.status(201).json({
            success: true,
            data: populatedRound,
        });
    } catch (error) {
        // Handle duplicate name error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A round with this name already exists',
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages,
            });
        }

        console.error('Error creating round:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating round',
            error: error.message,
        });
    }
};

/**
 * @desc    Get all rounds
 * @route   GET /api/rounds
 * @access  Private/Admin
 */
const getAllRounds = async (req, res) => {
    try {
        const { status, search } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const rounds = await Round.find(filter)
            .populate('questions', 'title difficulty category')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: rounds.length,
            data: rounds,
        });
    } catch (error) {
        console.error('Error fetching rounds:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rounds',
            error: error.message,
        });
    }
};

/**
 * @desc    Get single round by ID
 * @route   GET /api/rounds/:id
 * @access  Private/Admin
 */
const getRoundById = async (req, res) => {
    try {
        const round = await Round.findById(req.params.id)
            .populate('questions')
            .populate('createdBy', 'name email');

        if (!round) {
            return res.status(404).json({
                success: false,
                message: 'Round not found',
            });
        }

        res.status(200).json({
            success: true,
            data: round,
        });
    } catch (error) {
        console.error('Error fetching round:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching round',
            error: error.message,
        });
    }
};

/**
 * @desc    Update round
 * @route   PUT /api/rounds/:id
 * @access  Private/Admin
 */
const updateRound = async (req, res) => {
    try {
        // Verify all questions exist if questions are being updated
        if (req.body.questions && req.body.questions.length > 0) {
            const questions = await Question.find({ _id: { $in: req.body.questions } });
            if (questions.length !== req.body.questions.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more questions not found',
                });
            }
        }

        // Get the existing round to check current values
        const existingRound = await Round.findById(req.params.id);
        if (!existingRound) {
            return res.status(404).json({
                success: false,
                message: 'Round not found',
            });
        }

        // Calculate endTime if status is changing to 'active' or if startTime/duration are being updated
        const updateData = { ...req.body };

        // If status is changing to 'active', set startTime to now if not provided
        if (updateData.status === 'active' && !updateData.startTime) {
            updateData.startTime = new Date();
        }

        // Calculate endTime if we have both startTime and duration
        const startTime = updateData.startTime || existingRound.startTime;
        const duration = updateData.duration !== undefined ? updateData.duration : existingRound.duration;

        if (startTime && duration) {
            const durationMs = duration * 60 * 1000; // duration is in minutes
            updateData.endTime = new Date(new Date(startTime).getTime() + durationMs);
        }

        const round = await Round.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).populate('questions', 'title difficulty category');

        // Broadcast round update
        const { broadcastRoundUpdate } = require('../socket');
        broadcastRoundUpdate(round);

        res.status(200).json({
            success: true,
            data: round,
        });
    } catch (error) {
        // Handle duplicate name error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A round with this name already exists',
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages,
            });
        }

        console.error('Error updating round:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating round',
            error: error.message,
        });
    }
};

/**
 * @desc    Delete round
 * @route   DELETE /api/rounds/:id
 * @access  Private/Admin
 */
const deleteRound = async (req, res) => {
    try {
        const round = await Round.findByIdAndDelete(req.params.id);

        if (!round) {
            return res.status(404).json({
                success: false,
                message: 'Round not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Round deleted successfully',
            data: {},
        });
    } catch (error) {
        console.error('Error deleting round:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting round',
            error: error.message,
        });
    }
};

/**
 * @desc    Update round status
 * @route   PATCH /api/rounds/:id/status
 * @access  Private/Admin
 */
const updateRoundStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['upcoming', 'active', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be upcoming, active, or completed',
            });
        }

        const existingRound = await Round.findById(req.params.id);
        if (!existingRound) {
            return res.status(404).json({
                success: false,
                message: 'Round not found',
            });
        }

        const updateData = { status };

        // Set start time and calculate end time when status changes to active
        if (status === 'active') {
            const startTime = new Date();
            updateData.startTime = startTime;

            // Calculate endTime based on duration
            if (existingRound.duration) {
                const durationMs = existingRound.duration * 60 * 1000;
                updateData.endTime = new Date(startTime.getTime() + durationMs);
            }
        }

        // Set end time when status changes to completed
        if (status === 'completed') {
            updateData.endTime = new Date();
        }

        const round = await Round.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('questions', 'title difficulty category');

        if (!round) {
            return res.status(404).json({
                success: false,
                message: 'Round not found',
            });
        }

        if (status === 'completed') {
            await lockRoundProgressForApprovedTeams(round._id);
        }

        // Broadcast round update
        const { broadcastRoundUpdate } = require('../socket');
        broadcastRoundUpdate(round);

        res.status(200).json({
            success: true,
            data: round,
        });
    } catch (error) {
        console.error('Error updating round status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating round status',
            error: error.message,
        });
    }
};

/**
 * @desc    Exit round (delete all submissions and deduct points)
 * @route   POST /api/rounds/:id/exit
 * @access  Private/Team
 */
const exitRound = async (req, res) => {
    try {
        const roundId = req.params.id;
        const teamId = req.team._id;

        console.log(`Team ${teamId} exiting round ${roundId}`);

        // Do not allow exit-reset once round is marked complete.
        const team = await Team.findById(teamId).select('completedRounds');
        if (team?.completedRounds && hasId(team.completedRounds, roundId)) {
            return res.status(400).json({
                success: false,
                message: 'Round already completed. Progress is locked and cannot be reset.',
            });
        }

        // Find all submissions for this team in this round
        const submissions = await Submission.find({
            team: teamId,
            round: roundId,
        });

        console.log(`Found ${submissions.length} submissions to delete`);

        // Calculate total points earned from accepted submissions
        const pointsToDeduct = submissions
            .filter(sub => sub.status === 'accepted')
            .reduce((sum, sub) => sum + (sub.points || 0), 0);

        console.log(`Points to deduct: ${pointsToDeduct}`);

        // Delete all submissions for this round
        const deleteResult = await Submission.deleteMany({
            team: teamId,
            round: roundId,
        });

        console.log(`Deleted ${deleteResult.deletedCount} submissions`);

        // Deduct points from team's score if any were earned
        if (pointsToDeduct > 0) {
            // Get current team to check score
            const currentTeam = await Team.findById(teamId);

            // Calculate new scores (ensure they don't go negative)
            const newScore = Math.max(0, (currentTeam.score || 0) - pointsToDeduct);
            const newPoints = Math.max(0, (currentTeam.points || 0) - pointsToDeduct);

            await Team.findByIdAndUpdate(teamId, {
                $set: {
                    score: newScore,
                    points: newPoints,
                }
            });
            console.log(`Deducted ${pointsToDeduct} points from team score (new score: ${newScore})`);
        }

        res.status(200).json({
            success: true,
            message: 'Successfully exited round. All progress has been reset.',
            data: {
                submissionsDeleted: deleteResult.deletedCount,
                pointsDeducted: pointsToDeduct,
            },
        });
    } catch (error) {
        console.error('Error exiting round:', error);
        res.status(500).json({
            success: false,
            message: 'Error exiting round',
            error: error.message,
        });
    }
};

/**
 * @desc    Complete round (keep progress, prevent re-entry)
 * @route   POST /api/rounds/:id/complete
 * @access  Private/Team
 */
const completeRound = async (req, res) => {
    try {
        const roundId = req.params.id;
        const teamId = req.team._id;

        console.log(`Team ${teamId} completing round ${roundId}`);

        // Check if already completed
        const team = await Team.findById(teamId);
        if (team.completedRounds && hasId(team.completedRounds, roundId)) {
            return res.status(400).json({
                success: false,
                message: 'You have already completed this round',
            });
        }

        // Add round to completedRounds array
        await Team.findByIdAndUpdate(teamId, {
            $addToSet: {
                completedRounds: roundId,
            }
        });

        console.log(`Round ${roundId} marked as completed for team ${teamId}`);

        res.status(200).json({
            success: true,
            message: 'Round completed successfully. You cannot re-enter this round.',
            data: {
                roundId: roundId,
            },
        });
    } catch (error) {
        console.error('Error completing round:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing round',
            error: error.message,
        });
    }
};

module.exports = {
    createRound,
    getAllRounds,
    getRoundById,
    updateRound,
    deleteRound,
    updateRoundStatus,
    getActiveRounds,
    getRoundQuestions,
    runCode,
    submitSolution,
    getRoundSubmissions,
    exitRound,
    completeRound,
};
