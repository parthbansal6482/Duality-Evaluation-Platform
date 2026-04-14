import { useState, useEffect } from 'react';
import { X, Zap, Shield as ShieldIcon, Target, AlertTriangle, Coins, ShoppingCart } from 'lucide-react';

interface TacticalPanelProps {
  sabotageTokens: number;
  shieldTokens: number;
  currentPoints: number;
  isShieldActive: boolean;
  onUseSabotage: (targetTeam: string, sabotageType: string) => void;
  onActivateShield: () => void;
  onPurchaseToken: (type: 'sabotage' | 'shield', cost: number) => void;
  targets: TeamTarget[];
  sabotageCooldown: number | null;
  shieldCooldown: number | null;
  message: { text: string; type: 'success' | 'error' } | null;
}

interface TeamTarget {
  id: string;
  name: string;
  rank: number;
  hasShield: boolean;
}

export function TacticalPanel({
  sabotageTokens,
  shieldTokens,
  currentPoints,
  isShieldActive,
  onUseSabotage,
  onActivateShield,
  onPurchaseToken,
  targets,
  sabotageCooldown,
  shieldCooldown,
  message,
}: TacticalPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sabotage' | 'shield' | 'store'>('sabotage');
  const [selectedTarget, setSelectedTarget] = useState<TeamTarget | null>(null);
  const [selectedSabotage, setSelectedSabotage] = useState<string | null>(null);
  const [sabotageTimer, setSabotageTimer] = useState<number>(0);
  const [shieldTimer, setShieldTimer] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (sabotageCooldown) {
        const remaining = Math.max(0, Math.ceil((sabotageCooldown - Date.now()) / 1000));
        setSabotageTimer(remaining);
      } else {
        setSabotageTimer(0);
      }
      if (shieldCooldown) {
        const remaining = Math.max(0, Math.ceil((shieldCooldown - Date.now()) / 1000));
        setShieldTimer(remaining);
      } else {
        setShieldTimer(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sabotageCooldown, shieldCooldown]);

  const sabotageTypes = [
    { id: 'blackout', name: 'Screen Blackout', duration: '60s' },
    { id: 'typing-delay', name: 'Typing Delay', duration: '60s' },
    { id: 'format-chaos', name: 'Format Chaos', duration: '60s' },
    { id: 'ui-glitch', name: 'UI Glitch', duration: '60s' },
  ];


  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2 rounded-lg font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Tactical Menu
      </button>

      {/* Tactical Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b border-zinc-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <Zap className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tactical Operations</h3>
                  <p className="text-sm text-gray-400">Use your tokens strategically</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedTarget(null);
                  setSelectedSabotage(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Token Shop Section */}
              <div className="bg-black border border-zinc-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <ShoppingCart className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Token Shop</h4>
                      <p className="text-sm text-gray-400">Purchase tactical tokens</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
                      <Coins className="w-5 h-5" />
                      {currentPoints}
                    </p>
                    <p className="text-xs text-gray-400">Points</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Sabotage Token */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-white">Sabotage Token</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">Disrupt opponent teams</p>
                    <button
                      onClick={() => onPurchaseToken('sabotage', 250)}
                      disabled={currentPoints < 250}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${currentPoints >= 250
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                        }`}
                    >
                      Buy for 250 pts
                    </button>
                  </div>
                  {/* Shield Token */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldIcon className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-white">Shield Token</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">Block incoming attacks</p>
                    <button
                      onClick={() => onPurchaseToken('shield', 200)}
                      disabled={currentPoints < 200}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${currentPoints >= 200
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                        }`}
                    >
                      Buy for 200 pts
                    </button>
                  </div>
                </div>
              </div>

              {/* Shield Section */}
              <div className="bg-black border border-zinc-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl border ${isShieldActive
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-blue-500/10 border-blue-500/30'
                        }`}
                    >
                      <ShieldIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Shield Protection</h4>
                      <p className="text-sm text-gray-400">
                        {isShieldActive ? 'Currently Active' : 'Available'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{shieldTokens}</p>
                    <p className="text-xs text-gray-400">Tokens</p>
                  </div>
                </div>
                <button
                  onClick={onActivateShield}
                  disabled={shieldTokens === 0 || isShieldActive || shieldTimer > 0}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${shieldTokens > 0 && !isShieldActive && shieldTimer === 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                    }`}
                >
                  {isShieldActive ? 'Shield Active' : shieldTimer > 0 ? `On Cooldown (${shieldTimer}s)` : 'Activate Shield (10 min)'}
                </button>
              </div>

              {/* Sabotage Section */}
              <div className="bg-black border border-zinc-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <Zap className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Launch Sabotage</h4>
                      <p className="text-sm text-gray-400">Disrupt your opponents</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{sabotageTokens}</p>
                    <p className="text-xs text-gray-400">Tokens</p>
                  </div>
                </div>

                {sabotageTokens > 0 ? (
                  <>
                    {/* Step 1: Select Target */}
                    <div className="mb-4">
                      <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Select Target Team
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        {targets.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => setSelectedTarget(team)}
                            className={`p-3 rounded-lg border transition-all text-left ${selectedTarget?.id === team.id
                              ? 'bg-red-500/10 border-red-500'
                              : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-medium text-sm">{team.name}</p>
                                <p className="text-xs text-gray-400">Rank #{team.rank}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Select Sabotage Type */}
                    {selectedTarget && (
                      <div>
                        <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Choose Attack Type
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          {sabotageTypes.map((sabotage) => (
                            <button
                              key={sabotage.id}
                              onClick={() => setSelectedSabotage(sabotage.id)}
                              className={`p-3 border rounded-lg transition-all text-left ${selectedSabotage === sabotage.id
                                ? 'bg-red-500/10 border-red-500'
                                : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
                                }`}
                            >
                              <p className="text-white font-medium text-sm">{sabotage.name}</p>
                              <p className="text-xs text-gray-400">{sabotage.duration}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Global Launch Button */}
                    <div className="mt-6 border-t border-zinc-800 pt-6">
                      <button
                        onClick={() => {
                          if (selectedTarget && selectedSabotage) {
                            onUseSabotage(selectedTarget.id, selectedSabotage);
                            setIsOpen(false);
                            setSelectedTarget(null);
                            setSelectedSabotage(null);
                          }
                        }}
                        disabled={!selectedTarget || !selectedSabotage || sabotageTokens === 0 || sabotageTimer > 0}
                        className={`w-full py-4 rounded-xl font-bold transition-all ${selectedTarget && selectedSabotage && sabotageTokens > 0 && sabotageTimer === 0
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                          : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                          }`}
                      >
                        {sabotageTimer > 0
                          ? `On Cooldown (${sabotageTimer}s)`
                          : !selectedTarget
                            ? 'Select Target Team'
                            : !selectedSabotage
                              ? 'Select Attack Type'
                              : 'Launch Sabotage'
                        }
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No sabotage tokens available</p>
                    <p className="text-sm text-gray-600">
                      Purchase more from the Token Shop
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
