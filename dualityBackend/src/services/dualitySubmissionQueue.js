const getDualitySubmission = require('../models/duality/DualitySubmission');
const getDualityQuestion = require('../models/duality/DualityQuestion');
const getDualityUser = require('../models/duality/DualityUser');
const { runTestCases } = require('./execution.service');
const { broadcastDualitySubmissionUpdate } = require('../socket');

class DualitySubmissionQueue {
    constructor() {
        this.isWorking = false;
        this.concurrency = 2;
        this.activeCount = 0;
        this.pollInterval = 1000;
    }

    start() {
        if (this.isWorking) return;
        this.isWorking = true;
        console.log(`[DualityQueue] Worker started. Concurrency: ${this.concurrency}`);
        this.work();
    }

    async work() {
        if (!this.isWorking) return;

        try {
            if (this.activeCount < this.concurrency) {
                const DualitySubmission = getDualitySubmission();
                const submission = await DualitySubmission.findOneAndUpdate(
                    { status: 'pending' },
                    { status: 'processing' },
                    { new: true, sort: { createdAt: 1 } }
                );

                if (submission) {
                    this.activeCount++;
                    this.processSubmission(submission).finally(() => {
                        this.activeCount--;
                        setImmediate(() => this.work());
                    });

                    if (this.activeCount < this.concurrency) {
                        setImmediate(() => this.work());
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('[DualityQueue] Error in worker loop:', error);
        }

        setTimeout(() => this.work(), this.pollInterval);
    }

    async processSubmission(submission) {
        const submissionId = submission._id;
        console.log(`[DualityQueue] Processing submission: ${submissionId}`);

        try {
            const DualityQuestion = getDualityQuestion();
            const question = await DualityQuestion.findById(submission.question);

            if (!question) {
                throw new Error('Question not found for submission');
            }

            // Prepare test cases from the question
            const testCases = question.testCases.map(tc => ({
                input: tc.input,
                expectedOutput: tc.output,
            }));

            // Run test cases via Docker (reusing existing execution service)
            const result = await runTestCases(submission.code, submission.language, testCases);

            // Determine status
            let status = 'accepted';
            if (result.passedTests < result.totalTests) {
                status = 'wrong_answer';
            }

            const hasTimeout = result.results.some(r => r.error && r.error.includes('timeout'));
            const hasMLE = result.results.some(r => r.exitCode === 137);

            if (hasTimeout) {
                status = 'time_limit_exceeded';
            } else if (hasMLE) {
                status = 'memory_limit_exceeded';
            }

            const hasRuntimeError = result.results.some(r => r.error && !r.error.includes('timeout') && r.exitCode !== 137);
            if (hasRuntimeError && (status === 'accepted' || status === 'wrong_answer')) {
                status = 'runtime_error';
            }

            const avgTime = result.results.reduce((sum, r) => sum + r.executionTime, 0) / result.results.length;
            const maxMem = Math.max(...result.results.map(r => r.memoryUsed));

            const DualitySubmission = getDualitySubmission();
            await DualitySubmission.findByIdAndUpdate(submissionId, {
                status,
                testCasesPassed: result.passedTests,
                executionTime: Math.round(avgTime),
                memoryUsed: maxMem,
                testResults: result.results,
            });

            // Update user stats on first accepted solve
            if (status === 'accepted') {
                await this.updateUserStats(submission, question);
            }

            // Broadcast real-time update
            broadcastDualitySubmissionUpdate(submission.user.toString(), {
                submissionId: submissionId,
                question: submission.question,
                status,
                testCasesPassed: result.passedTests,
                totalTestCases: result.totalTests,
                executionTime: Math.round(avgTime),
                memoryUsed: maxMem,
                submittedAt: submission.submittedAt,
            });

            console.log(`[DualityQueue] Finished submission: ${submissionId} (Status: ${status})`);

        } catch (error) {
            console.error(`[DualityQueue] Failed to process submission ${submissionId}:`, error);
            const DualitySubmission = getDualitySubmission();
            await DualitySubmission.findByIdAndUpdate(submissionId, {
                status: 'runtime_error',
                error: error.message,
            });
        }
    }

    async updateUserStats(submission, question) {
        const userId = submission.user;
        const DualitySubmission = getDualitySubmission();

        // Check if this is the first accepted solve for this question
        const previousAccepted = await DualitySubmission.findOne({
            user: userId,
            question: submission.question,
            status: 'accepted',
            _id: { $ne: submission._id },
        });

        if (!previousAccepted) {
            const difficultyField = {
                'Easy': 'easySolved',
                'Medium': 'mediumSolved',
                'Hard': 'hardSolved',
            }[question.difficulty];

            const update = {
                $inc: {
                    totalSolved: 1,
                },
            };

            if (difficultyField) {
                update.$inc[difficultyField] = 1;
            }

            const DualityUser = getDualityUser();
            await DualityUser.findByIdAndUpdate(userId, update);
        }
    }
}

module.exports = new DualitySubmissionQueue();
