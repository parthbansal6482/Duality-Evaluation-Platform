const Team = require('../models/Team');
const { generateToken } = require('../utils/jwt');
const {
    broadcastSabotageAttack,
    broadcastTeamStatsUpdate,
    broadcastLeaderboardUpdate
} = require('../socket');
const Settings = require('../models/Settings');

// @desc    Register team
// @route   POST /api/team/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { teamName, password, members } = req.body;

        // Check if team already exists
        const teamExists = await Team.findOne({ teamName });
        if (teamExists) {
            return res.status(400).json({
                success: false,
                message: 'Team with this name already exists',
            });
        }

        // Validate member count
        if (!members || members.length < 2 || members.length > 3) {
            return res.status(400).json({
                success: false,
                message: 'Team must have 2 to 3 members',
            });
        }

        // Check if auto-approve is enabled
        const settings = await Settings.findOne();
        const status = (settings && settings.autoApproveTeams) ? 'approved' : 'pending';

        // Create team
        const team = await Team.create({
            teamName,
            password,
            members,
            status
        });

        const successMessage = status === 'approved' 
            ? 'Team registered and approved successfully!' 
            : 'Team registered successfully. Waiting for admin approval.';

        res.status(201).json({
            success: true,
            message: successMessage,
            team: {
                id: team._id,
                teamName: team.teamName,
                members: team.members,
                status: team.status,
                registrationDate: team.registrationDate,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Login team
// @route   POST /api/team/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { teamName, password } = req.body;

        // Check for team
        const team = await Team.findOne({ teamName }).select('+password');
        if (!team) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if team is approved
        if (team.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: `Your team registration is ${team.status}. Please wait for admin approval.`,
                status: team.status,
            });
        }

        // Check password
        const isMatch = await team.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if team is already active on another device
        const { isTeamActive } = require('../socket');
        if (isTeamActive(team._id)) {
            return res.status(403).json({
                success: false,
                message: 'Your team is already logged in on another device. Please close the other session first.',
            });
        }

        // Generate token
        const token = generateToken(team._id, 'team');

        res.status(200).json({
            success: true,
            token,
            team: {
                id: team._id,
                teamName: team.teamName,
                members: team.members,
                status: team.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get team profile
// @route   GET /api/team/profile
// @access  Private (Team)
exports.getProfile = async (req, res) => {
    try {
        const team = req.team;

        res.status(200).json({
            success: true,
            team: {
                id: team._id,
                teamName: team.teamName,
                members: team.members,
                status: team.status,
                registrationDate: team.registrationDate,
                createdAt: team.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// @desc    Get team stats (points, rank, tokens, active rounds)
// @route   GET /api/team/stats
// @access  Private (Team)
exports.getTeamStats = async (req, res) => {
    try {
        const team = req.team;

        // Check if team exists (user is authenticated as a team)
        if (!team) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated as a team. Please log in as a team.',
            });
        }

        const Round = require('../models/Round');

        // Get all approved teams sorted by score to calculate rank
        const allTeams = await Team.find({ status: 'approved' })
            .sort({ score: -1 })
            .select('_id score');

        // Find current team's rank
        const rank = allTeams.findIndex(t => t._id.toString() === team._id.toString()) + 1;

        // Get active rounds count
        const activeRoundsCount = await Round.countDocuments({ status: 'active' });

        // Cleanup expired sabotages
        const now = new Date();
        let changed = false;

        if (team.activeSabotages && team.activeSabotages.length > 0) {
            const initialCount = team.activeSabotages.length;
            team.activeSabotages = team.activeSabotages.filter(s => new Date(s.endTime) > now);
            if (team.activeSabotages.length !== initialCount) changed = true;
        }

        // Cleanup expired shield
        if (team.shieldActive && team.shieldExpiresAt && new Date(team.shieldExpiresAt) <= now) {
            team.shieldActive = false;
            team.shieldExpiresAt = null;
            if (!team.shieldCooldownUntil) {
                team.shieldCooldownUntil = new Date(now.getTime() + 3 * 60 * 1000); // Default 3min cooldown
            }
            changed = true;
        }

        if (changed) {
            await team.save();
        }

        res.status(200).json({
            success: true,
            data: {
                id: team._id,
                name: team.teamName,
                teamName: team.teamName,
                members: team.members,
                points: team.points || 0,
                score: team.score || 0,
                rank: rank || 0,
                sabotageTokens: team.sabotageTokens || 0,
                shieldTokens: team.shieldTokens || 0,
                tokens: {
                    sabotage: team.sabotageTokens || 0,
                    shield: team.shieldTokens || 0,
                },
                activeRoundsCount,
                shieldActive: team.shieldActive || false,
                shieldExpiresAt: team.shieldExpiresAt,
                shieldCooldownUntil: team.shieldCooldownUntil,
                sabotageCooldownUntil: team.sabotageCooldownUntil,
                activeSabotages: team.activeSabotages || [],
                completedRounds: team.completedRounds || [],
                disqualifiedRounds: team.disqualifiedRounds || [],
            },
        });
    } catch (error) {
        console.error('Error fetching team stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team statistics',
            error: error.message,
        });
    }
};

// @desc    Get team recent activity
// @route   GET /api/team/activity
// @access  Private (Team)
exports.getTeamActivity = async (req, res) => {
    try {
        const team = req.team;
        const limit = parseInt(req.query.limit) || 10;

        // For now, return mock activity since we don't have submissions model yet
        // TODO: Replace with real submission data when submission system is implemented
        const activities = [
            {
                type: 'submission',
                action: 'Completed "Two Sum"',
                points: '+100 points',
                timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
                status: 'success',
            },
            {
                type: 'submission',
                action: 'Attempted "Binary Tree"',
                points: 'No points',
                timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
                status: 'neutral',
            },
            {
                type: 'purchase',
                action: 'Purchased Shield Token',
                points: '-200 points',
                timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
                status: 'purchase',
            },
        ];

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities,
        });
    } catch (error) {
        console.error('Error fetching team activity:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team activity',
            error: error.message,
        });
    }
};

// @desc    Get leaderboard (all teams ranked by points)
// @route   GET /api/team/leaderboard
// @access  Private (Team)
exports.getLeaderboard = async (req, res) => {
    try {
        // Get all approved teams sorted by score (descending)
        const teams = await Team.find({ status: 'approved' })
            .sort({ score: -1 })
            .select('teamName points score members sabotageTokens shieldTokens');

        // Format leaderboard data with ranks
        const leaderboard = teams.map((team, index) => ({
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

        res.status(200).json({
            success: true,
            count: leaderboard.length,
            data: leaderboard,
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leaderboard',
            error: error.message,
        });
    }
};

// @desc    Purchase token (sabotage or shield)
// @route   POST /api/team/purchase-token
// @access  Private (Team)
exports.purchaseToken = async (req, res) => {
    try {
        const { tokenType, cost } = req.body;
        const teamId = req.team._id;

        // Validate token type
        if (!['sabotage', 'shield'].includes(tokenType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token type. Must be "sabotage" or "shield"',
            });
        }

        // Fixed prices
        const TOKEN_PRICES = {
            sabotage: 250,
            shield: 200,
        };

        const actualCost = TOKEN_PRICES[tokenType];

        // Deduct points and add token atomically
        const updatedTeam = await Team.findOneAndUpdate(
            { _id: teamId, points: { $gte: actualCost } },
            {
                $inc: {
                    points: -actualCost,
                    [tokenType === 'sabotage' ? 'sabotageTokens' : 'shieldTokens']: 1
                }
            },
            { new: true }
        );

        if (!updatedTeam) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient points or team not found',
            });
        }

        // Broadcast updates
        broadcastTeamStatsUpdate(teamId);
        broadcastLeaderboardUpdate();

        // Get updated rank using score
        const allTeams = await Team.find({ status: 'approved' })
            .sort({ score: -1 })
            .select('_id score');
        const rank = allTeams.findIndex(t => t._id.toString() === teamId.toString()) + 1;

        res.status(200).json({
            success: true,
            message: `Successfully purchased ${tokenType} token`,
            data: {
                teamName: updatedTeam.teamName,
                points: updatedTeam.points,
                score: updatedTeam.score,
                rank,
                tokens: {
                    sabotage: updatedTeam.sabotageTokens || 0,
                    shield: updatedTeam.shieldTokens || 0,
                },
            },
        });
    } catch (error) {
        console.error('Error purchasing token:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing token purchase',
            error: error.message,
        });
    }
};

