/**
 * VibeRadarChart Component
 * Displays Joy (Excitement) and Anxiety (Risk) scores from Hume AI analysis
 * as a compact radar chart visualization
 * 
 * Values are clamped to 0-100% range to ensure professional display
 */

import { useMemo } from "react";

interface VibeRadarChartProps {
  joy: number; // 0-100 (will be clamped)
  anxiety: number; // 0-100 (will be clamped)
  anticipation?: number; // 0-100 (will be clamped)
  surprise?: number; // 0-100 (will be clamped)
  size?: number;
  className?: string;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function VibeRadarChart({
  joy,
  anxiety,
  anticipation = 50,
  surprise = 30,
  size = 80,
  className = "",
}: VibeRadarChartProps) {
  // Clamp all values to 0-100 range
  const clampedJoy = clamp(joy, 0, 100);
  const clampedAnxiety = clamp(anxiety, 0, 100);
  const clampedAnticipation = clamp(anticipation, 0, 100);
  const clampedSurprise = clamp(surprise, 0, 100);

  const center = size / 2;
  // Use 80% of the radius to leave room for labels and prevent overflow
  const maxRadius = (size / 2) * 0.75;

  // Calculate points for the radar chart (4 axes)
  const points = useMemo(() => {
    const emotions = [
      { value: clampedJoy, angle: -90 }, // Top - Joy
      { value: clampedAnticipation, angle: 0 }, // Right - Anticipation
      { value: clampedAnxiety, angle: 90 }, // Bottom - Anxiety
      { value: clampedSurprise, angle: 180 }, // Left - Surprise
    ];

    return emotions.map(({ value, angle }) => {
      // Normalize to 0-1 range (already clamped, so max is 100)
      const normalizedValue = value / 100;
      const radius = normalizedValue * maxRadius;
      const radians = (angle * Math.PI) / 180;
      return {
        x: center + radius * Math.cos(radians),
        y: center + radius * Math.sin(radians),
      };
    });
  }, [clampedJoy, clampedAnxiety, clampedAnticipation, clampedSurprise, center, maxRadius]);

  // Create path for the filled area
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ${points
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(" ")} Z`;
  }, [points]);

  // Determine dominant color based on joy vs anxiety
  const fillColor = clampedJoy > clampedAnxiety ? "rgba(0, 255, 163, 0.3)" : "rgba(255, 0, 122, 0.3)";
  const strokeColor = clampedJoy > clampedAnxiety ? "#00FFA3" : "#FF007A";

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        {/* Background grid circles - 25%, 50%, 75%, 100% */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={center}
            cy={center}
            r={maxRadius * scale}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
        {[0, 90, 180, 270].map((angle) => {
          const radians = ((angle - 90) * Math.PI) / 180;
          const endX = center + maxRadius * Math.cos(radians);
          const endY = center + maxRadius * Math.sin(radians);
          return (
            <line
              key={angle}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Filled radar area */}
        <path d={pathD} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={strokeColor}
          />
        ))}
      </svg>

      {/* Labels - positioned outside the chart */}
      <div
        className="absolute font-mono text-[8px] text-[#00FFA3]"
        style={{ top: -2, left: "50%", transform: "translateX(-50%)" }}
      >
        JOY
      </div>
      <div
        className="absolute font-mono text-[8px] text-[#FF007A]"
        style={{ bottom: -2, left: "50%", transform: "translateX(-50%)" }}
      >
        ANX
      </div>
    </div>
  );
}
