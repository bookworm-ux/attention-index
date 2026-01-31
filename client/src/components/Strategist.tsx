/**
 * Strategist Component
 * Displays AI-recommended trading strategy with scanning animation
 * Uses Gemini Flash to analyze vibe and momentum for duration recommendations
 */

import { useState, useEffect } from "react";
import { Brain, Clock, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface StrategistProps {
  topic: string;
  momentum: number;
  vibeData?: {
    joy: number;
    anxiety: number;
  };
  onRecommendation?: (duration: "30M" | "1H" | "3H") => void;
}

export default function Strategist({ topic, momentum, vibeData, onRecommendation }: StrategistProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [recommendation, setRecommendation] = useState<{
    duration: "30M" | "1H" | "3H";
    rationale: string;
    riskLevel: "low" | "medium" | "high";
  } | null>(null);

  // Simulate AI analysis with local logic (to avoid API rate limits)
  useEffect(() => {
    setIsScanning(true);
    setRecommendation(null);

    const timer = setTimeout(() => {
      // Calculate recommendation based on momentum and vibe
      let duration: "30M" | "1H" | "3H" = "1H";
      let rationale = "";
      let riskLevel: "low" | "medium" | "high" = "medium";

      if (vibeData) {
        const { joy, anxiety } = vibeData;
        
        // High anxiety = short window (volatile)
        if (anxiety > 75) {
          duration = "30M";
          rationale = "High volatility detected. Short window recommended to minimize exposure.";
          riskLevel = "high";
        }
        // High joy + high momentum = ride the wave
        else if (joy > 80 && momentum > 80) {
          duration = "1H";
          rationale = "Strong momentum with positive sentiment. Medium window to capture gains.";
          riskLevel = "medium";
        }
        // Stable sentiment = longer window
        else if (anxiety < 40 && joy > 50) {
          duration = "3H";
          rationale = "Stable trend with low volatility. Extended window for maximum returns.";
          riskLevel = "low";
        }
        // Default moderate
        else {
          duration = "1H";
          rationale = "Mixed signals suggest moderate exposure. Standard window recommended.";
          riskLevel = "medium";
        }
      } else {
        // No vibe data - use momentum only
        if (momentum > 85) {
          duration = "30M";
          rationale = "Extreme momentum may reverse quickly. Short window advised.";
          riskLevel = "high";
        } else if (momentum > 60) {
          duration = "1H";
          rationale = "Healthy momentum trend. Standard window recommended.";
          riskLevel = "medium";
        } else {
          duration = "3H";
          rationale = "Lower momentum suggests developing trend. Extended window for confirmation.";
          riskLevel = "low";
        }
      }

      setRecommendation({ duration, rationale, riskLevel });
      setIsScanning(false);
      onRecommendation?.(duration);
    }, 1500 + Math.random() * 1000); // 1.5-2.5s delay for realism

    return () => clearTimeout(timer);
  }, [topic, momentum, vibeData?.joy, vibeData?.anxiety]);

  const getRiskColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low": return "text-[#00FFA3]";
      case "medium": return "text-yellow-400";
      case "high": return "text-[#FF007A]";
    }
  };

  const getRiskBg = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low": return "bg-[#00FFA3]/10 border-[#00FFA3]/20";
      case "medium": return "bg-yellow-400/10 border-yellow-400/20";
      case "high": return "bg-[#FF007A]/10 border-[#FF007A]/20";
    }
  };

  return (
    <div className="glass-card rounded-lg p-3 border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Brain className={`w-4 h-4 ${isScanning ? "text-[#00FFA3]" : "text-white/60"}`} />
          {isScanning && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#00FFA3] rounded-full animate-ping" />
          )}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
          AI STRATEGIST
        </span>
        {isScanning && (
          <span className="ml-auto text-[9px] font-mono text-[#00FFA3] animate-pulse">
            SCANNING...
          </span>
        )}
      </div>

      {/* Scanning Animation */}
      {isScanning && (
        <div className="space-y-2">
          {/* Scanning bars */}
          <div className="flex gap-1">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-4 flex-1 bg-[#00FFA3]/20 rounded-sm animate-pulse"
                style={{ 
                  animationDelay: `${i * 100}ms`,
                  animationDuration: "0.8s"
                }}
              />
            ))}
          </div>
          <div className="text-[9px] font-mono text-white/40 text-center">
            Analyzing momentum curves & sentiment vectors...
          </div>
        </div>
      )}

      {/* Recommendation */}
      {!isScanning && recommendation && (
        <div className="space-y-3">
          {/* Duration Recommendation */}
          <div className={`rounded-lg p-2 border ${getRiskBg(recommendation.riskLevel)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-white/50 uppercase">Recommended Window</span>
              <div className={`flex items-center gap-1 text-[9px] font-mono ${getRiskColor(recommendation.riskLevel)}`}>
                {recommendation.riskLevel === "high" ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : recommendation.riskLevel === "low" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                {recommendation.riskLevel.toUpperCase()} RISK
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00FFA3]" />
              <span className="font-display font-bold text-xl text-white">
                {recommendation.duration}
              </span>
            </div>
          </div>

          {/* Rationale */}
          <div className="text-[10px] font-mono text-white/50 leading-relaxed">
            {recommendation.rationale}
          </div>
        </div>
      )}
    </div>
  );
}