// @desc    Activate shield protection
// @route   POST /api/team/activate-shield
// @access  Private (Team)
exports.activateShield = async (req, res) => {
    try {
        const teamId = req.team._id;

        // Activate shield atomically
        const shieldDuration = 10 * 60 * 1000; // 10 minutes
        const cooldownDuration = 15 * 60 * 1000; // 15 minutes total from now

        const now = new Date();
        const updatedTeam = await Team.findOneAndUpdate(
            {
                _id: teamId,
                shieldTokens: { $gt: 0 },
                $and: [
                    {
                        $or: [
                            { shieldActive: false },
                            { shieldExpiresAt: { $lte: now } }
                        ]
                    },
                    {
                        $or: [
                            { shieldCooldownUntil: null },
                            { shieldCooldownUntil: { $lte: now } }
                        ]
                    }
                ]
            },
            {
                $inc: { shieldTokens: -1 },
                $set: {
                    shieldActive: true,
                    shieldExpiresAt: new Date(Date.now() + shieldDuration),
                    shieldCooldownUntil: new Date(Date.now() + cooldownDuration)
                }
            },
            { new: true }
        );

        if (!updatedTeam) {
            return res.status(400).json({
                success: false,
                message: 'Cannot activate shield. Either no tokens, already active, or on cooldown.',
            });
        }

        // Broadcast stats update (token deduction)
        broadcastTeamStatsUpdate(teamId);
        broadcastLeaderboardUpdate();

        res.status(200).json({
            success: true,
            message: 'Shield activated successfully',
            data: {
                shieldActive: updatedTeam.shieldActive,
                shieldExpiresAt: updatedTeam.shieldExpiresAt,
                shieldCooldownUntil: updatedTeam.shieldCooldownUntil,
                shieldTokens: updatedTeam.shieldTokens,
            },
        });
    } catch (error) {
        console.error('Error activating shield:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating shield',
            error: error.message,
        });
    }
};

