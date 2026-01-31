/*
 * DESIGN: Neo-Brutalist Terminal
 * Navigation bar with brutalist typography and glassmorphic background
 * Categories: Trending, Alpha, Crypto, Tech, Culture
 */

import { useState } from "react";
import { Activity, Flame, Zap, Code, Sparkles } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { id: "trending", label: "TRENDING", icon: Flame },
  { id: "alpha", label: "ALPHA", icon: Zap },
  { id: "crypto", label: "CRYPTO", icon: Activity },
  { id: "tech", label: "TECH", icon: Code },
  { id: "culture", label: "CULTURE", icon: Sparkles },
];

interface NavigationProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function Navigation({ activeCategory, onCategoryChange }: NavigationProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card border-b border-white/5">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFA3] to-[#00CC82] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#0B0E11]" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg tracking-tight text-white">
                  ATTENTION INDEX
                </h1>
              </div>
            </div>

            {/* Category Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-medium
                      transition-all duration-200
                      ${isActive 
                        ? "bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/30" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/20">
                <span className="w-2 h-2 rounded-full bg-[#00FFA3] pulse-indicator" />
                <span className="font-mono text-xs text-[#00FFA3]">LIVE</span>
              </div>
              <button 
                onClick={() => toast("Connect wallet feature coming soon")}
                className="px-4 py-2 rounded-lg bg-[#00FFA3] text-[#0B0E11] font-display font-semibold text-sm hover:bg-[#00CC82] transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile category bar */}
      <div className="md:hidden glass-card border-b border-white/5 overflow-x-auto">
        <div className="flex items-center gap-1 px-4 py-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isActive 
                    ? "bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/30" 
                    : "text-white/60"
                  }
                `}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
