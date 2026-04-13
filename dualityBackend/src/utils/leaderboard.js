// Example utility to trigger leaderboard updates
// Import this in controllers where team points change

const { broadcastLeaderboardUpdate } = require('../socket');

/**
 * Call this function whenever team points are updated
 * This will broadcast the updated leaderboard to all connected clients
 * 
 * Example usage in a controller:
 * 
 * const { triggerLeaderboardUpdate } = require('../utils/leaderboard');
 * 
 * // After updating team points
 * await Team.findByIdAndUpdate(teamId, { $inc: { points: 100 } });
 * triggerLeaderboardUpdate(); // Broadcast update to all clients
 */
const triggerLeaderboardUpdate = () => {
    // Broadcast immediately
    broadcastLeaderboardUpdate();
};

module.exports = {
    triggerLeaderboardUpdate,
};
