import { useState, useEffect } from 'react';
import {
  Zap,
  Shield as ShieldIcon,
  Target,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';

interface SabotageEffect {
  id: string;
  type: 'blackout' | 'typing-delay' | 'format-chaos' | 'ui-glitch';
  name: string;
  duration: number;
  active: boolean;
  endTime?: number;
}

interface TeamTarget {
  id: string;
  name: string;
  rank: number;
  hasShield: boolean;
}

interface SabotagePanelProps {
  currentTokens: {
    sabotage: number;
    shield: number;
  };
  leaderboardTeams: Array<{
    _id: string;
    teamName: string;
    rank: number;
    shieldActive?: boolean;
  }>;
  onActivateShield: () => Promise<void>;
  onLaunchSabotage: (targetTeamId: string, sabotageType: string) => Promise<void>;
}

export function SabotagePanel({ currentTokens, leaderboardTeams, onActivateShield, onLaunchSabotage }: SabotagePanelProps) {
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [shieldEndTime, setShieldEndTime] = useState<number | null>(null);
  const [sabotageCooldown, setSabotageCooldown] = useState(0);
  const [shieldCooldown, setShieldCooldown] = useState(0);
  const [showSabotageModal, setShowSabotageModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TeamTarget | null>(null);
  const [activeEffects, setActiveEffects] = useState<SabotageEffect[]>([]);

  // Convert leaderboard teams to target format
  const teams: TeamTarget[] = leaderboardTeams.map(team => ({
    id: team._id,
    name: team.teamName,
    rank: team.rank,
    hasShield: team.shieldActive || false,
  }));

  const sabotageTypes: Omit<SabotageEffect, 'id' | 'active' | 'endTime'>[] = [
    {
      type: 'blackout',
      name: 'Screen Blackout',
      duration: 60,
    },
    {
      type: 'typing-delay',
      name: 'Typing Delay',
      duration: 60,
    },
    {
      type: 'format-chaos',
      name: 'Format Chaos',
      duration: 60,
    },
    {
      type: 'ui-glitch',
      name: 'UI Glitch',
      duration: 60,
    },
  ];

  // Cooldown timers
  useEffect(() => {
    const interval = setInterval(() => {
      if (sabotageCooldown > 0) {
        setSabotageCooldown((prev) => prev - 1);
      }
      if (shieldCooldown > 0) {
        setShieldCooldown((prev) => prev - 1);
      }
      if (shieldEndTime && Date.now() >= shieldEndTime) {
        setIsShieldActive(false);
        setShieldEndTime(null);
        setShieldCooldown(180); // 3 minute cooldown
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sabotageCooldown, shieldCooldown, shieldEndTime]);

  const handleActivateShield = async () => {
    if (currentTokens.shield > 0 && !isShieldActive && shieldCooldown === 0) {
      await onActivateShield();
      setIsShieldActive(true);
      setShieldEndTime(Date.now() + 600000); // 10 minutes
    }
  };

  const handleSabotage = async (effect: SabotageEffect['type']) => {
    if (currentTokens.sabotage > 0 && sabotageCooldown === 0 && selectedTarget) {
      if (selectedTarget.hasShield) {
        alert(`${selectedTarget.name} has a shield active! Your sabotage was blocked.`);
        return;
      }

      const sabotageEffect = sabotageTypes.find((s) => s.type === effect);
      if (sabotageEffect) {
        await onLaunchSabotage(selectedTarget.id, effect);
        setSabotageCooldown(300); // 5 minute cooldown
        setShowSabotageModal(false);
        setSelectedTarget(null);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatShieldTime = () => {
    if (!shieldEndTime) return '';
    const remaining = Math.max(0, Math.floor((shieldEndTime - Date.now()) / 1000));
    return formatTime(remaining);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Tactical Operations</h2>
        <p className="text-gray-400 mt-1">Use tokens to gain strategic advantages</p>
      </div>

      {/* Active Effects Alert */}
      {activeEffects.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 font-medium">You are under attack!</p>
          </div>
          <div className="space-y-1 ml-8">
            {activeEffects.map((effect) => (
              <p key={effect.id} className="text-sm text-red-500/80">
                {effect.name} - {effect.duration}s remaining
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Shield Status */}
      <div className="grid grid-cols-2 gap-6">
        {/* Shield Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${isShieldActive
                ? 'bg-blue-500/20 border-blue-500'
                : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                <ShieldIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Shield Protection</h3>
                <p className="text-sm text-gray-400">
                  {isShieldActive ? 'Active' : shieldCooldown > 0 ? 'Cooldown' : 'Ready'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{currentTokens.shield}</p>
              <p className="text-xs text-gray-400">Available</p>
            </div>
          </div>

          {isShieldActive && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-500 text-sm">Active Protection</span>
                <span className="text-blue-500 font-mono font-bold">{formatShieldTime()}</span>
              </div>
              <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: shieldEndTime
                      ? `${((shieldEndTime - Date.now()) / 600000) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          )}

          {shieldCooldown > 0 && !isShieldActive && (
            <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Cooldown</span>
                <span className="text-white font-mono">{formatTime(shieldCooldown)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleActivateShield}
            disabled={currentTokens.shield === 0 || isShieldActive || shieldCooldown > 0}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${currentTokens.shield > 0 && !isShieldActive && shieldCooldown === 0
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
              }`}
          >
            {isShieldActive ? 'Shield Active' : shieldCooldown > 0 ? 'On Cooldown' : 'Activate Shield'}
          </button>
        </div>

        {/* Sabotage Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <Zap className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sabotage Attack</h3>
                <p className="text-sm text-gray-400">
                  {sabotageCooldown > 0 ? 'Cooldown' : 'Ready'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{currentTokens.sabotage}</p>
              <p className="text-xs text-gray-400">Available</p>
            </div>
          </div>

          {sabotageCooldown > 0 && (
            <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Cooldown</span>
                <span className="text-white font-mono">{formatTime(sabotageCooldown)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSabotageModal(true)}
            disabled={currentTokens.sabotage === 0 || sabotageCooldown > 0}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${currentTokens.sabotage > 0 && sabotageCooldown === 0
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
              }`}
          >
            {sabotageCooldown > 0 ? 'On Cooldown' : 'Launch Sabotage'}
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-blue-500" />
              Shield Token
            </h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• Blocks all sabotage attacks</li>
              <li>• Lasts for 10 minutes</li>
              <li>• 3-minute cooldown</li>
              <li>• Visible to other teams</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              Sabotage Token
            </h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• Choose a target team</li>
              <li>• Select sabotage type</li>
              <li>• 5-minute cooldown</li>
              <li>• Blocked by shields</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sabotage Modal */}
      {showSabotageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl">
            <div className="border-b border-zinc-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-white">Launch Sabotage Attack</h3>
              </div>
              <button
                onClick={() => {
                  setShowSabotageModal(false);
                  setSelectedTarget(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Select Target */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Step 1: Select Target Team
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTarget(team)}
                      className={`p-4 rounded-lg border transition-all text-left ${selectedTarget?.id === team.id
                        ? 'bg-red-500/10 border-red-500'
                        : 'bg-black border-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium">{team.name}</p>
                          <p className="text-sm text-gray-400">Rank #{team.rank}</p>
                        </div>
                        {team.hasShield && (
                          <ShieldIcon className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Sabotage Type */}
              {selectedTarget && (
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Step 2: Select Sabotage Type
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {sabotageTypes.map((sabotage) => (
                      <button
                        key={sabotage.type}
                        onClick={() => handleSabotage(sabotage.type)}
                        className="p-4 bg-black border border-zinc-800 rounded-lg hover:border-red-500 transition-all text-left"
                      >
                        <p className="text-white font-medium mb-1">{sabotage.name}</p>
                        <p className="text-sm text-gray-400">{sabotage.duration} seconds</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!selectedTarget && (
                <p className="text-center text-gray-500 text-sm py-8">
                  Select a target team to continue
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
