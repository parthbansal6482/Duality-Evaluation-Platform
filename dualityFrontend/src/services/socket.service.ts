import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5001';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    /**
     * Initialize connection to the backend
     */
    connect() {
        if (this.socket?.connected) return;

        this.socket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'], // Fallback options
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected to backend:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
             console.log('[Socket] Disconnected');
        });

        this.socket.onAny((eventName, ...args) => {
            const handlers = this.listeners.get(eventName);
            if (handlers) {
                handlers.forEach(handler => handler(args[0]));
            }
        });
    }

    /**
     * Subscribe to an event
     */
    on(eventName: string, callback: (data: any) => void) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName)?.add(callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(eventName: string, callback: (data: any) => void) {
        this.listeners.get(eventName)?.delete(callback);
    }

    /**
     * Disconnect from the backend
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const dualitySocket = new SocketService();
