const { Worker } = require('bullmq');
const connection = require('../config/redis');
const getDualitySubmission = require('../models/duality/DualitySubmission');
const getDualityQuestion = require('../models/duality/DualityQuestion');
const getDualityUser = require('../models/duality/DualityUser');
const { runTestCases } = require('./execution.service');
const { broadcastDualitySubmissionUpdate } = require('../socket');
const { SUBMISSION_QUEUE_NAME } = require('../queues/submission.queue');

/**
 * BullMQ Worker for processing Duality submissions
 */
class DualitySubmissionWorker {
    constructor() {
        this.worker = null;
    }

    /**
     * Start the BullMQ worker
     */
    start() {
        if (this.worker) return;

        console.log(`[DualityWorker] Starting BullMQ worker on queue: ${SUBMISSION_QUEUE_NAME}`);

        this.worker = new Worker(
            SUBMISSION_QUEUE_NAME,
            async (job) => {
                const { submissionId } = job.data;
                const DualitySubmission = getDualitySubmission();
                const submission = await DualitySubmission.findById(submissionId);

                if (!submission) {
                    console.error(`[DualityWorker] Submission ${submissionId} not found`);
                    return;
                }

                // Mark as processing
                submission.status = 'processing';
                await submission.save();

                await this.processSubmission(submission);
            },
            {
                connection,
                concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 4,
            }
        );

        this.worker.on('completed', (job) => {
            console.log(`[DualityWorker] Job ${job.id} (Submission ${job.data.submissionId}) completed`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[DualityWorker] Job ${job.id} failed:`, err);
        });

        console.log(`[DualityWorker] Worker ready. Concurrency: ${this.worker.opts.concurrency}`);
    }

    async processSubmission(submission) {
        const submissionId = submission._id;
        console.log(`[DualityWorker] Processing submission: ${submissionId}`);

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

            // Run test cases via Docker
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

            const avgTime = result.results.reduce((sum, r) => sum + r.executionTime, 0) / (result.results.length || 1);
            const maxMem = Math.max(...result.results.map(r => r.memoryUsed), 0);

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
            // NOTE: This broadcast only works if this worker shares a Redis Pub/Sub backplane with the API server
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

            console.log(`[DualityWorker] Finished submission: ${submissionId} (Status: ${status})`);

        } catch (error) {
            console.error(`[DualityWorker] Failed to process submission ${submissionId}:`, error);
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

module.exports = new DualitySubmissionWorker();
