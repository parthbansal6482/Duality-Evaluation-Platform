const { Emitter } = require('@socket.io/redis-emitter');
const connection = require('./config/redis');

let io = null;
let emitter = null;

/**
 * Initialize Socket.IO instance (for API Server)
 */
const initializeSocket = (socketIO) => {
    io = socketIO;
    console.log('[Socket] Socket.IO initialized for API server');
};

/**
 * Initialize Redis Emitter (for Standalone Workers)
 * This allows the worker to broadcast events without being a real socket server.
 */
const initializeEmitter = () => {
    if (!emitter) {
        emitter = new Emitter(connection);
        console.log('[Socket] Redis Emitter initialized for Worker');
    }
    return emitter;
};

const activeDualityUsers = new Map(); // userId -> socketId (Only available on API nodes)

/**
 * Add a Duality user session
 */
const addDualityUser = (userId, socketId) => {
    activeDualityUsers.set(userId.toString(), socketId);
    console.log(`[Socket] Duality user session registered: ${userId} -> ${socketId}`);
};

/**
 * Remove a Duality user session by socket ID
 */
const removeDualityUser = (socketId) => {
    for (const [userId, sid] of activeDualityUsers.entries()) {
        if (sid === socketId) {
            activeDualityUsers.delete(userId);
            console.log(`[Socket] Duality user session removed: ${userId}`);
            break;
        }
    }
};

/**
 * Broadcast submission update to a specific Duality user
 */
const broadcastDualitySubmissionUpdate = (userId, data) => {
    const eventName = 'duality:submission:update';
    
    if (io) {
        // Direct broadcast from API server
        // Try to send to specific user socket if it's on this node
        const socketId = activeDualityUsers.get(userId.toString());
        if (socketId) {
            io.to(socketId).emit(eventName, data);
        }
        // Also broadcast globally (cross-instance via Redis adapter)
        io.emit(eventName, data);
    } else {
        // Broadcast from Worker via Redis Emitter
        const redisEmitter = initializeEmitter();
        redisEmitter.emit(eventName, data);
    }
    
    console.log(`[Socket] Duality submission update broadcasted for user: ${userId}`);
};

/**
 * Broadcast question list update to all Duality clients
 */
const broadcastDualityQuestionUpdate = () => {
    const eventName = 'duality:question:update';
    const payload = { timestamp: new Date() };

    if (io) {
        io.emit(eventName, payload);
    } else {
        const redisEmitter = initializeEmitter();
        redisEmitter.emit(eventName, payload);
    }
    console.log('[Socket] Duality question update broadcasted');
};

/**
 * Legacy broadcast for compatibility
 */
const broadcastLeaderboardUpdate = () => {
    const eventName = 'leaderboard:update';
    if (io) {
        io.emit(eventName);
    } else {
        const redisEmitter = initializeEmitter();
        redisEmitter.emit(eventName);
    }
};

module.exports = {
    initializeSocket,
    initializeEmitter,
    addDualityUser,
    removeDualityUser,
    broadcastDualitySubmissionUpdate,
    broadcastDualityQuestionUpdate,
    broadcastLeaderboardUpdate,
};
