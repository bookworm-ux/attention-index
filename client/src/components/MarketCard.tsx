/*
 * DESIGN: Neo-Brutalist Terminal
 * Glassmorphic market card with velocity sparkline
 * Shows topic, momentum %, velocity chart, trading volume, and AI vibe analysis
 */

import { TrendingUp, TrendingDown, Clock, Users } from "lucide-react";
import VelocitySparkline from "./VelocitySparkline";
import VibeRadarChart from "./VibeRadarChart";
import { VibeAlertBadge } from "./VibeAlert";

export interface VibeData {
  joy: number;
  anxiety: number;
  anticipation?: number;
  surprise?: number;
  alertType: "volatility_alert" | "momentum_pump" | null;
  alertIntensity: number;
}

export interface MarketData {
  id: string;
  topic: string;
  category: string;
  momentum: number;
  change24h: number;
  volume: string;
  participants: number;
  sparklineData: number[];
  hypeScore: number;
  timeRemaining?: string;
  hypeSummary?: string;
  vibe?: VibeData;
}

interface MarketCardProps {
  market: MarketData;
  index: number;
  onSelect: (market: MarketData) => void;
}

export default function MarketCard({ market, index, onSelect }: MarketCardProps) {
  const isPositive = market.change24h >= 0;
  const trend = market.change24h > 2 ? "up" : market.change24h < -2 ? "down" : "neutral";

  return (
    <div
      onClick={() => onSelect(market)}
      className="glass-card glass-card-hover rounded-xl p-4 cursor-pointer transition-all duration-300 animate-card-enter"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/5 text-white/50">
              {market.category}
            </span>
            {market.timeRemaining && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-white/40">
                <Clock className="w-3 h-3" />
                {market.timeRemaining}
              </span>
            )}
            {/* Vibe Alert Badge */}
            {market.vibe?.alertType && (
              <VibeAlertBadge 
                type={market.vibe.alertType} 
                intensity={market.vibe.alertIntensity} 
              />
            )}
          </div>
          <h3 className="font-display font-bold text-base text-white truncate pr-2">
            {market.topic}
          </h3>
        </div>
        
        {/* Momentum Badge */}
        <div className={`
          flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-semibold
          ${isPositive 
            ? "bg-[#00FFA3]/10 text-[#00FFA3]" 
            : "bg-[#FF007A]/10 text-[#FF007A]"
          }
        `}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}{market.change24h.toFixed(1)}%
        </div>
      </div>

      {/* Main Content: Sparkline + Vibe Radar */}
      <div className="flex gap-3 mb-3">
        {/* Sparkline */}
        <div className="flex-1">
          <VelocitySparkline 
            data={market.sparklineData} 
            trend={trend}
            width={160}
            height={48}
            className="w-full"
          />
        </div>
        
        {/* Vibe Radar Chart */}
        {market.vibe && (
          <div className="flex flex-col items-center">
            <VibeRadarChart
              joy={market.vibe.joy}
              anxiety={market.vibe.anxiety}
              anticipation={market.vibe.anticipation}
              surprise={market.vibe.surprise}
              size={56}
            />
            <div className="flex gap-2 mt-1 text-[8px] font-mono">
              <span className="text-[#00FFA3]">{market.vibe.joy}%</span>
              <span className="text-white/30">/</span>
              <span className="text-[#FF007A]">{market.vibe.anxiety}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-white/40 block">MOMENTUM</span>
            <span className={`font-semibold ${isPositive ? "text-[#00FFA3]" : "text-[#FF007A]"}`}>
              {market.momentum}%
            </span>
          </div>
          <div>
            <span className="text-white/40 block">VOLUME</span>
            <span className="text-white font-semibold">{market.volume}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-white/50">
          <Users className="w-3 h-3" />
          <span>{market.participants.toLocaleString()}</span>
        </div>
      </div>

      {/* Hype Score Bar */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
          <span className="text-white/40">HYPE SCORE</span>
          <span className={`font-semibold ${market.hypeScore >= 70 ? "text-[#00FFA3]" : market.hypeScore >= 40 ? "text-yellow-400" : "text-[#FF007A]"}`}>
            {market.hypeScore}/100
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              market.hypeScore >= 70 
                ? "bg-gradient-to-r from-[#00FFA3]/60 to-[#00FFA3]" 
                : market.hypeScore >= 40 
                  ? "bg-gradient-to-r from-yellow-500/60 to-yellow-400"
                  : "bg-gradient-to-r from-[#FF007A]/60 to-[#FF007A]"
            }`}
            style={{ width: `${market.hypeScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
