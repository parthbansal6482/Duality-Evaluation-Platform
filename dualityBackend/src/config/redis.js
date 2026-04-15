const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    retryStrategy(times) {
        // Back off exponentially, max 5s between retries
        const delay = Math.min(times * 200, 5000);
        if (times === 1) console.log('[Redis] Connecting...');
        else if (times % 5 === 0) console.log(`[Redis] Still trying to connect (attempt ${times})...`);
        return delay;
    },
    reconnectOnError(err) {
        // Only reconnect on specific errors
        return err.message.includes('READONLY');
    },
});

connection.on('error', () => {}); // Suppress raw error spam — handled by retryStrategy logs

connection.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

connection.on('close', () => {
    console.log('[Redis] Connection closed');
});

module.exports = connection;
