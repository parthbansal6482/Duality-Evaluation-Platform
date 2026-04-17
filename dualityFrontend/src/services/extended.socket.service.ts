import { io, Socket } from 'socket.io-client';
import { LeaderboardTeam } from './team.service';

const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return window.location.origin;
    if (apiUrl.startsWith('/')) return window.location.origin;
    return apiUrl.replace('/api', '');
};

const SOCKET_URL = getSocketUrl();

export interface TeamStatsUpdate {
    teamId?: string;
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
    teamId?: string;
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
    duration?: number;
}

export interface DisqualificationUpdate {
    teamId?: string;
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

class ExtendedSocketService {
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
            if (saved) this.alertBuffer = JSON.parse(saved);
        } catch {
            this.alertBuffer = [];
        }
    }

    private saveAlertBuffer() {
        try {
            localStorage.setItem('cheating_alerts', JSON.stringify(this.alertBuffer));
        } catch {
            // ignore
        }
    }

    connect() {
        if (this.socket?.connected) {
            const token = localStorage.getItem('token');
            if (token) this.socket.emit('team:authenticate', token);
            return;
        }

        console.log('[ExtSocket] Connecting to:', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 20000,
        });

        this.socket.on('connect', () => {
            console.log('[ExtSocket] Connected:', this.socket?.id);
            const token = localStorage.getItem('token');
            if (token) this.socket?.emit('team:authenticate', token);
        });

        this.socket.on('disconnect', () => console.log('[ExtSocket] Disconnected'));
        this.socket.on('connect_error', (err) => console.error('[ExtSocket] Error:', err));

        this.socket.on('leaderboard:update', (data: LeaderboardTeam[]) => {
            this.leaderboardCallbacks.forEach(cb => cb(data));
        });

        this.socket.on('team:stats-update', (data: TeamStatsUpdate) => {
            this.teamStatsCallbacks.forEach(cb => cb(data));
        });

        this.socket.on('submission:update', (data: SubmissionUpdate) => {
            this.submissionCallbacks.forEach(cb => cb(data));
        });

        this.socket.on('cheating:alert', (data: CheatingAlert) => {
            if (data.action === 'end') {
                let found = false;
                this.alertBuffer = this.alertBuffer.map(a => {
                    if (a.teamName === data.teamName && a.violationType === data.violationType && a.action === 'start' && a.duration === undefined) {
                        found = true;
                        return { ...a, duration: data.duration, action: 'end' as const };
                    }
                    return a;
                });
                if (!found) this.alertBuffer = [data, ...this.alertBuffer].slice(0, 50);
            } else {
                this.alertBuffer = [data, ...this.alertBuffer].slice(0, 50);
            }
            this.saveAlertBuffer();
            this.cheatingAlertCallbacks.forEach(cb => cb(data));
        });

        this.socket.on('team:disqualification-update', (data: DisqualificationUpdate) => {
            this.disqualificationCallbacks.forEach(cb => cb(data));
        });

        this.socket.on('team:sabotage', (data: any) => {
            this.sabotageCallbacks.forEach(cb => cb(data));
        });

        this.socket.on('round:update', (data: RoundUpdate) => {
            this.roundCallbacks.forEach(cb => cb(data));
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Generic event listener
     */
    on(eventName: string, callback: (...args: any[]) => void) {
        this.socket?.on(eventName, callback);
    }

    /**
     * Remove generic event listener
     */
    off(eventName: string, callback: (...args: any[]) => void) {
        this.socket?.off(eventName, callback);
    }

    onLeaderboardUpdate(callback: (data: LeaderboardTeam[]) => void) {
        this.leaderboardCallbacks.add(callback);
        return () => this.leaderboardCallbacks.delete(callback);
    }

    onTeamStatsUpdate(callback: (data: TeamStatsUpdate) => void) {
        this.teamStatsCallbacks.add(callback);
        return () => this.teamStatsCallbacks.delete(callback);
    }

    onSubmissionUpdate(callback: (data: SubmissionUpdate) => void) {
        this.submissionCallbacks.add(callback);
        return () => this.submissionCallbacks.delete(callback);
    }

    onCheatingAlert(callback: (data: CheatingAlert) => void) {
        this.cheatingAlertCallbacks.add(callback);
        return () => this.cheatingAlertCallbacks.delete(callback);
    }

    onDisqualificationUpdate(callback: (data: DisqualificationUpdate) => void) {
        this.disqualificationCallbacks.add(callback);
        return () => this.disqualificationCallbacks.delete(callback);
    }

    onSabotageAttack(callback: (data: any) => void) {
        this.sabotageCallbacks.add(callback);
        return () => this.sabotageCallbacks.delete(callback);
    }

    onRoundUpdate(callback: (data: RoundUpdate) => void) {
        this.roundCallbacks.add(callback);
        return () => this.roundCallbacks.delete(callback);
    }

    reportViolation(teamName: string, roundName: string, violationType: string, action?: 'start' | 'end', duration?: number) {
        if (this.socket?.connected) {
            this.socket.emit('cheating:violation', { teamName, roundName, violationType, action, duration });
        }
    }

    getRecentAlerts(): CheatingAlert[] {
        return [...this.alertBuffer];
    }

    clearAlertBuffer() {
        this.alertBuffer = [];
        localStorage.removeItem('cheating_alerts');
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Export singleton instance (kept as `socketService` for backward-compat with restored components)
export const socketService = new ExtendedSocketService();
