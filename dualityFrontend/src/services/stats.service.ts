import api from './api';

export interface OverviewStats {
    totalTeams: number;
    pendingApprovals: number;
    totalQuestions: number;
    activeRounds: number;
}

export interface Activity {
    type: 'team' | 'question' | 'round';
    action: string;
    status?: string;
    timestamp: string;
}

/**
 * Get overview statistics
 */
export const getOverviewStats = async (): Promise<OverviewStats> => {
    const response = await api.get('/stats/overview');
    return response.data.data;
};

/**
 * Get recent activity
 */
export const getRecentActivity = async (limit: number = 10): Promise<Activity[]> => {
    const response = await api.get(`/stats/activity?limit=${limit}`);
    return response.data.data;
};
