import { io, Socket } from 'socket.io-client';
import { LeaderboardTeam } from './team.service';

const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return window.location.origin;
    
    // If it's a relative path, use current origin
    if (apiUrl.startsWith('/')) return window.location.origin;
    
    // For absolute URLs, strip the /api suffix if present
    return apiUrl.replace('/api', '');
};

const SOCKET_URL = getSocketUrl();

export interface TeamStatsUpdate {
    teamName: string;
    points: number;
    score: number;
    rank: number;
    tokens: {
        sabotage: number;
        shield: number;
    };
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

export interface SubmissionUpdate {
    teamName: string;
    questionId: string;
    status: string;
    points: number;
    timestamp: string;
}

export interface CheatingAlert {
    teamName: string;
    roundName: string;
    violationType: string;
    timestamp: string;
    action?: 'start' | 'end';
    duration?: number; // In seconds
}

export interface DisqualificationUpdate {
    teamName: string;
    isDisqualified: boolean;
    roundId: string;
}

export interface RoundUpdate {
    _id: string;
    name: string;
    status: string;
    startTime?: string;
    endTime?: string;
    duration: number;
}

class SocketService {
    private socket: Socket | null = null;
    private leaderboardCallbacks: Set<(data: LeaderboardTeam[]) => void> = new Set();
    private teamStatsCallbacks: Set<(data: TeamStatsUpdate) => void> = new Set();
    private submissionCallbacks: Set<(data: SubmissionUpdate) => void> = new Set();
    private cheatingAlertCallbacks: Set<(data: CheatingAlert) => void> = new Set();
    private disqualificationCallbacks: Set<(data: DisqualificationUpdate) => void> = new Set();
    private sabotageCallbacks: Set<(data: any) => void> = new Set();
    private roundCallbacks: Set<(data: RoundUpdate) => void> = new Set();
    private alertBuffer: CheatingAlert[] = [];

    constructor() {
        this.loadAlertBuffer();
    }

    private loadAlertBuffer() {
        try {
            const saved = localStorage.getItem('cheating_alerts');
            if (saved) {
                this.alertBuffer = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading alert buffer:', error);
            this.alertBuffer = [];
        }
    }

    private saveAlertBuffer() {
        try {
            localStorage.setItem('cheating_alerts', JSON.stringify(this.alertBuffer));
        } catch (error) {
            console.error('Error saving alert buffer:', error);
        }
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.socket?.connected) {
            // Already connected, but maybe we just logged in?
            const token = localStorage.getItem('token');
            if (token) {
                this.socket.emit('team:authenticate', token);
            }
            return;
        }

        console.log('Attempting to connect to WebSocket at:', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 20000,
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected successfully! ID:', this.socket?.id, 'Transport:', (this.socket?.io as any)?.engine?.transport?.name);

            // Authenticate if we have a token
            const token = localStorage.getItem('token');
            if (token) {
                this.socket?.emit('team:authenticate', token);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        // Listen for leaderboard updates
        this.socket.on('leaderboard:update', (data: LeaderboardTeam[]) => {
            console.log('Leaderboard update received:', data.length, 'teams');
            this.leaderboardCallbacks.forEach((callback) => callback(data));
        });

        // Listen for team stats updates
        this.socket.on('team:stats-update', (data: TeamStatsUpdate) => {
            console.log('Team stats update received:', data.teamName);
            this.teamStatsCallbacks.forEach((callback) => callback(data));
        });

        // Listen for submission updates
        this.socket.on('submission:update', (data: SubmissionUpdate) => {
            console.log('Submission update received:', data.questionId, data.status);
            this.submissionCallbacks.forEach((callback) => callback(data));
        });

        // Listen for cheating alerts (Admin)
        this.socket.on('cheating:alert', (data: CheatingAlert) => {
            console.log('Cheating alert received:', data.teamName, data.violationType, data.action || 'n/a');

            // Add to buffer with merging logic
            if (data.action === 'end') {
                // If it's an 'end' alert, update the corresponding 'start' alert in the buffer
                let found = false;
                this.alertBuffer = this.alertBuffer.map((a) => {
                    // Match by team name and violation type where action is 'start' and duration not yet set
                    if (a.teamName === data.teamName && 
                        a.violationType === data.violationType && 
                        a.action === 'start' && 
                        a.duration === undefined) {
                        found = true;
                        return { ...a, duration: data.duration, action: 'end' as const };
                    }
                    return a;
                });
                
                // If for some reason we didn't find the start event in the current buffer, add it as is
                if (!found) {
                    this.alertBuffer = [data, ...this.alertBuffer].slice(0, 50);
                }
            } else {
                // For 'start' alerts, just add to the list
                this.alertBuffer = [data, ...this.alertBuffer].slice(0, 50);
            }

            this.saveAlertBuffer();
            this.cheatingAlertCallbacks.forEach((callback) => callback(data));
        });

        // Listen for disqualification updates (Team)
        this.socket.on('team:disqualification-update', (data: DisqualificationUpdate) => {
            console.log('Disqualification update received:', data.teamName, data.isDisqualified);
            this.disqualificationCallbacks.forEach((callback) => callback(data));
        });

        // Listen for sabotage attacks
        this.socket.on('team:sabotage', (data: any) => {
            console.log('Sabotage attack received:', data.type, 'from', data.attackerTeamName);
            this.sabotageCallbacks.forEach((callback) => callback(data));
        });

        // Listen for round updates
        this.socket.on('round:update', (data: RoundUpdate) => {
            console.log('Round update received:', data.name, data.status);
            this.roundCallbacks.forEach((callback) => callback(data));
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Subscribe to leaderboard updates
     */
    onLeaderboardUpdate(callback: (data: LeaderboardTeam[]) => void) {
        this.leaderboardCallbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.leaderboardCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to team stats updates
     */
    onTeamStatsUpdate(callback: (data: TeamStatsUpdate) => void) {
        this.teamStatsCallbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.teamStatsCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to submission updates
     */
    onSubmissionUpdate(callback: (data: SubmissionUpdate) => void) {
        this.submissionCallbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.submissionCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to cheating alerts (Admin only)
     */
    onCheatingAlert(callback: (data: CheatingAlert) => void) {
        this.cheatingAlertCallbacks.add(callback);
        return () => {
            this.cheatingAlertCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to disqualification updates
     */
    onDisqualificationUpdate(callback: (data: DisqualificationUpdate) => void) {
        this.disqualificationCallbacks.add(callback);
        return () => {
            this.disqualificationCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to sabotage attacks
     */
    onSabotageAttack(callback: (data: any) => void) {
        this.sabotageCallbacks.add(callback);
        return () => {
            this.sabotageCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to round updates
     */
    onRoundUpdate(callback: (data: RoundUpdate) => void) {
        this.roundCallbacks.add(callback);
        return () => {
            this.roundCallbacks.delete(callback);
        };
    }

    /**
     * Report a rules violation from the client
     */
    reportViolation(teamName: string, roundName: string, violationType: string, action?: 'start' | 'end', duration?: number) {
        if (this.socket?.connected) {
            this.socket.emit('cheating:violation', { teamName, roundName, violationType, action, duration });
        }
    }

    /**
     * Get recent alerts from buffer
     */
    getRecentAlerts(): CheatingAlert[] {
        return [...this.alertBuffer];
    }

    /**
     * Clear all alerts from buffer and persistence
     */
    clearAlertBuffer() {
        this.alertBuffer = [];
        localStorage.removeItem('cheating_alerts');
    }

    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Export singleton instance
export const socketService = new SocketService();
