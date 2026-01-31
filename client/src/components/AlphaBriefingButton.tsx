/**
 * AlphaBriefingButton Component
 * "Live Alpha Briefing" button that generates audio summary of top 3 markets
 * using ElevenLabs text-to-speech API
 */

import { useState, useRef } from "react";
import { Volume2, VolumeX, Loader2, Play, Pause, Radio } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface MarketBriefing {
  topic: string;
  momentum: number;
  change24h: number;
  hypeSummary: string;
}

interface AlphaBriefingButtonProps {
  markets: MarketBriefing[];
  className?: string;
}

export default function AlphaBriefingButton({ markets, className = "" }: AlphaBriefingButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateBriefingMutation = trpc.ai.generateAudioBriefing.useMutation();

  const handleGenerateBriefing = async () => {
    if (isGenerating) return;

    // If we already have audio, just play/pause it
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Generate new briefing
    setIsGenerating(true);
    toast.info("Generating Alpha Briefing...", { duration: 2000 });

    try {
      const topMarkets = markets.slice(0, 3).map((m) => ({
        topic: m.topic,
        momentum: m.momentum,
        change24h: m.change24h,
        hypeSummary: m.hypeSummary || `${m.topic} is showing ${m.change24h >= 0 ? "positive" : "negative"} momentum.`,
      }));

      const result = await generateBriefingMutation.mutateAsync({ markets: topMarkets });

      // Create audio element
      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      setAudioUrl(result.audioUrl);

      // Set up event listeners
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        toast.error("Failed to play audio");
        setIsPlaying(false);
      };

      // Play the audio
      await audio.play();
      setIsPlaying(true);
      toast.success(`Playing ${result.duration}s briefing`, { duration: 3000 });
    } catch (error) {
      console.error("Failed to generate briefing:", error);
      toast.error("Failed to generate briefing. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleGenerateBriefing}
        disabled={isGenerating}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold
          transition-all duration-300
          ${isPlaying 
            ? "bg-[#00FFA3] text-[#0B0E11] glow-green" 
            : "bg-[#00FFA3]/10 text-[#00FFA3] hover:bg-[#00FFA3]/20 border border-[#00FFA3]/30"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>GENERATING...</span>
          </>
        ) : isPlaying ? (
          <>
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE BRIEFING</span>
          </>
        ) : audioUrl ? (
          <>
            <Play className="w-3.5 h-3.5" />
            <span>REPLAY BRIEFING</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span>ALPHA BRIEFING</span>
          </>
        )}
      </button>

      {/* Stop button when playing */}
      {isPlaying && (
        <button
          onClick={handleStop}
          className="p-1.5 rounded-lg bg-[#FF007A]/10 text-[#FF007A] hover:bg-[#FF007A]/20 transition-colors"
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
