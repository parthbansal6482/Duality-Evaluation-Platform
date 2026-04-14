const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Round = require('../models/Round');
const Team = require('../models/Team');
const { runTestCases } = require('./execution.service');
const {
    broadcastLeaderboardUpdate,
    broadcastTeamStatsUpdate,
    broadcastSubmissionUpdate
} = require('../socket');

class SubmissionQueue {
    constructor() {
        this.isWorking = false;
        this.concurrency = 2; // Maximum concurrent Docker containers
        this.activeCount = 0;
        this.pollInterval = 1000; // 1 second
    }

    /**
     * Start the worker loop
     */
    start() {
        if (this.isWorking) return;
        this.isWorking = true;
        console.log(`[SubmissionQueue] Worker started. Concurrency: ${this.concurrency}`);
        this.work();
    }

    /**
     * The main worker loop
     */
    async work() {
        if (!this.isWorking) return;

        try {
            // Check if we have capacity
            if (this.activeCount < this.concurrency) {
                // Find a pending submission and atomically mark it as processing
                const submission = await Submission.findOneAndUpdate(
                    { status: 'pending' },
                    { status: 'processing' },
                    { new: true, sort: { createdAt: 1 } }
                );

                if (submission) {
                    this.activeCount++;
                    // Process in background (don't await)
                    this.processSubmission(submission).finally(() => {
                        this.activeCount--;
                        // Immediately check for more work
                        setImmediate(() => this.work());
                    });

                    // If we still have capacity, try to pick up another one immediately
                    if (this.activeCount < this.concurrency) {
                        setImmediate(() => this.work());
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('[SubmissionQueue] Error in worker loop:', error);
        }

        // Wait before polling again if no work was found or at capacity
        setTimeout(() => this.work(), this.pollInterval);
    }

    /**
     * Process a single submission
     */
    async processSubmission(submission) {
        const submissionId = submission._id;
        console.log(`[SubmissionQueue] Processing submission: ${submissionId}`);

        try {
            // Fetch necessary data
            const question = await Question.findById(submission.question).select('+hiddenTestCases');
            const round = await Round.findById(submission.round);

            if (!question || !round) {
                throw new Error('Question or Round not found for submission');
            }

            // Prepare test cases
            const visibleTestCases = question.examples.map(example => ({
                input: example.input,
                expectedOutput: example.output,
            }));

            const hiddenTestCases = (question.hiddenTestCases || []).map(testCase => ({
                input: testCase.input,
                expectedOutput: testCase.output,
            }));

            const testCases = [...visibleTestCases, ...hiddenTestCases];

            // Run test cases via Docker
            const result = await runTestCases(submission.code, submission.language, testCases);

            // Determine status
            let status = 'accepted';
            if (result.passedTests < result.totalTests) {
                status = 'wrong_answer';
            }

            // Check for timeouts/runtime errors/memory limits
            const hasTimeout = result.results.some(r => r.error && r.error.includes('timeout'));
            const hasMLE = result.results.some(r => r.exitCode === 137);

            if (hasTimeout) {
                status = 'time_limit_exceeded';
            } else if (hasMLE) {
                status = 'memory_limit_exceeded';
            }

            const hasRuntimeError = result.results.some(r => r.error && !r.error.includes('timeout') && r.exitCode !== 137);
            if (hasRuntimeError && status === 'accepted' || (hasRuntimeError && status === 'wrong_answer')) {
                status = 'runtime_error';
            }

            // Calculate points
            const basePoints = question.points || 100;
            const points = status === 'accepted'
                ? basePoints
                : Math.floor((result.passedTests / result.totalTests) * basePoints);

            const avgTime = result.results.reduce((sum, r) => sum + r.executionTime, 0) / result.results.length;
            const maxMem = Math.max(...result.results.map(r => r.memoryUsed));

            // Update submission in DB
            await Submission.findByIdAndUpdate(submissionId, {
                status,
                testCasesPassed: result.passedTests,
                points,
                executionTime: Math.round(avgTime),
                memoryUsed: maxMem,
                testResults: result.results,
            });

            // Handle reward logic for accepted solutions
            if (status === 'accepted') {
                await this.handleRewards(submission, question, round);
            }

            // Notify client via Socket
            broadcastSubmissionUpdate(submission.team, {
                question: submission.question,
                status,
                points,
                submittedAt: submission.submittedAt,
            });

            console.log(`[SubmissionQueue] Finished submission: ${submissionId} (Status: ${status})`);

        } catch (error) {
            console.error(`[SubmissionQueue] Failed to process submission ${submissionId}:`, error);
            await Submission.findByIdAndUpdate(submissionId, {
                status: 'runtime_error',
                error: error.message,
            });
        }
    }

    /**
     * Handle team rewards (points/score/leaderboard)
     */
    async handleRewards(submission, question, round) {
        const teamId = submission.team;

        // Ensure this is the first solve
        const previousAccepted = await Submission.findOne({
            team: teamId,
            question: submission.question,
            status: 'accepted',
            _id: { $ne: submission._id },
        });

        if (!previousAccepted) {
            // Logic moved from submission.controller.js
            const freshRound = await Round.findById(round._id);
            const startTime = freshRound?.startTime ? new Date(freshRound.startTime).getTime() : Date.now();
            const now = Date.now();
            const totalDurationMs = (freshRound?.duration || 60) * 60 * 1000;
            const elapsedMs = Math.max(0, now - startTime);

            let timeRemainingRatio = 1 - (elapsedMs / totalDurationMs);
            timeRemainingRatio = Math.max(0.2, Math.min(1, timeRemainingRatio));

            const basePoints = question.points || 100;
            const reward = Math.floor(basePoints * timeRemainingRatio);

            await Team.findByIdAndUpdate(teamId, {
                $inc: {
                    points: reward,
                    score: reward
                },
            });

            broadcastLeaderboardUpdate();
            broadcastTeamStatsUpdate(teamId);
        }
    }
}

module.exports = new SubmissionQueue();
