/**
 * VibeRadarChart Component
 * Displays Joy (Excitement) and Anxiety (Risk) scores from Hume AI analysis
 * as a compact radar chart visualization
 * 
 * Values are clamped to 0-100% range to ensure professional display
 * Optimized for maximum visual impact with asymmetric padding
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

// Configuration constants - optimized for maximum visual impact
const PADDING_TOP = 10;    // Space for JOY label
const PADDING_BOTTOM = 10; // Space for ANX label
const PADDING_HORIZONTAL = 2; // Minimal horizontal padding to maximize width
const LABEL_PADDING = 6;   // Small buffer between label and chart edge
const LABEL_FONT_SIZE = 7; // Compact font for labels

export default function VibeRadarChart({
  joy,
  anxiety,
  anticipation = 50,
  surprise = 30,
  size = 80,
  className = "",
}: VibeRadarChartProps) {
  // Clamp all values to 0-100 range (suggestedMax = 100)
  const clampedJoy = clamp(joy, 0, 100);
  const clampedAnxiety = clamp(anxiety, 0, 100);
  const clampedAnticipation = clamp(anticipation, 0, 100);
  const clampedSurprise = clamp(surprise, 0, 100);

  // Calculate chart area with asymmetric padding
  const chartWidth = size - (PADDING_HORIZONTAL * 2);
  const chartHeight = size - PADDING_TOP - PADDING_BOTTOM;
  
  // Center point accounting for asymmetric padding
  const centerX = size / 2;
  const centerY = PADDING_TOP + (chartHeight / 2);
  
  // Maximize radius - use 88% of available space (increased from 65%)
  const maxRadius = Math.min(chartWidth, chartHeight) / 2 * 0.88;

  // Calculate points for the radar chart (4 axes)
  const points = useMemo(() => {
    const emotions = [
      { value: clampedJoy, angle: -90 }, // Top - Joy
      { value: clampedAnticipation, angle: 0 }, // Right - Anticipation
      { value: clampedAnxiety, angle: 90 }, // Bottom - Anxiety
      { value: clampedSurprise, angle: 180 }, // Left - Surprise
    ];

    return emotions.map(({ value, angle }) => {
      // Normalize to 0-1 range (suggestedMax = 100, so divide by 100)
      const normalizedValue = value / 100;
      const radius = normalizedValue * maxRadius;
      const radians = (angle * Math.PI) / 180;
      return {
        x: centerX + radius * Math.cos(radians),
        y: centerY + radius * Math.sin(radians),
      };
    });
  }, [clampedJoy, clampedAnxiety, clampedAnticipation, clampedSurprise, centerX, centerY, maxRadius]);

  // Create path for the filled area
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ${points
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(" ")} Z`;
  }, [points]);

  // Determine dominant color based on joy vs anxiety
  const fillColor = clampedJoy > clampedAnxiety ? "rgba(0, 255, 163, 0.35)" : "rgba(255, 0, 122, 0.35)";
  const strokeColor = clampedJoy > clampedAnxiety ? "#00FFA3" : "#FF007A";

  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        width: size, 
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        {/* Background grid circles - 50%, 100% only for cleaner look */}
        {[0.5, 1].map((scale) => (
          <circle
            key={scale}
            cx={centerX}
            cy={centerY}
            r={maxRadius * scale}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines - vertical only for JOY/ANX emphasis */}
        <line
          x1={centerX}
          y1={centerY - maxRadius}
          x2={centerX}
          y2={centerY + maxRadius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.5"
        />
        <line
          x1={centerX - maxRadius}
          y1={centerY}
          x2={centerX + maxRadius}
          y2={centerY}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
        />

        {/* Filled radar area */}
        <path d={pathD} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="2.5"
            fill={strokeColor}
          />
        ))}

        {/* JOY label - positioned at top with small padding */}
        <text
          x={centerX}
          y={centerY - maxRadius - LABEL_PADDING}
          textAnchor="middle"
          dominantBaseline="auto"
          fill="#00FFA3"
          fontSize={LABEL_FONT_SIZE}
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
        >
          JOY
        </text>
        
        {/* ANX label - positioned at bottom with small padding */}
        <text
          x={centerX}
          y={centerY + maxRadius + LABEL_PADDING}
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="#FF007A"
          fontSize={LABEL_FONT_SIZE}
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
        >
          ANX
        </text>
      </svg>
    </div>
  );
}
