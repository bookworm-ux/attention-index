/*
 * DESIGN: Neo-Brutalist Terminal
 * Oracle Feed sidebar showing live aggregate of X, Reddit, and HN
 * Pulsing signal icons indicating data freshness
 */

import { useState, useEffect } from "react";
import { Radio, MessageCircle, Newspaper, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

interface SignalSource {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "live" | "delayed" | "offline";
  lastUpdate: string;
  signalStrength: number;
}

interface TrendingSignal {
  id: string;
  source: string;
  topic: string;
  sentiment: "bullish" | "bearish" | "neutral";
  velocity: number;
  timestamp: string;
}

const sources: SignalSource[] = [
  { 
    id: "x", 
    name: "X / Twitter", 
    icon: <span className="font-bold text-sm">𝕏</span>,
    status: "live",
    lastUpdate: "2s ago",
    signalStrength: 94
  },
  { 
    id: "reddit", 
    name: "Reddit", 
    icon: <MessageCircle className="w-4 h-4" />,
    status: "live",
    lastUpdate: "5s ago",
    signalStrength: 87
  },
  { 
    id: "hn", 
    name: "Hacker News", 
    icon: <span className="font-bold text-sm">Y</span>,
    status: "live",
    lastUpdate: "12s ago",
    signalStrength: 72
  },
  { 
    id: "news", 
    name: "News Feeds", 
    icon: <Newspaper className="w-4 h-4" />,
    status: "delayed",
    lastUpdate: "1m ago",
    signalStrength: 65
  },
];

const trendingSignals: TrendingSignal[] = [
  { id: "1", source: "x", topic: "OpenAI announces GPT-5", sentiment: "bullish", velocity: 847, timestamp: "12s" },
  { id: "2", source: "reddit", topic: "r/wallstreetbets on NVDA", sentiment: "bullish", velocity: 523, timestamp: "34s" },
  { id: "3", source: "hn", topic: "New Rust framework trending", sentiment: "neutral", velocity: 312, timestamp: "1m" },
  { id: "4", source: "x", topic: "Crypto market dip reactions", sentiment: "bearish", velocity: 678, timestamp: "2m" },
  { id: "5", source: "news", topic: "Fed rate decision coverage", sentiment: "neutral", velocity: 445, timestamp: "3m" },
];

export default function OracleFeed() {
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 shrink-0 space-y-4">
      {/* Oracle Header */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-[#00FFA3]" />
          <h3 className="font-display font-bold text-sm text-white">THE ORACLE FEED</h3>
        </div>

        {/* Signal Sources */}
        <div className="space-y-3">
          {sources.map((source, index) => (
            <div key={source.id} className="flex items-center gap-3">
              {/* Icon with pulse */}
              <div className={`
                relative w-8 h-8 rounded-lg flex items-center justify-center
                ${source.status === "live" ? "bg-[#00FFA3]/10" : "bg-white/5"}
              `}>
                <span className={source.status === "live" ? "text-[#00FFA3]" : "text-white/40"}>
                  {source.icon}
                </span>
                {source.status === "live" && (
                  <span 
                    className={`
                      absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00FFA3]
                      ${pulsePhase === index % 4 ? "animate-ping" : ""}
                    `}
                  />
                )}
              </div>

              {/* Source Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-white truncate">{source.name}</span>
                  <span className={`
                    font-mono text-[10px]
                    ${source.status === "live" ? "text-[#00FFA3]" : "text-yellow-400"}
                  `}>
                    {source.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        source.signalStrength >= 80 ? "bg-[#00FFA3]" : 
                        source.signalStrength >= 60 ? "bg-yellow-400" : "bg-[#FF007A]"
                      }`}
                      style={{ width: `${source.signalStrength}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-white/40">{source.lastUpdate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Aggregate Signal */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-white/50">AGGREGATE SIGNAL</span>
            <span className="font-mono text-xs text-[#00FFA3] font-semibold">STRONG</span>
          </div>
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className={`
                  flex-1 h-3 rounded-sm transition-all duration-300
                  ${i < 8 ? "bg-[#00FFA3]" : "bg-white/10"}
                  ${i < 8 && pulsePhase === i % 4 ? "opacity-60" : "opacity-100"}
                `}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trending Signals */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm text-white">LIVE SIGNALS</h3>
          <span className="font-mono text-[10px] text-white/40">LAST 5M</span>
        </div>

        <div className="space-y-3">
          {trendingSignals.map((signal) => (
            <div key={signal.id} className="group">
              <div className="flex items-start gap-2">
                {/* Sentiment indicator */}
                <div className={`
                  mt-1 w-1.5 h-1.5 rounded-full shrink-0
                  ${signal.sentiment === "bullish" ? "bg-[#00FFA3]" : 
                    signal.sentiment === "bearish" ? "bg-[#FF007A]" : "bg-white/40"}
                `} />
                
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-white/80 leading-tight truncate group-hover:text-white transition-colors">
                    {signal.topic}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-white/30 uppercase">{signal.source}</span>
                    <span className="text-white/20">·</span>
                    <span className={`
                      flex items-center gap-0.5 font-mono text-[10px]
                      ${signal.sentiment === "bullish" ? "text-[#00FFA3]" : 
                        signal.sentiment === "bearish" ? "text-[#FF007A]" : "text-white/40"}
                    `}>
                      {signal.sentiment === "bullish" ? <TrendingUp className="w-2.5 h-2.5" /> : 
                       signal.sentiment === "bearish" ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                      {signal.velocity}/min
                    </span>
                    <span className="text-white/20">·</span>
                    <span className="font-mono text-[10px] text-white/30">{signal.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Attribution */}
      <div className="px-2">
        <p className="font-mono text-[10px] text-white/30 text-center leading-relaxed">
          Data aggregated from public APIs. <br />
          Not financial advice.
        </p>
      </div>
    </aside>
  );
}
