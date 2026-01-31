/**
 * VibeAlert Component
 * Displays pulsing alerts based on Hume AI vibe analysis:
 * - Volatility Alert (red pulse) when Anxiety > 70%
 * - Momentum Pump (green pulse) when Joy > 70%
 */

import { AlertTriangle, TrendingUp } from "lucide-react";

interface VibeAlertProps {
  type: "volatility_alert" | "momentum_pump" | null;
  intensity: number;
  className?: string;
}

export default function VibeAlert({ type, intensity, className = "" }: VibeAlertProps) {
  if (!type) return null;

  const isVolatility = type === "volatility_alert";

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-semibold
        ${isVolatility ? "bg-[#FF007A]/20 text-[#FF007A]" : "bg-[#00FFA3]/20 text-[#00FFA3]"}
        ${className}
      `}
    >
      {/* Pulsing indicator */}
      <div className="relative">
        <div
          className={`
            w-2 h-2 rounded-full
            ${isVolatility ? "bg-[#FF007A]" : "bg-[#00FFA3]"}
          `}
        />
        <div
          className={`
            absolute inset-0 w-2 h-2 rounded-full animate-ping
            ${isVolatility ? "bg-[#FF007A]" : "bg-[#00FFA3]"}
          `}
          style={{ animationDuration: "1.5s" }}
        />
      </div>

      {/* Icon */}
      {isVolatility ? (
        <AlertTriangle className="w-3 h-3" />
      ) : (
        <TrendingUp className="w-3 h-3" />
      )}

      {/* Label */}
      <span className="uppercase tracking-wider">
        {isVolatility ? "VOLATILITY" : "PUMP"}
      </span>

      {/* Intensity */}
      <span className="opacity-70">{intensity}%</span>
    </div>
  );
}

/**
 * Compact version for use inside market cards
 */
export function VibeAlertBadge({
  type,
  intensity,
}: {
  type: "volatility_alert" | "momentum_pump" | null;
  intensity: number;
}) {
  if (!type) return null;

  const isVolatility = type === "volatility_alert";

  return (
    <div
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold
        ${isVolatility ? "bg-[#FF007A]/30 text-[#FF007A]" : "bg-[#00FFA3]/30 text-[#00FFA3]"}
      `}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={`
            animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
            ${isVolatility ? "bg-[#FF007A]" : "bg-[#00FFA3]"}
          `}
        />
        <span
          className={`
            relative inline-flex rounded-full h-1.5 w-1.5
            ${isVolatility ? "bg-[#FF007A]" : "bg-[#00FFA3]"}
          `}
        />
      </span>
      {isVolatility ? "VOL" : "PUMP"}
    </div>
  );
}
