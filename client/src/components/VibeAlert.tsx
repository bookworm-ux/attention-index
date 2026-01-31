/**
 * VibeAlert Component
 * Displays pulsing alerts based on Hume AI vibe analysis:
 * - Volatility Trap (red pulse) when Anxiety > 75%
 * - Hype Train (green glow) when Joy > 80%
 * 
 * Updated thresholds for more accurate signal detection
 */

import { AlertTriangle, Zap } from "lucide-react";

// Alert threshold constants
export const VOLATILITY_TRAP_THRESHOLD = 75; // ANX > 75%
export const HYPE_TRAIN_THRESHOLD = 80; // JOY > 80%

interface VibeAlertProps {
  type: "volatility_trap" | "hype_train" | null;
  intensity: number;
  className?: string;
}

export default function VibeAlert({ type, intensity, className = "" }: VibeAlertProps) {
  if (!type) return null;

  const isVolatility = type === "volatility_trap";

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-semibold
        ${isVolatility 
          ? "bg-[#FF007A]/20 text-[#FF007A] border border-[#FF007A]/30" 
          : "bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/30"
        }
        ${className}
      `}
      style={{
        boxShadow: isVolatility 
          ? "0 0 10px rgba(255, 0, 122, 0.3)" 
          : "0 0 15px rgba(0, 255, 163, 0.4)",
      }}
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
          style={{ animationDuration: isVolatility ? "1s" : "1.5s" }}
        />
      </div>

      {/* Icon */}
      {isVolatility ? (
        <AlertTriangle className="w-3 h-3" />
      ) : (
        <Zap className="w-3 h-3" />
      )}

      {/* Label */}
      <span className="uppercase tracking-wider">
        {isVolatility ? "VOLATILITY TRAP" : "HYPE TRAIN"}
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
  type: "volatility_trap" | "hype_train" | null;
  intensity: number;
}) {
  if (!type) return null;

  const isVolatility = type === "volatility_trap";

  return (
    <div
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold
        ${isVolatility 
          ? "bg-[#FF007A]/30 text-[#FF007A]" 
          : "bg-[#00FFA3]/30 text-[#00FFA3]"
        }
      `}
      style={{
        boxShadow: isVolatility 
          ? "0 0 6px rgba(255, 0, 122, 0.4)" 
          : "0 0 8px rgba(0, 255, 163, 0.5)",
      }}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={`
            animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
            ${isVolatility ? "bg-[#FF007A]" : "bg-[#00FFA3]"}
          `}
          style={{ animationDuration: isVolatility ? "0.8s" : "1.2s" }}
        />
        <span
          className={`
            relative inline-flex rounded-full h-1.5 w-1.5
            ${isVolatility ? "bg-[#FF007A]" : "bg-[#00FFA3]"}
          `}
        />
      </span>
      {isVolatility ? "TRAP" : "HYPE"}
    </div>
  );
}

/**
 * Determine alert type based on vibe scores
 * Uses updated thresholds: ANX > 75% = Volatility Trap, JOY > 80% = Hype Train
 */
export function getVibeAlertType(
  joy: number,
  anxiety: number
): { type: "volatility_trap" | "hype_train" | null; intensity: number } {
  // Volatility Trap takes priority (risk warning)
  if (anxiety > VOLATILITY_TRAP_THRESHOLD) {
    return { type: "volatility_trap", intensity: Math.round(anxiety) };
  }
  // Hype Train for high joy
  if (joy > HYPE_TRAIN_THRESHOLD) {
    return { type: "hype_train", intensity: Math.round(joy) };
  }
  return { type: null, intensity: 0 };
}
