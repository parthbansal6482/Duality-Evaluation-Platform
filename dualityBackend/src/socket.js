const { Emitter } = require('@socket.io/redis-emitter');
const connection = require('./config/redis');

let io = null;
let emitter = null;

// ==================== CORE ====================

/**
 * Initialize Socket.IO instance (for API Server)
 */
const initializeSocket = (socketIO) => {
    io = socketIO;
    console.log('[Socket] Socket.IO initialized for API server');
};

/**
 * Initialize Redis Emitter (for Standalone Workers)
 * Allows worker processes to broadcast events without being a real socket server.
 */
const initializeEmitter = () => {
    if (!emitter) {
        emitter = new Emitter(connection);
        console.log('[Socket] Redis Emitter initialized for Worker');
    }
    return emitter;
};

// ==================== EXTENDED COMPETITION SECTION ====================

const activeTeams = new Map(); // teamId -> socketId

/**
 * Check if a team is already active on another device
 */
const isTeamActive = (teamId) => {
    const tid = teamId.toString();
    const activeSocketId = activeTeams.get(tid);

    if (activeSocketId && io) {
        const socket = io.sockets.sockets.get(activeSocketId);
        if (socket && socket.connected) {
            return true;
        }
        activeTeams.delete(tid);
    }
    return false;
};

/**
 * Add an active team session
 */
const addActiveTeam = (teamId, socketId) => {
    activeTeams.set(teamId.toString(), socketId);
    console.log(`[Socket] Team session registered: ${teamId} -> ${socketId}`);
};

/**
 * Remove an active team session by socket ID
 */
const removeActiveTeam = (socketId) => {
    for (const [teamId, sid] of activeTeams.entries()) {
        if (sid === socketId) {
            activeTeams.delete(teamId);
            console.log(`[Socket] Team session removed: ${teamId} (socket: ${socketId})`);
            break;
        }
    }
};

/**
 * Get current leaderboard data
 */
const getLeaderboardData = async () => {
    try {
        const Team = require('./models/Team');
        const teams = await Team.find({ status: 'approved' })
            .sort({ score: -1 })
            .select('teamName points score members sabotageTokens shieldTokens');

        return teams.map((team, index) => ({
            _id: team._id,
            rank: index + 1,
            teamName: team.teamName,
            points: team.points || 0,
            score: team.score || 0,
            memberCount: team.members.length,
            tokens: {
                sabotage: team.sabotageTokens || 0,
                shield: team.shieldTokens || 0,
            },
        }));
    } catch (error) {
        console.error('[Socket] Error fetching leaderboard data:', error);
        return [];
    }
};

/**
 * Broadcast leaderboard update to all connected clients
 */
const broadcastLeaderboardUpdate = async () => {
    const eventName = 'leaderboard:update';
    try {
        const leaderboard = await getLeaderboardData();
        if (io) {
            io.emit(eventName, leaderboard);
        } else {
            const redisEmitter = initializeEmitter();
            redisEmitter.emit(eventName, leaderboard);
        }
        console.log('[Socket] Leaderboard update broadcasted');
    } catch (error) {
        console.error('[Socket] Error broadcasting leaderboard update:', error);
    }
};

/**
 * Broadcast team stats update to a specific team
 */
const broadcastTeamStatsUpdate = async (teamId) => {
    if (!io) return;

    try {
        const Team = require('./models/Team');
        const team = await Team.findById(teamId)
            .select('teamName points score sabotageTokens shieldTokens sabotageCooldownUntil shieldCooldownUntil shieldActive shieldExpiresAt activeSabotages');

        if (!team) return;

        const allTeams = await Team.find({ status: 'approved' }).sort({ score: -1 }).select('_id');
        const rank = allTeams.findIndex(t => t._id.toString() === teamId.toString()) + 1;

        const statsUpdate = {
            teamName: team.teamName,
            points: team.points || 0,
            score: team.score || 0,
            rank: rank || 0,
            tokens: { sabotage: team.sabotageTokens || 0, shield: team.shieldTokens || 0 },
            sabotageCooldownUntil: team.sabotageCooldownUntil,
            shieldCooldownUntil: team.shieldCooldownUntil,
            shieldActive: team.shieldActive,
            shieldExpiresAt: team.shieldExpiresAt,
            activeSabotages: team.activeSabotages || [],
        };

        io.emit('team:stats-update', statsUpdate);
        console.log(`[Socket] Team stats update broadcasted: ${team.teamName}`);
    } catch (error) {
        console.error('[Socket] Error broadcasting team stats update:', error);
    }
};

