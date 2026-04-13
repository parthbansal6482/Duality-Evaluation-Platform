require('dotenv').config();
const { connectPracticeDB } = require('./config/practiceDatabase');
const dualitySubmissionQueue = require('./services/dualitySubmissionQueue');
const { initializeSocket } = require('./socket');
const { Server } = require('socket.io');
const http = require('http');

/**
 * STANDALONE WORKER ENTRY POINT
 * This script starts only the code execution worker.
 * It does NOT start the API server.
 */
const startWorker = async () => {
    try {
        console.log('--- DUALITY EXECUTION WORKER ---');
        
        // 1. Connect to MongoDB
        await connectPracticeDB();

        // 2. Initialize Redis Emitter for distributed updates
        const { initializeEmitter } = require('./socket');
        initializeEmitter();

        // 3. Start the Submission Worker
        dualitySubmissionQueue.start();

        console.log('[Worker] Execution system is online and listening for jobs...');

        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            console.log('[Worker] SIGTERM received. Shutting down...');
            process.exit(0);
        });

    } catch (error) {
        console.error('[Worker] Fatal error during startup:', error.message);
        process.exit(1);
    }
};

startWorker();
