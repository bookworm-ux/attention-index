/*
 * DESIGN: Neo-Brutalist Terminal
 * Audio Waveform Animation Component
 * Shows animated bars when AI is "speaking" live
 */

import { useEffect, useState } from "react";

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  color?: string;
  className?: string;
}

export default function AudioWaveform({
  isPlaying,
  barCount = 5,
  color = "#00FFA3",
  className = "",
}: AudioWaveformProps) {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(20));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(20));
      return;
    }

    // Animate bars with random heights when playing
    const interval = setInterval(() => {
      setHeights(
        Array(barCount)
          .fill(0)
          .map(() => Math.random() * 80 + 20) // Random height between 20-100%
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <div className={`flex items-center gap-[2px] h-4 ${className}`}>
      {heights.map((height, index) => (
        <div
          key={index}
          className="w-[3px] rounded-full transition-all duration-100"
          style={{
            height: `${height}%`,
            backgroundColor: color,
            opacity: isPlaying ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
