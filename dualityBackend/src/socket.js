let io = null;

/**
 * Initialize Socket.IO instance
 */
const initializeSocket = (socketIO) => {
    io = socketIO;
    console.log('Socket.IO initialized');
};

const activeDualityUsers = new Map(); // userId -> socketId

/**
 * Add a Duality user session
 */
const addDualityUser = (userId, socketId) => {
    activeDualityUsers.set(userId.toString(), socketId);
    console.log(`Duality user session registered: ${userId} -> ${socketId}`);
};

/**
 * Remove a Duality user session by socket ID
 */
const removeDualityUser = (socketId) => {
    for (const [userId, sid] of activeDualityUsers.entries()) {
        if (sid === socketId) {
            activeDualityUsers.delete(userId);
            console.log(`Duality user session removed: ${userId}`);
            break;
        }
    }
};

/**
 * Broadcast submission update to a specific Duality user
 * @param {string} userId - The Duality user ID
 * @param {object} data - The submission result data
 */
const broadcastDualitySubmissionUpdate = (userId, data) => {
    if (!io) return;
    // Try to send to specific user socket
    const socketId = activeDualityUsers.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit('duality:submission:update', data);
    }
    // Also broadcast to all duality clients (they filter client-side)
    io.emit('duality:submission:update', data);
    console.log(`Duality submission update broadcasted for user: ${userId}`);
};

/**
 * Broadcast question list update to all Duality clients
 */
const broadcastDualityQuestionUpdate = () => {
    if (!io) return;
    io.emit('duality:question:update', { timestamp: new Date() });
    console.log('Duality question update broadcasted');
};

module.exports = {
    initializeSocket,
    addDualityUser,
    removeDualityUser,
    broadcastDualitySubmissionUpdate,
    broadcastDualityQuestionUpdate,
};
