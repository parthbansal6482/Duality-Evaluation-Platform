import { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { getLeaderboard, LeaderboardTeam } from '../../services/team.service';
import { socketService } from '../../services/socket.service';

export function Leaderboard({ currentTeam }: { currentTeam: string }) {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Connect to WebSocket
    socketService.connect();

    // Initial fetch
    fetchLeaderboard();

    // Subscribe to real-time updates
    const unsubscribe = socketService.onLeaderboardUpdate((data) => {
      console.log('Real-time leaderboard update received');
      setTeams(data);
      setError('');
      setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setTeams(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (error || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-xl mb-4">{error || 'No teams found'}</p>
        <button
          onClick={fetchLeaderboard}
          className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentTeamData = teams.find((t) => t.teamName === currentTeam);
  const topTeam = teams[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        <p className="text-gray-400 mt-1">Live rankings • Real-time updates</p>
      </div>

      {/* Top 3 Podium */}
      {teams.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {teams.slice(0, 3).map((team, index) => (
            <div
              key={team.teamName}
              className={`${index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'
                } ${index === 0 ? 'transform scale-105' : ''}`}
            >
              <div
                className={`bg-zinc-900 border rounded-xl p-6 text-center ${team.teamName === currentTeam
                  ? 'border-white shadow-lg shadow-white/10'
                  : 'border-zinc-800'
                  }`}
              >
                <div className="flex justify-center mb-3">
                  {getRankIcon(team.rank)}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{team.teamName}</h3>
                <p className="text-3xl font-bold text-white mb-2">{team.score}</p>
                <p className="text-sm text-gray-400">score</p>
                <div className="mt-3 text-xs text-gray-500">
                  {team.memberCount} members
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black border-b border-zinc-800">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Rank</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Team</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Score</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Currency</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Members</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr
                  key={team.teamName}
                  className={`border-b border-zinc-800 last:border-0 transition-colors ${team.teamName === currentTeam
                    ? 'bg-white/5'
                    : 'hover:bg-zinc-800/50'
                    }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {team.rank <= 3 ? (
                        getRankIcon(team.rank)
                      ) : (
                        <span className="text-gray-400 font-medium">#{team.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${team.teamName === currentTeam ? 'text-white' : 'text-gray-300'
                          }`}
                      >
                        {team.teamName}
                      </span>
                      {team.teamName === currentTeam && (
                        <span className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-bold">{team.score}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400">{team.points}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400">{team.memberCount} members</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-sm">⚡ {team.tokens.sabotage}</span>
                      <span className="text-blue-500 text-sm">🛡️ {team.tokens.shield}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Your Rank</p>
          <p className="text-2xl font-bold text-white">
            #{currentTeamData?.rank || '-'}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Score Gap (to #1)</p>
          <p className="text-2xl font-bold text-white">
            {currentTeamData ? topTeam.score - currentTeamData.score : '-'}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Total Teams</p>
          <p className="text-2xl font-bold text-white">{teams.length}</p>
        </div>
      </div>
    </div>
  );
}
