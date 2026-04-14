import api from './api';

export interface TeamMember {
    name: string;
    email: string;
}

export interface TeamRegistrationData {
    teamName: string;
    password: string;
    members: TeamMember[];
}

export interface TeamLoginData {
    teamName: string;
    password: string;
}

export interface TeamStats {
    teamName: string;
    members: TeamMember[];
    points: number;
    score: number;
    rank: number;
    tokens: {
        sabotage: number;
        shield: number;
    };
    activeRoundsCount: number;
    disqualifiedRounds?: string[];
    completedRounds?: string[];
    sabotageCooldownUntil?: string;
    shieldCooldownUntil?: string;
    shieldActive?: boolean;
    shieldExpiresAt?: string;
    activeSabotages?: Array<{
        type: 'blackout' | 'typing-delay' | 'format-chaos' | 'ui-glitch';
        startTime: string;
        endTime: string;
        fromTeamName: string;
    }>;
}

export interface TeamActivity {
    type: 'submission' | 'purchase';
    action: string;
    points: string;
    timestamp: string;
    status: 'success' | 'neutral' | 'purchase';
}

export interface LeaderboardTeam {
    _id: string;
    rank: number;
    teamName: string;
    points: number;
    score: number;
    memberCount: number;
    tokens: {
        sabotage: number;
        shield: number;
    };
    shieldActive?: boolean;
}

/**
 * Register a new team
 */
export const registerTeam = async (data: TeamRegistrationData) => {
    const response = await api.post('/team/register', data);
    return response.data;
};

/**
 * Login team
 */
export const loginTeam = async (data: TeamLoginData) => {
    const response = await api.post('/team/login', data);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

/**
 * Get team profile
 */
export const getTeamProfile = async () => {
    const response = await api.get('/team/profile');
    return response.data.team;
};

/**
 * Get team stats (points, rank, tokens, active rounds)
 */
export const getTeamStats = async (): Promise<TeamStats> => {
    const response = await api.get('/team/stats');
    return response.data.data;
};

/**
 * Get team recent activity
 */
export const getTeamActivity = async (limit: number = 10): Promise<TeamActivity[]> => {
    const response = await api.get(`/team/activity?limit=${limit}`);
    return response.data.data;
};

/**
 * Get leaderboard (all teams ranked by points)
 */
export const getLeaderboard = async (): Promise<LeaderboardTeam[]> => {
    const response = await api.get('/team/leaderboard');
    return response.data.data;
};

/**
 * Purchase a token (sabotage or shield)
 */
export const purchaseToken = async (tokenType: 'sabotage' | 'shield', cost: number): Promise<TeamStats> => {
    const response = await api.post('/team/purchase-token', { tokenType, cost });
    return response.data.data;
};

/**
 * Activate shield protection
 */
export const activateShield = async () => {
    const response = await api.post('/team/activate-shield');
    return response.data;
};

/**
 * Launch sabotage attack on target team
 */
export const launchSabotage = async (targetTeamId: string, sabotageType: string) => {
    const response = await api.post('/team/launch-sabotage', { targetTeamId, sabotageType });
    return response.data;
};

// ============================================
// Admin Team Management Functions
// ============================================

/**
 * Get all teams with optional status filter (Admin only)
 */
export const getAllTeams = async (status?: 'pending' | 'approved' | 'rejected') => {
    const params = status ? { status } : {};
    const response = await api.get('/teams', { params });
    return response.data;
};

/**
 * Approve a team (Admin only)
 */
export const approveTeam = async (teamId: string) => {
    const response = await api.put(`/teams/${teamId}/approve`);
    return response.data;
};

/**
 * Reject a team (Admin only)
 */
export const rejectTeam = async (teamId: string) => {
    const response = await api.put(`/teams/${teamId}/reject`);
    return response.data;
};

/**
 * Toggle team disqualification for a round (Admin only)
 */
export const toggleDisqualification = async (teamId: string, roundId: string) => {
    const response = await api.put(`/teams/${teamId}/toggle-disqualification`, { roundId });
    return response.data;
};
