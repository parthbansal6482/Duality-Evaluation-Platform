import { useState, useEffect } from 'react';
import {
  Home,
  Trophy,
  PlayCircle,
  ShoppingBag,
  LogOut,
  Coins,
  Shield as ShieldIcon,
  Zap,
  Crosshair
} from 'lucide-react';
import { DashboardHome } from './team-dashboard/DashboardHome';
import { Leaderboard } from './team-dashboard/Leaderboard';
import { ActiveRounds } from './team-dashboard/ActiveRounds';
import { TokenShop } from './team-dashboard/TokenShop';
import { SabotagePanel } from './team-dashboard/SabotagePanel';
import { getTeamStats, TeamStats, purchaseToken, getLeaderboard, LeaderboardTeam, activateShield, launchSabotage } from '../services/team.service';
import { socketService } from '../services/socket.service';

type Section = 'home' | 'leaderboard' | 'rounds' | 'shop' | 'tactics';

interface TeamDashboardProps {
  onEnterRound?: (roundId: string) => void;
}

export function TeamDashboard({ onEnterRound }: TeamDashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [teamData, setTeamData] = useState<TeamStats | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Connect to WebSocket
    socketService.connect();

    // Initial fetch
    fetchTeamData();
    fetchLeaderboard();

    // Subscribe to real-time team stats updates
    const unsubscribeStats = socketService.onTeamStatsUpdate((data) => {
      // Only update if this is the current team
      if (teamData && data.teamName.toLowerCase().trim() === teamData.teamName.toLowerCase().trim()) {
        console.log('Real-time team stats update received for current team');
        setTeamData((prev) => prev ? {
          ...prev,
          points: data.points,
          score: data.score,
          rank: data.rank,
          tokens: data.tokens,
          sabotageCooldownUntil: data.sabotageCooldownUntil,
          shieldCooldownUntil: data.shieldCooldownUntil,
          shieldActive: data.shieldActive,
          shieldExpiresAt: data.shieldExpiresAt,
          activeSabotages: data.activeSabotages,
        } : null);
      }
    });

    // Subscribe to disqualification updates
    const unsubscribeDisqualification = socketService.onDisqualificationUpdate((data) => {
      if (teamData && data.teamName === teamData.teamName) {
        console.log('Real-time disqualification update received:', data.isDisqualified);
        setTeamData(prev => {
          if (!prev) return null;
          const rounds = prev.disqualifiedRounds || [];
          const updatedRounds = data.isDisqualified
            ? [...new Set([...rounds, data.roundId])]
            : rounds.filter(id => id !== data.roundId);
          return { ...prev, disqualifiedRounds: updatedRounds };
        });
      }
    });

    // Subscribe to leaderboard updates
    const unsubscribeLeaderboard = socketService.onLeaderboardUpdate((data: LeaderboardTeam[]) => {
      console.log('Real-time leaderboard update received in TeamDashboard');
      setLeaderboardData(data);
    });

    // Subscribe to sabotage attacks
    const unsubscribeSabotage = socketService.onSabotageAttack((data: any) => {
      if (teamData && data.targetTeamName === teamData.teamName) {
        console.log('Real-time sabotage received in Dashboard!', data.type);
        // We could show a toast here, or just let team stats update handle it
        // The team stats update should also be triggered from the backend for the target
        alert(`⚠️ Your team was just sabotaged with ${data.type} by ${data.attackerTeamName}!`);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeStats();
      unsubscribeDisqualification();
      unsubscribeLeaderboard();
      unsubscribeSabotage();
    };
  }, [teamData?.teamName]);

  const fetchTeamData = async () => {
    try {
      const data = await getTeamStats();
      setTeamData(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboardData(data);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/team-auth';
  };

  const navItems = [
    { id: 'home' as Section, label: 'Dashboard', icon: Home },
    { id: 'leaderboard' as Section, label: 'Leaderboard', icon: Trophy },
    { id: 'rounds' as Section, label: 'Active Rounds', icon: PlayCircle },
    { id: 'shop' as Section, label: 'Token Shop', icon: ShoppingBag },
    { id: 'tactics' as Section, label: 'Tactics', icon: Crosshair },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading team data...</div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || 'Failed to load team data'}</p>
          <button
            onClick={fetchTeamData}
            className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-white">{teamData.teamName}</h1>
              <p className="text-sm text-gray-400">Rank #{teamData.rank}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-4 py-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-400">Score</p>
                <p className="text-lg font-bold text-white">{teamData.score}</p>
              </div>
            </div>

            {/* Points Display */}
            <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-4 py-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-400">Points</p>
                <p className="text-lg font-bold text-white">{teamData.points}</p>
              </div>
            </div>

            {/* Tokens Display */}
            <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-4 py-2">
              <Zap className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-gray-400">Sabotage</p>
                <span className="text-lg font-bold text-white">{teamData.tokens.sabotage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-4 py-2">
              <ShieldIcon className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Shield</p>
                <span className="text-lg font-bold text-white">{teamData.tokens.shield}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-zinc-900 border-b border-zinc-800 px-6">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${activeSection === item.id
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-6 overflow-auto">
        {activeSection === 'home' && <DashboardHome teamData={teamData} />}
        {activeSection === 'leaderboard' && <Leaderboard currentTeam={teamData.teamName} />}
        {activeSection === 'rounds' && (
          <ActiveRounds
            onEnterRound={onEnterRound}
            disqualifiedRounds={teamData.disqualifiedRounds}
            completedRounds={teamData.completedRounds}
          />
        )}
        {activeSection === 'shop' && (
          <TokenShop
            currentPoints={teamData.points}
            currentTokens={teamData.tokens}
            onPurchase={async (type, cost) => {
              try {
                const updatedStats = await purchaseToken(type as 'sabotage' | 'shield', cost);
                setTeamData({
                  ...teamData,
                  points: updatedStats.points,
                  score: updatedStats.score,
                  rank: updatedStats.rank,
                  tokens: updatedStats.tokens,
                });
              } catch (err: any) {
                console.error('Error purchasing token:', err);
                alert(err.response?.data?.message || 'Failed to purchase token');
              }
            }}
          />
        )}
        {activeSection === 'tactics' && (
          <SabotagePanel
            currentTokens={teamData.tokens}
            leaderboardTeams={leaderboardData}
            onActivateShield={async () => {
              try {
                await activateShield();
                await fetchTeamData();
              } catch (err: any) {
                console.error('Error activating shield:', err);
                alert(err.response?.data?.message || 'Failed to activate shield');
              }
            }}
            onLaunchSabotage={async (targetTeamId: string, sabotageType: string) => {
              try {
                await launchSabotage(targetTeamId, sabotageType);
                await fetchTeamData();
              } catch (err: any) {
                console.error('Error launching sabotage:', err);
                alert(err.response?.data?.message || 'Failed to launch sabotage');
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
