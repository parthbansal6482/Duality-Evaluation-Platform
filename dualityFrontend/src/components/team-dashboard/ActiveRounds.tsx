import { useState, useEffect } from 'react';
import { Clock, Play, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { getActiveRounds } from '../../services/round.service';

interface Round {
  _id: string;
  name: string;
  status: 'upcoming' | 'active' | 'completed';
  duration: number;
  timeRemaining?: number;
  startTime?: string;
  endTime?: string;
}

interface ActiveRoundsProps {
  onEnterRound?: (roundId: string) => void;
  disqualifiedRounds?: string[];
  completedRounds?: string[];
}

export function ActiveRounds({ onEnterRound, disqualifiedRounds = [], completedRounds = [] }: ActiveRoundsProps) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRounds();
    // Refresh rounds every 30 seconds
    const interval = setInterval(fetchRounds, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRounds = async () => {
    try {
      const response = await getActiveRounds();
      setRounds(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching rounds:', err);
      setError(err.response?.data?.message || 'Failed to load rounds');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const handleEnterRound = (roundId: string) => {
    console.log('Entering round:', roundId);
    if (onEnterRound) {
      onEnterRound(roundId);
    }
  };

  const getStatusBadge = (status: Round['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Live Now
          </span>
        );
      case 'upcoming':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-500/10 text-gray-500 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Contest Rounds</h2>
        <p className="text-gray-400 mt-1">Join active rounds and track your progress</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading rounds...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && rounds.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No active or upcoming rounds at the moment.</p>
        </div>
      )}

      {/* Active Round Alert */}
      {!loading && rounds.some((r) => r.status === 'active') && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-green-500 font-medium">Round is Live!</p>
              <p className="text-sm text-green-500/80">
                {rounds.find((r) => r.status === 'active')?.name} is currently active
              </p>
            </div>
          </div>
          {(() => {
            const activeRound = rounds.find((r) => r.status === 'active');
            if (!activeRound) return null;
            const isDisqualified = disqualifiedRounds.includes(activeRound._id);
            const isCompleted = completedRounds.includes(activeRound._id);

            return (
              <button
                disabled={isDisqualified || isCompleted}
                onClick={() => handleEnterRound(activeRound._id)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isDisqualified
                  ? 'bg-red-500/20 text-red-500 cursor-not-allowed border border-red-500/30'
                  : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed border border-emerald-500/30'
                    : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
              >
                {isDisqualified ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Disqualified
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Round Finished
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Enter Now
                  </>
                )}
              </button>
            );
          })()}
        </div>
      )}

      {/* Rounds List */}
      {!loading && !error && rounds.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {rounds.map((round) => (
            <div
              key={round._id}
              className={`bg-zinc-900 border rounded-xl p-6 transition-all ${round.status === 'active'
                ? 'border-green-500 shadow-lg shadow-green-500/20'
                : 'border-zinc-800'
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{round.name}</h3>
                    {getStatusBadge(round.status)}
                    {completedRounds.includes(round._id) && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        You Completed This
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{round.duration} minutes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Remaining (for active rounds) */}
              {round.status === 'active' && round.timeRemaining && (
                <div className="mb-4 p-3 bg-black border border-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Time Remaining</span>
                    <span className="text-xl font-bold text-white font-mono">
                      {formatTime(round.timeRemaining)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div>
                {round.status === 'active' && (() => {
                  const isDisqualified = disqualifiedRounds.includes(round._id);
                  const isCompleted = completedRounds.includes(round._id);
                  return (
                    <button
                      disabled={isDisqualified || isCompleted}
                      onClick={() => handleEnterRound(round._id)}
                      className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isDisqualified
                        ? 'bg-red-500/10 text-red-500 cursor-not-allowed border border-red-500/20'
                        : isCompleted
                          ? 'bg-emerald-500/10 text-emerald-500 cursor-not-allowed border border-emerald-500/20'
                          : 'bg-white text-black hover:bg-gray-200'
                        }`}
                    >
                      {isDisqualified ? (
                        <>
                          <Lock className="w-5 h-5" />
                          Disqualified from this Round
                        </>
                      ) : isCompleted ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Round Completed
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Enter Round
                        </>
                      )}
                    </button>
                  );
                })()}

                {round.status === 'upcoming' && (
                  <button
                    disabled
                    className="w-full bg-zinc-800 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2">
                    <Lock className="w-5 h-5" />
                    Waiting for Admin to Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How it Works</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-white">•</span>
            <p>
              Wait for the admin to start a round. When active, you'll see a "Live Now" badge.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-white">•</span>
            <p>
              Click "Enter Round" to access the questions and start solving.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-white">•</span>
            <p>
              Your team can only use one laptop at a time to solve problems.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-white">•</span>
            <p>
              Points are awarded based on correctness and time taken to solve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}