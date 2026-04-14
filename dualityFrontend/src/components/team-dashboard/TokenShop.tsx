import { useState } from 'react';
import { Zap, Shield as ShieldIcon, Coins, ShoppingCart, Info } from 'lucide-react';

interface TokenShopProps {
  currentPoints: number;
  currentTokens: {
    sabotage: number;
    shield: number;
  };
  onPurchase: (type: string, cost: number) => void;
}

interface ShopItem {
  id: string;
  type: 'sabotage' | 'shield';
  name: string;
  description: string;
  cost: number;
  icon: typeof Zap | typeof ShieldIcon;
  iconColor: string;
  bgColor: string;
  details: string[];
}

export function TokenShop({ currentPoints, currentTokens, onPurchase }: TokenShopProps) {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  const shopItems: ShopItem[] = [
    {
      id: 'sabotage',
      type: 'sabotage',
      name: 'Sabotage Token',
      description: 'Disrupt your opponents with various sabotage tactics',
      cost: 250,
      icon: Zap,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10 border-red-500/30',
      details: [
        'Screen blackout for 30 seconds',
        'Typing delay of 2 seconds',
        'Random code formatting changes',
        'Temporary UI glitches',
        '5 minute cooldown after use',
      ],
    },
    {
      id: 'shield',
      type: 'shield',
      name: 'Shield Token',
      description: 'Protect your team from sabotage attacks',
      cost: 200,
      icon: ShieldIcon,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
      details: [
        'Blocks all sabotage attacks',
        'Active for 10 minutes',
        'Visible shield indicator',
        'Automatic activation on attack',
        '3 minute cooldown after expiry',
      ],
    },
  ];

  const handlePurchase = (item: ShopItem) => {
    if (currentPoints >= item.cost) {
      onPurchase(item.type, item.cost);
      setSelectedItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Token Shop</h2>
        <p className="text-gray-400 mt-1">Purchase tokens to gain tactical advantages</p>
      </div>

      {/* Points Display */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Available Points</p>
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-3xl font-bold text-white">{currentPoints}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Sabotage</p>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-4 py-2">
                <Zap className="w-5 h-5 text-red-500" />
                <span className="text-xl font-bold text-white">{currentTokens.sabotage}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Shield</p>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg px-4 py-2">
                <ShieldIcon className="w-5 h-5 text-blue-500" />
                <span className="text-xl font-bold text-white">{currentTokens.shield}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shopItems.map((item) => {
          const Icon = item.icon;
          const canAfford = currentPoints >= item.cost;

          return (
            <div
              key={item.id}
              className={`bg-zinc-900 border rounded-xl p-6 transition-all ${
                canAfford
                  ? 'border-zinc-800 hover:border-zinc-600 cursor-pointer'
                  : 'border-zinc-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 ${item.bgColor} border rounded-xl`}>
                  <Icon className={`w-8 h-8 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-white">{item.cost}</span>
                <span className="text-gray-400">points</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="flex-1 bg-zinc-800 text-white py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  Details
                </button>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!canAfford}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    canAfford
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Purchase
                </button>
              </div>

              {!canAfford && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Need {item.cost - currentPoints} more points
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* How to Earn Points */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to Earn Points</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-black border border-zinc-800 rounded-lg">
            <p className="text-white font-medium mb-1">Solve Questions</p>
            <p className="text-sm text-gray-400">
              Earn 50-200 points per question based on difficulty
            </p>
          </div>
          <div className="p-4 bg-black border border-zinc-800 rounded-lg">
            <p className="text-white font-medium mb-1">Speed Bonus</p>
            <p className="text-sm text-gray-400">
              Get extra points for solving questions quickly
            </p>
          </div>
          <div className="p-4 bg-black border border-zinc-800 rounded-lg">
            <p className="text-white font-medium mb-1">Accuracy Bonus</p>
            <p className="text-sm text-gray-400">
              First-attempt correct solutions earn bonus points
            </p>
          </div>
          <div className="p-4 bg-black border border-zinc-800 rounded-lg">
            <p className="text-white font-medium mb-1">Round Completion</p>
            <p className="text-sm text-gray-400">
              Complete all questions in a round for extra points
            </p>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
            <div className="border-b border-zinc-800 p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 ${selectedItem.bgColor} border rounded-xl`}>
                  <selectedItem.icon className={`w-8 h-8 ${selectedItem.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{selectedItem.name}</h3>
                  <p className="text-sm text-gray-400">{selectedItem.description}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Price */}
              <div className="flex items-center justify-between p-3 bg-black border border-zinc-800 rounded-lg">
                <span className="text-gray-400">Price</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-xl font-bold text-white">{selectedItem.cost}</span>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-white font-medium mb-3">Features & Effects</h4>
                <div className="space-y-2">
                  {selectedItem.details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-300">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={currentPoints < selectedItem.cost}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    currentPoints >= selectedItem.cost
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Purchase Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Tips */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Strategy Tips</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-white">•</span>
            <p>
              <span className="text-white font-medium">Timing is key:</span> Use sabotage tokens when opponents are close to finishing questions.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-white">•</span>
            <p>
              <span className="text-white font-medium">Shield wisely:</span> Activate shields during critical moments or when you're leading.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-white">•</span>
            <p>
              <span className="text-white font-medium">Save for later:</span> Don't spend all your points early - save tokens for crucial rounds.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-white">•</span>
            <p>
              <span className="text-white font-medium">Cooldown awareness:</span> Remember the cooldown periods when planning your strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
