const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
});

connection.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
});

connection.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

module.exports = connection;
