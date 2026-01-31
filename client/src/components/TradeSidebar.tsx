/*
 * DESIGN: Neo-Brutalist Terminal
 * Right-hand trade panel with short-window contracts
 * Features: Trade Momentum button, Hype Score meter, contract durations
 * Now with AI Strategist for recommended duration
 */

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Zap, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { MarketData } from "./MarketCard";
import Strategist from "./Strategist";

interface TradeSidebarProps {
  selectedMarket: MarketData | null;
}

const contractDurations = [
  { id: "30m", label: "30M", description: "30 minutes" },
  { id: "1h", label: "1H", description: "1 hour" },
  { id: "3h", label: "3H", description: "3 hours" },
] as const;

type DurationId = typeof contractDurations[number]["id"];

export default function TradeSidebar({ selectedMarket }: TradeSidebarProps) {
  const [selectedDuration, setSelectedDuration] = useState<DurationId>("1h");
  const [tradeDirection, setTradeDirection] = useState<"long" | "short">("long");
  const [amount, setAmount] = useState("100");
  const [isMarketConfirmed, setIsMarketConfirmed] = useState(false);

  // tRPC mutations
  const selectMarketMutation = trpc.trading.selectMarket.useMutation();
  const placeTradeMutation = trpc.trading.placeTrade.useMutation();

  // Reset confirmation when market changes
  useEffect(() => {
    setIsMarketConfirmed(false);
  }, [selectedMarket?.id]);

  // Handle AI strategist recommendation
  const handleStrategyRecommendation = (duration: "30M" | "1H" | "3H") => {
    const durationMap: Record<string, DurationId> = {
      "30M": "30m",
      "1H": "1h",
      "3H": "3h",
    };
    setSelectedDuration(durationMap[duration]);
  };

  // Handle market selection (SELECT A MARKET button)
  const handleSelectMarket = async () => {
    if (!selectedMarket) {
      toast.error("Please click on a market card first");
      return;
    }

    try {
      const result = await selectMarketMutation.mutateAsync({
        marketId: selectedMarket.id,
        topic: selectedMarket.topic,
        category: selectedMarket.category,
        momentum: selectedMarket.momentum,
        change24h: selectedMarket.change24h,
        volume: selectedMarket.volume,
        hypeScore: selectedMarket.hypeScore,
      });

      if (result.success) {
        setIsMarketConfirmed(true);
        toast.success(result.message, {
          icon: <CheckCircle className="w-4 h-4 text-[#00FFA3]" />,
        });
      }
    } catch (error) {
      console.error("Failed to select market:", error);
      toast.error("Failed to select market. Please try again.");
    }
  };

  // Handle trade execution
  const handleTrade = async () => {
    if (!selectedMarket) {
      toast.error("Select a market first");
      return;
    }

    if (!isMarketConfirmed) {
      // First click confirms the market
      await handleSelectMarket();
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const result = await placeTradeMutation.mutateAsync({
        marketId: selectedMarket.id,
        topic: selectedMarket.topic,
        category: selectedMarket.category,
        momentum: selectedMarket.momentum,
        change24h: selectedMarket.change24h,
        volume: selectedMarket.volume,
        hypeScore: selectedMarket.hypeScore,
        direction: tradeDirection,
        duration: selectedDuration,
        amount: amountNum,
      });

      if (result.success) {
        toast.success(
          <div className="space-y-1">
            <p className="font-semibold">{result.message}</p>
            <p className="text-xs opacity-70">
              Trade ID: {result.tradeId}
            </p>
            <p className="text-xs opacity-70">
              Est. Return: ${result.details.estimatedReturn} USDC
            </p>
          </div>,
          { duration: 5000 }
        );
        
        // Reset state after successful trade
        setIsMarketConfirmed(false);
        setAmount("100");
      }
    } catch (error) {
      console.error("Failed to place trade:", error);
      toast.error("Failed to place trade. Please try again.");
    }
  };

  const isLoading = selectMarketMutation.isPending || placeTradeMutation.isPending;

  // Determine button state and text
  const getButtonState = () => {
    if (!selectedMarket) {
      return {
        text: "SELECT A MARKET",
        disabled: true,
        className: "bg-white/10 text-white/30 cursor-not-allowed",
      };
    }
    
    if (isLoading) {
      return {
        text: "PROCESSING...",
        disabled: true,
        className: "bg-white/20 text-white/50 cursor-wait",
      };
    }
    
    if (!isMarketConfirmed) {
      return {
        text: "CONFIRM MARKET",
        disabled: false,
        className: "bg-[#00FFA3]/80 text-[#0B0E11] hover:bg-[#00FFA3] glow-green",
      };
    }
    
    return {
      text: "TRADE MOMENTUM",
      disabled: false,
      className: tradeDirection === "long"
        ? "bg-[#00FFA3] text-[#0B0E11] hover:bg-[#00CC82] glow-green"
        : "bg-[#FF007A] text-white hover:bg-[#CC0062] glow-pink",
    };
  };

  const buttonState = getButtonState();

  return (
    <aside className="w-80 shrink-0 space-y-4">
      {/* AI Strategist - Shows when market is selected */}
      {selectedMarket && (
        <Strategist
          topic={selectedMarket.topic}
          momentum={selectedMarket.momentum}
          vibeData={selectedMarket.vibe ? {
            joy: selectedMarket.vibe.joy,
            anxiety: selectedMarket.vibe.anxiety,
          } : undefined}
          onRecommendation={handleStrategyRecommendation}
        />
      )}

      {/* Trade Panel */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#00FFA3]" />
          <h3 className="font-display font-bold text-sm text-white">SHORT-WINDOW CONTRACTS</h3>
        </div>

        {/* Selected Market */}
        {selectedMarket ? (
          <div className={`rounded-lg p-3 mb-4 transition-all ${
            isMarketConfirmed 
              ? "bg-[#00FFA3]/10 border border-[#00FFA3]/30" 
              : "bg-white/5"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-white/50">
                {isMarketConfirmed ? "CONFIRMED" : "SELECTED"}
              </span>
              <span className={`font-mono text-xs font-semibold ${selectedMarket.change24h >= 0 ? "text-[#00FFA3]" : "text-[#FF007A]"}`}>
                {selectedMarket.change24h >= 0 ? "+" : ""}{selectedMarket.change24h.toFixed(1)}%
              </span>
            </div>
            <p className="font-display font-semibold text-white truncate">{selectedMarket.topic}</p>
            {isMarketConfirmed && (
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle className="w-3 h-3 text-[#00FFA3]" />
                <span className="font-mono text-[10px] text-[#00FFA3]">Ready to trade</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-3 mb-4 border border-dashed border-white/10">
            <p className="font-mono text-xs text-white/40 text-center">Select a market to trade</p>
          </div>
        )}

        {/* Contract Duration */}
        <div className="mb-4">
          <label className="font-mono text-xs text-white/50 block mb-2">CONTRACT DURATION</label>
          <div className="grid grid-cols-3 gap-2">
            {contractDurations.map((duration) => (
              <button
                key={duration.id}
                onClick={() => setSelectedDuration(duration.id)}
                className={`
                  py-2 rounded-lg font-mono text-sm font-semibold transition-all
                  ${selectedDuration === duration.id
                    ? "bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/30"
                    : "bg-white/5 text-white/60 hover:bg-white/10 border border-transparent"
                  }
                `}
              >
                {duration.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Direction */}
        <div className="mb-4">
          <label className="font-mono text-xs text-white/50 block mb-2">DIRECTION</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTradeDirection("long")}
              className={`
                flex items-center justify-center gap-2 py-3 rounded-lg font-display font-semibold text-sm transition-all
                ${tradeDirection === "long"
                  ? "bg-[#00FFA3] text-[#0B0E11]"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
                }
              `}
            >
              <TrendingUp className="w-4 h-4" />
              LONG
            </button>
            <button
              onClick={() => setTradeDirection("short")}
              className={`
                flex items-center justify-center gap-2 py-3 rounded-lg font-display font-semibold text-sm transition-all
                ${tradeDirection === "short"
                  ? "bg-[#FF007A] text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
                }
              `}
            >
              <TrendingDown className="w-4 h-4" />
              SHORT
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="font-mono text-xs text-white/50 block mb-2">AMOUNT (USDC)</label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-white text-right pr-16 focus:outline-none focus:border-[#00FFA3]/50"
              placeholder="0.00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-white/40">USDC</span>
          </div>
          <div className="flex gap-2 mt-2">
            {["25", "50", "100", "MAX"].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset === "MAX" ? "1000" : preset)}
                className="flex-1 py-1 rounded bg-white/5 font-mono text-xs text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Button */}
        <button
          onClick={handleTrade}
          disabled={buttonState.disabled}
          className={`
            w-full py-4 rounded-xl font-display font-bold text-base transition-all flex items-center justify-center gap-2
            ${buttonState.className}
          `}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {buttonState.text}
        </button>

        {/* Fee Notice */}
        <p className="font-mono text-[10px] text-white/30 text-center mt-3">
          2% VIG · Settlement in USDC
        </p>
      </div>

      {/* Hype Score Meter */}
      {selectedMarket && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="font-display font-bold text-sm text-white">HYPE SCORE METER</h3>
          </div>

          {/* Circular Gauge */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={selectedMarket.hypeScore >= 70 ? "#00FFA3" : selectedMarket.hypeScore >= 40 ? "#FBBF24" : "#FF007A"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${selectedMarket.hypeScore * 2.51} 251`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-display font-bold text-3xl ${
                selectedMarket.hypeScore >= 70 ? "text-[#00FFA3]" : selectedMarket.hypeScore >= 40 ? "text-yellow-400" : "text-[#FF007A]"
              }`}>
                {selectedMarket.hypeScore}
              </span>
              <span className="font-mono text-xs text-white/40">/ 100</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-white/50">Social Velocity</span>
              <span className="font-mono text-xs text-[#00FFA3]">+{Math.floor(selectedMarket.hypeScore * 0.4)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-white/50">Search Volume</span>
              <span className="font-mono text-xs text-[#00FFA3]">+{Math.floor(selectedMarket.hypeScore * 0.35)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-white/50">News Coverage</span>
              <span className="font-mono text-xs text-yellow-400">+{Math.floor(selectedMarket.hypeScore * 0.25)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Warning */}
      <div className="glass-card rounded-xl p-3 border border-[#FF007A]/20">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-[#FF007A] shrink-0 mt-0.5" />
          <p className="font-mono text-[10px] text-white/50 leading-relaxed">
            Trading attention markets involves significant risk. Past momentum does not guarantee future performance. Trade responsibly.
          </p>
        </div>
      </div>
    </aside>
  );
}
