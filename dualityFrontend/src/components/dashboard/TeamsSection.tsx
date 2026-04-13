import { useState, useEffect } from 'react';
import { Search, Check, X, Eye, Users as UsersIcon, Mail } from 'lucide-react';
import { getAllTeams, approveTeam, rejectTeam } from '../../services/team.service';
import { socketService } from '../../services/socket.service';
import { LeaderboardTeam } from '../../services/team.service';

interface Member {
  name: string;
  email: string;
  phone: string;
}

interface Team {
  _id: string;
  teamName: string;
  members: Member[];
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  points?: number;
  score?: number;
}

export function TeamsSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Fetch teams on component mount and when filter changes
  useEffect(() => {
    fetchTeams();

    // Subscribe to real-time updates
    socketService.connect();

    const unsubscribe = socketService.onLeaderboardUpdate((data: LeaderboardTeam[]) => {
      setTeams((prevTeams) => {
        return prevTeams.map(team => {
          const updatedTeam = data.find(t => t._id === team._id);
          if (updatedTeam) {
            return {
              ...team,
              points: updatedTeam.points,
              score: updatedTeam.score
            };
          }
          return team;
        });
      });
    });

    return () => {
      unsubscribe();
    };
  }, [filterStatus]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError('');
      const statusFilter = filterStatus === 'all' ? undefined : filterStatus;
      const response = await getAllTeams(statusFilter);
      setTeams(response.teams);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleApprove = async (teamId: string) => {
    try {
      await approveTeam(teamId);
      // Refresh teams list
      await fetchTeams();
      setSelectedTeam(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve team');
    }
  };

  const handleReject = async (teamId: string) => {
    if (confirm('Are you sure you want to reject this team?')) {
      try {
        await rejectTeam(teamId);
        // Refresh teams list
        await fetchTeams();
        setSelectedTeam(null);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to reject team');
      }
    }
  };

  const statusColors = {
    pending: 'text-yellow-500 bg-yellow-500/10',
    approved: 'text-green-500 bg-green-500/10',
    rejected: 'text-red-500 bg-red-500/10',
  };

  const statusCounts = {
    all: teams.length,
    pending: teams.filter(t => t.status === 'pending').length,
    approved: teams.filter(t => t.status === 'approved').length,
    rejected: teams.filter(t => t.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Team Management</h2>
        <p className="text-gray-400 mt-1">Review and manage registered teams</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`p-4 rounded-xl border transition-all ${filterStatus === status
              ? 'bg-zinc-900 border-white'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
          >
            <p className="text-2xl font-bold text-white">{statusCounts[status]}</p>
            <p className="text-sm text-gray-400 mt-1 capitalize">{status}</p>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search teams by name or member..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-12 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Teams List */}
      <div className="space-y-4">
        {filteredTeams.map((team) => (
          <div
            key={team._id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{team.teamName}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[team.status]
                      }`}
                  >
                    {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" />
                    <span>{team.members.length} members</span>
                  </div>
                  <span>•</span>
                  <span>Registered {new Date(team.registrationDate).toLocaleDateString()}</span>
                </div>

                <div className="space-y-2">
                  {team.members.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <span className="w-6 text-gray-500">{idx + 1}.</span>
                      <span>{member.name}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500">{member.email}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <div className="flex flex-col items-end gap-2 pr-4 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase font-bold">Score</span>
                    <span className="text-lg font-bold text-white">{team.score || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase font-bold">Points</span>
                    <span className="text-sm font-medium text-yellow-500">{team.points || 0}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTeam(team)}
                  className="p-2 bg-zinc-800 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {team.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(team._id)}
                      className="p-2 bg-green-500/10 rounded-lg text-green-500 hover:bg-green-500/20 transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(team._id)}
                      className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No teams found.</p>
          </div>
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl">
            <div className="border-b border-zinc-800 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTeam.teamName}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Registered on {new Date(selectedTeam.registrationDate).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <span
                  className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium ${statusColors[selectedTeam.status]
                    }`}
                >
                  {selectedTeam.status.charAt(0).toUpperCase() + selectedTeam.status.slice(1)}
                </span>
              </div>

              {/* Team Members */}
              <div>
                <label className="block text-sm text-gray-400 mb-3">
                  Team Members ({selectedTeam.members.length})
                </label>
                <div className="space-y-3">
                  {selectedTeam.members.map((member, idx) => (
                    <div
                      key={idx}
                      className="bg-black border border-zinc-800 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{member.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedTeam.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleReject(selectedTeam._id)}
                    className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-lg font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Reject Team
                  </button>
                  <button
                    onClick={() => handleApprove(selectedTeam._id)}
                    className="flex-1 bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Approve Team
                  </button>
                </div>
              )}

              {selectedTeam.status !== 'pending' && (
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="w-full bg-zinc-800 text-white py-3 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
