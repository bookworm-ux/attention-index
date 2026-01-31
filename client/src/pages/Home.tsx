/*
 * DESIGN: Neo-Brutalist Terminal
 * Main dashboard page for Attention Index
 * Layout: Oracle Feed (left) | Ticker Wall (center) | Trade Sidebar (right)
 */

import { useState } from "react";
import Navigation from "@/components/Navigation";
import OracleFeed from "@/components/OracleFeed";
import TickerWall from "@/components/TickerWall";
import TradeSidebar from "@/components/TradeSidebar";
import { MarketData } from "@/components/MarketCard";

// Generate realistic sparkline data
const generateSparkline = (trend: "up" | "down" | "volatile"): number[] => {
  const base = 50;
  const points: number[] = [];
  let current = base;
  
  for (let i = 0; i < 20; i++) {
    const noise = (Math.random() - 0.5) * 15;
    const trendBias = trend === "up" ? 1.5 : trend === "down" ? -1.5 : 0;
    current = Math.max(10, Math.min(90, current + noise + trendBias));
    points.push(current);
  }
  
  return points;
};

// Mock market data
const mockMarkets: MarketData[] = [
  {
    id: "1",
    topic: "Marty Supreme",
    category: "Culture",
    momentum: 87,
    change24h: 23.4,
    volume: "$847K",
    participants: 12453,
    sparklineData: generateSparkline("up"),
    hypeScore: 92,
    timeRemaining: "2h 34m",
  },
  {
    id: "2",
    topic: "OpenAI IPO Hype",
    category: "Tech",
    momentum: 94,
    change24h: 45.2,
    volume: "$1.2M",
    participants: 34521,
    sparklineData: generateSparkline("up"),
    hypeScore: 98,
    timeRemaining: "1h 12m",
  },
  {
    id: "3",
    topic: "GitHub Repo: shadcn/ui",
    category: "Tech",
    momentum: 71,
    change24h: 12.8,
    volume: "$234K",
    participants: 8934,
    sparklineData: generateSparkline("up"),
    hypeScore: 76,
    timeRemaining: "45m",
  },
  {
    id: "4",
    topic: "Bitcoin ETF Flows",
    category: "Crypto",
    momentum: 65,
    change24h: -8.3,
    volume: "$2.1M",
    participants: 45678,
    sparklineData: generateSparkline("down"),
    hypeScore: 58,
    timeRemaining: "3h 00m",
  },
  {
    id: "5",
    topic: "Solana Memecoin Season",
    category: "Crypto",
    momentum: 82,
    change24h: 34.7,
    volume: "$567K",
    participants: 23456,
    sparklineData: generateSparkline("up"),
    hypeScore: 85,
    timeRemaining: "1h 45m",
  },
  {
    id: "6",
    topic: "Apple Vision Pro Reviews",
    category: "Tech",
    momentum: 43,
    change24h: -15.2,
    volume: "$189K",
    participants: 7823,
    sparklineData: generateSparkline("down"),
    hypeScore: 38,
    timeRemaining: "2h 15m",
  },
  {
    id: "7",
    topic: "Taylor Swift Tour Impact",
    category: "Culture",
    momentum: 78,
    change24h: 8.9,
    volume: "$445K",
    participants: 19234,
    sparklineData: generateSparkline("volatile"),
    hypeScore: 81,
    timeRemaining: "30m",
  },
  {
    id: "8",
    topic: "AI Regulation EU Vote",
    category: "Alpha",
    momentum: 56,
    change24h: 5.4,
    volume: "$312K",
    participants: 11234,
    sparklineData: generateSparkline("volatile"),
    hypeScore: 62,
    timeRemaining: "4h 30m",
  },
  {
    id: "9",
    topic: "NVIDIA Earnings Leak",
    category: "Alpha",
    momentum: 91,
    change24h: 67.3,
    volume: "$1.8M",
    participants: 28934,
    sparklineData: generateSparkline("up"),
    hypeScore: 95,
    timeRemaining: "15m",
  },
  {
    id: "10",
    topic: "Elon Musk Tweet Storm",
    category: "Culture",
    momentum: 88,
    change24h: 41.2,
    volume: "$723K",
    participants: 56789,
    sparklineData: generateSparkline("up"),
    hypeScore: 89,
    timeRemaining: "1h 00m",
  },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("trending");
  const [selectedMarket, setSelectedMarket] = useState<MarketData | null>(null);

  return (
    <div className="min-h-screen bg-[#0B0E11] relative">
      {/* Background Pattern */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url('/images/hero-abstract.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(100px)',
        }}
      />
      
      {/* Grid overlay */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Navigation */}
      <Navigation 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />

      {/* Main Content */}
      <main className="relative pt-20 md:pt-16 pb-8">
        <div className="container">
          {/* Hero Section */}
          <div className="mb-8 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-white mb-2">
                  THE ATTENTION MARKET
                </h1>
                <p className="font-mono text-sm text-white/50 max-w-xl">
                  Trade momentum on viral topics, trending repos, and cultural moments. 
                  Short-window contracts powered by real-time social signals.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-6 font-mono text-xs">
                  <div className="text-right">
                    <span className="text-white/40 block">24H VOLUME</span>
                    <span className="text-[#00FFA3] font-semibold text-lg">$4,234,567</span>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-right">
                    <span className="text-white/40 block">ACTIVE MARKETS</span>
                    <span className="text-white font-semibold text-lg">{mockMarkets.length}</span>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-right">
                    <span className="text-white/40 block">TRADERS</span>
                    <span className="text-white font-semibold text-lg">12,847</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Layout */}
          <div className="flex gap-6">
            {/* Oracle Feed - Left */}
            <div className="hidden xl:block">
              <OracleFeed />
            </div>

            {/* Ticker Wall - Center */}
            <TickerWall 
              markets={mockMarkets}
              onSelectMarket={setSelectedMarket}
              category={activeCategory}
            />

            {/* Trade Sidebar - Right */}
            <div className="hidden lg:block">
              <TradeSidebar selectedMarket={selectedMarket} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Trade Button */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <button 
          className="w-full py-4 rounded-xl bg-[#00FFA3] text-[#0B0E11] font-display font-bold text-base glow-green"
          onClick={() => {
            if (selectedMarket) {
              // Could open a modal here
            }
          }}
        >
          {selectedMarket ? `TRADE ${selectedMarket.topic}` : "SELECT A MARKET"}
        </button>
      </div>
    </div>
  );
}