// @desc    Launch sabotage attack on target team
// @route   POST /api/team/launch-sabotage
// @access  Private (Team)
exports.launchSabotage = async (req, res) => {
    try {
        const { targetTeamId, sabotageType } = req.body;
        const teamId = req.team._id;

        // Validate sabotage type
        const validTypes = ['blackout', 'typing-delay'];
        if (!validTypes.includes(sabotageType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sabotage type',
            });
        }

        // Get attacker team
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if team has sabotage tokens
        if (team.sabotageTokens <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No sabotage tokens available',
            });
        }

        // Check cooldown
        if (team.sabotageCooldownUntil && new Date() < team.sabotageCooldownUntil) {
            return res.status(400).json({
                success: false,
                message: 'Sabotage is on cooldown',
                cooldownUntil: team.sabotageCooldownUntil,
            });
        }

        // Get target team
        const targetTeam = await Team.findById(targetTeamId);
        if (!targetTeam) {
            return res.status(404).json({
                success: false,
                message: 'Target team not found',
            });
        }

        // Deduct token and set cooldown atomically
        const now = new Date();
        const updatedTeam = await Team.findOneAndUpdate(
            {
                _id: teamId,
                sabotageTokens: { $gt: 0 },
                $or: [
                    { sabotageCooldownUntil: null },
                    { sabotageCooldownUntil: { $lte: now } }
                ]
            },
            {
                $inc: { sabotageTokens: -1 },
                $set: { sabotageCooldownUntil: new Date(Date.now() + 5 * 60 * 1000) }
            },
            { new: true }
        );

        if (!updatedTeam) {
            return res.status(400).json({
                success: false,
                message: 'Cannot launch sabotage. Either no tokens or on cooldown.',
            });
        }

        // Broadcast stats update (token deduction)
        broadcastTeamStatsUpdate(teamId);

        // Broadcast leaderboard update (token deduction)
        broadcastLeaderboardUpdate();

        // Check if target has active shield
        if (targetTeam.shieldActive && targetTeam.shieldExpiresAt && new Date() < targetTeam.shieldExpiresAt) {
            // Shield protects against ONE attack and then breaks
            targetTeam.shieldActive = false;
            targetTeam.shieldExpiresAt = null;
            await targetTeam.save();

            // Notify target team that their shield broke
            broadcastTeamStatsUpdate(targetTeamId);
            
            return res.status(400).json({
                success: false,
                message: `${targetTeam.teamName} had an active shield! Your sabotage was blocked, but their shield is now broken.`,
                targetHasShield: true,
                data: {
                    sabotageTokens: updatedTeam.sabotageTokens,
                    cooldownUntil: updatedTeam.sabotageCooldownUntil,
                },
            });
        }

        // Save sabotage to target team's persistent state
        const durations = {
            'blackout': 60 * 1000,
            'typing-delay': 60 * 1000,
        };
        const duration = durations[sabotageType] || 30000;

        targetTeam.activeSabotages.push({
            type: sabotageType,
            startTime: now,
            endTime: new Date(now.getTime() + duration),
            fromTeamName: updatedTeam.teamName
        });
        await targetTeam.save();

        // Broadcast sabotage effect via WebSocket
        await broadcastSabotageAttack(targetTeamId, updatedTeam.teamName, sabotageType, targetTeam.activeSabotages[targetTeam.activeSabotages.length - 1].endTime);

        res.status(200).json({
            success: true,
            message: `Successfully sabotaged ${targetTeam.teamName} with ${sabotageType}`,
            data: {
                targetTeam: targetTeam.teamName,
                sabotageType,
                sabotageTokens: updatedTeam.sabotageTokens,
                cooldownUntil: updatedTeam.sabotageCooldownUntil,
            },
        });
    } catch (error) {
        console.error('Error launching sabotage:', error);
        res.status(500).json({
            success: false,
            message: 'Error launching sabotage',
            error: error.message,
        });
    }
};
