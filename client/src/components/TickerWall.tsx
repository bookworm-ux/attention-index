/*
 * DESIGN: Neo-Brutalist Terminal
 * Central feed of Live Momentum Markets
 * Grid of MarketCards with staggered animations
 */

import MarketCard, { MarketData } from "./MarketCard";

interface TickerWallProps {
  markets: MarketData[];
  onSelectMarket: (market: MarketData) => void;
  category: string;
}

export default function TickerWall({ markets, onSelectMarket, category }: TickerWallProps) {
  const filteredMarkets = category === "trending" 
    ? markets 
    : markets.filter(m => m.category.toLowerCase() === category);

  return (
    <div className="flex-1">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-white mb-1">
            LIVE MOMENTUM MARKETS
          </h2>
          <p className="font-mono text-xs text-white/50">
            {filteredMarkets.length} active markets · Updated in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/40">2% VIG</span>
          <div className="w-px h-4 bg-white/20" />
          <span className="font-mono text-xs text-[#00FFA3]">24H VOL: $4.2M</span>
        </div>
      </div>

      {/* Market Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMarkets.map((market, index) => (
          <MarketCard 
            key={market.id} 
            market={market} 
            index={index}
            onSelect={onSelectMarket}
          />
        ))}
      </div>

      {filteredMarkets.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="font-mono text-white/50">No markets in this category</p>
        </div>
      )}
    </div>
  );
}
