/*
 * DESIGN: Neo-Brutalist Terminal
 * Sharp, jagged sparkline showing interest velocity
 * Aggressive EKG-style visualization
 */

import { useMemo } from "react";

interface VelocitySparklineProps {
  data: number[];
  trend: "up" | "down" | "neutral";
  width?: number;
  height?: number;
  className?: string;
}

export default function VelocitySparkline({ 
  data, 
  trend, 
  width = 120, 
  height = 40,
  className = ""
}: VelocitySparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return "";
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  const gradientId = useMemo(() => `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
  
  const colors = {
    up: { stroke: "#00FFA3", glow: "rgba(0, 255, 163, 0.5)" },
    down: { stroke: "#FF007A", glow: "rgba(255, 0, 122, 0.5)" },
    neutral: { stroke: "#6B7280", glow: "rgba(107, 114, 128, 0.3)" },
  };

  const color = colors[trend];

  return (
    <svg 
      width={width} 
      height={height} 
      className={`overflow-visible ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color.stroke} stopOpacity="0.2" />
          <stop offset="50%" stopColor={color.stroke} stopOpacity="1" />
          <stop offset="100%" stopColor={color.stroke} stopOpacity="0.6" />
        </linearGradient>
        <filter id={`glow-${gradientId}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Glow effect line */}
      <path
        d={path}
        fill="none"
        stroke={color.glow}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-50"
      />
      
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-animate"
        filter={`url(#glow-${gradientId})`}
      />
      
      {/* End point dot */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 8) - 4}
          r="3"
          fill={color.stroke}
          className="animate-pulse"
        />
      )}
    </svg>
  );
}
