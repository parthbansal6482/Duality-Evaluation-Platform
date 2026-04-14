import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Layers } from 'lucide-react';
import { socketService, CheatingAlert } from '../../services/extended.socket.service';

export function CheatingAlertsList() {
    const [alerts, setAlerts] = useState<CheatingAlert[]>([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Initial alerts from merged buffer
        setAlerts(socketService.getRecentAlerts());

        // Update when any alert arrives (SocketService handles the merging logic)
        const unsubscribe = socketService.onCheatingAlert(() => {
            setAlerts(socketService.getRecentAlerts());
        });

        return () => unsubscribe();
    }, []);

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    const getDisplayDuration = (alert: CheatingAlert) => {
        if (alert.duration !== undefined) return formatDuration(alert.duration);

        // For active ones, calculate current elapsed time
        const startTS = new Date(alert.timestamp).getTime();
        const elapsed = Math.max(0, Math.round((now - startTS) / 1000));
        return `${formatDuration(elapsed)} (Active)`;
    };

    const getViolationLabel = (type: string) => {
        switch (type) {
            case 'tab-switch': return 'Tab Switch';
            case 'window-blur': return 'Lost Focus';
            default: return type;
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-white">Live Cheating Alerts</h3>
                </div>
                <button
                    onClick={() => {
                        socketService.clearAlertBuffer();
                        setAlerts([]);
                    }}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="divide-y divide-zinc-800 max-h-[400px] overflow-auto">
                {alerts.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No cheating incidents detected yet.</p>
                    </div>
                ) : (
                    alerts.map((alert, index) => (
                        <div key={index} className={`p-4 transition-colors ${!alert.duration && alert.action === 'start' ? 'bg-red-500/5' : ''}`}>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">{alert.teamName}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${alert.violationType === 'tab-switch' ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'
                                            }`}>
                                            {getViolationLabel(alert.violationType)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Layers className="w-3 h-3" />
                                            {alert.roundName}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`text-sm font-mono font-bold ${!alert.duration ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                                        {getDisplayDuration(alert)}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Duration</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
