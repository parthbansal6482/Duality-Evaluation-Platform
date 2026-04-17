import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

class DualitySocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'],
        });

        this.socket.on('connect', () => {
            console.log('[DualitySocket] Connected:', this.socket?.id);
            // Auto-authenticate if token exists
            const token = localStorage.getItem('dualityToken');
            if (token) {
                this.authenticate(token);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('[DualitySocket] Disconnected');
        });
    }

    authenticate(token: string) {
        this.socket?.emit('duality:authenticate', token);
    }

    onSubmissionUpdate(callback: (data: {
        submissionId: string;
        question: string;
        status: string;
        testCasesPassed: number;
        totalTestCases: number;
        executionTime: number;
        memoryUsed: number;
        submittedAt: string;
    }) => void) {
        this.socket?.on('duality:submission:update', callback);
        return () => {
            this.socket?.off('duality:submission:update', callback);
        };
    }

    onQuestionUpdate(callback: (data: { timestamp: string }) => void) {
        this.socket?.on('duality:question:update', callback);
        return () => {
            this.socket?.off('duality:question:update', callback);
        };
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

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}

export const dualitySocket = new DualitySocketService();
export default dualitySocket;
