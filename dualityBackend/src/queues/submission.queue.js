const { Queue } = require('bullmq');
const connection = require('../config/redis');

const SUBMISSION_QUEUE_NAME = 'duality-submissions';

// Create the queue (Producer)
const submissionQueue = new Queue(SUBMISSION_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        removeOnComplete: true, // Clean up successful jobs
        removeOnFail: { count: 1000 }, // Keep some failed jobs for debugging
    },
});

/**
 * Add a submission to the queue
 * @param {string} submissionId - The ID of the DualitySubmission document
 */
const addSubmissionToQueue = async (submissionId) => {
    try {
        await submissionQueue.add('evaluate-code', { submissionId });
        console.log(`[Queue] Added submission ${submissionId} to processing queue`);
    } catch (error) {
        console.error(`[Queue] Failed to add submission ${submissionId}:`, error);
        throw error;
    }
};

module.exports = {
    submissionQueue,
    addSubmissionToQueue,
    SUBMISSION_QUEUE_NAME,
};