/**
 * Broadcast submission update to a specific team
 */
const broadcastSubmissionUpdate = async (teamId, submission) => {
    if (!io) return;

    try {
        const Team = require('./models/Team');
        const team = await Team.findById(teamId).select('teamName');
        if (!team) return;

        io.emit('submission:update', {
            teamName: team.teamName,
            questionId: submission.question,
            status: submission.status,
            points: submission.points || 0,
            timestamp: submission.submittedAt,
        });
        console.log(`[Socket] Submission update broadcasted: ${team.teamName}`);
    } catch (error) {
        console.error('[Socket] Error broadcasting submission update:', error);
    }
};

/**
 * Broadcast cheating violation to all connected admins
 */
const broadcastCheatingViolation = (teamName, roundName, violationType, action, duration) => {
    if (!io) return;
    io.emit('cheating:alert', { teamName, roundName, violationType, action, duration, timestamp: new Date() });
    console.log(`[Socket] Cheating alert: ${teamName} - ${violationType} (${action})`);
};

/**
 * Broadcast disqualification status to a specific team
 */
const broadcastDisqualificationUpdate = async (teamId, isDisqualified, roundId) => {
    if (!io) return;

    try {
        const Team = require('./models/Team');
        const team = await Team.findById(teamId).select('teamName');
        if (!team) return;

        io.emit('team:disqualification-update', { teamName: team.teamName, isDisqualified, roundId });
        console.log(`[Socket] Disqualification update: ${team.teamName} -> ${isDisqualified}`);
    } catch (error) {
        console.error('[Socket] Error broadcasting disqualification update:', error);
    }
};

/**
 * Broadcast sabotage attack to a specific team
 */
const broadcastSabotageAttack = async (targetTeamId, attackerTeamName, sabotageType, endTime) => {
    if (!io) return;

    try {
        const Team = require('./models/Team');
        const targetTeam = await Team.findById(targetTeamId).select('teamName');
        if (!targetTeam) return;

        io.emit('team:sabotage', {
            targetTeamName: targetTeam.teamName,
            attackerTeamName,
            type: sabotageType,
            endTime,
            timestamp: new Date(),
        });
        console.log(`[Socket] Sabotage: ${sabotageType} from ${attackerTeamName} to ${targetTeam.teamName}`);
        await broadcastTeamStatsUpdate(targetTeamId);
    } catch (error) {
        console.error('[Socket] Error broadcasting sabotage attack:', error);
    }
};

/**
 * Broadcast round status update to all connected clients
 */
const broadcastRoundUpdate = (round) => {
    if (!io) return;
    io.emit('round:update', {
        _id: round._id,
        name: round.name,
        status: round.status,
        startTime: round.startTime,
        endTime: round.endTime,
        duration: round.duration,
    });
    console.log(`[Socket] Round update: ${round.name} (${round.status})`);
};

// ==================== DUALITY PRACTICE SECTION ====================

const activeDualityUsers = new Map(); // userId -> socketId

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
        const socketId = activeDualityUsers.get(userId.toString());
        if (socketId) {
            io.to(socketId).emit(eventName, data);
        }
        // Also broadcast globally (cross-instance via Redis adapter)
        io.emit(eventName, data);
    } else {
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

module.exports = {
    // Core
    initializeSocket,
    initializeEmitter,
    // Extended Competition
    isTeamActive,
    addActiveTeam,
    removeActiveTeam,
    getLeaderboardData,
    broadcastLeaderboardUpdate,
    broadcastTeamStatsUpdate,
    broadcastSubmissionUpdate,
    broadcastCheatingViolation,
    broadcastDisqualificationUpdate,
    broadcastSabotageAttack,
    broadcastRoundUpdate,
    // Duality Practice
    addDualityUser,
    removeDualityUser,
    broadcastDualitySubmissionUpdate,
    broadcastDualityQuestionUpdate,
};
