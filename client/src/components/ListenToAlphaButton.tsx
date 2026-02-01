/*
 * DESIGN: Neo-Brutalist Terminal
 * Alpha Briefing Button Component
 * Triggers Live Alpha Briefing with Gemini script + ElevenLabs voice
 * Features: 'Generating Audio...' spinner + pulsing green waveform during playback
 * Voice: Custom Alpha voice (6EW6z8IiJRtePnNUNPKW) with Flash v2.5 model
 */

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Loader2, Mic, Radio } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AudioWaveform from "./AudioWaveform";

interface MarketData {
  topic: string;
  momentum: number;
  change24h: number;
  volume: string;
  hypeScore: number;
  hypeSummary?: string;
}

interface ListenToAlphaButtonProps {
  markets: MarketData[];
  className?: string;
}

type VoiceOption = "alpha" | "bill" | "charlotte" | "rachel" | "adam" | "josh";

export default function ListenToAlphaButton({ markets, className = "" }: ListenToAlphaButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>("alpha");
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const generateBriefingMutation = trpc.ai.generateLiveHypeBriefing.useMutation();

  // Close voice menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowVoiceMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (markets.length === 0) {
      toast.error("No markets available for briefing");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress("Fetching market data...");

    try {
      // Get top 3 markets for the briefing
      const topMarkets = markets.slice(0, 3).map(m => ({
        topic: m.topic,
        momentum: m.momentum,
        change24h: m.change24h,
        volume: m.volume,
        hypeScore: m.hypeScore,
        hypeSummary: m.hypeSummary || "",
      }));

      setGenerationProgress("Generating script...");
      
      const result = await generateBriefingMutation.mutateAsync({
        markets: topMarkets,
        voice: selectedVoice,
      });

      setGenerationProgress("Streaming audio...");

      // Create and play audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsGenerating(false);
      };
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setIsGenerating(false);
        toast.error("Failed to play audio");
      };

      await audio.play();

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Alpha Briefing Live</p>
          <p className="text-xs opacity-70">
            {result.wordCount} words · ~{result.estimatedDuration}s · {result.generationTimeMs}ms latency
          </p>
        </div>,
        { duration: 4000 }
      );
    } catch (error) {
      console.error("Failed to generate briefing:", error);
      toast.error("Failed to generate briefing. Please try again.");
      setIsGenerating(false);
    }
  };

  const voiceOptions: Array<{ id: VoiceOption; name: string; desc: string }> = [
    { id: "alpha", name: "Alpha", desc: "Wall Street broadcaster" },
    { id: "bill", name: "Bill", desc: "Authoritative male" },
    { id: "charlotte", name: "Charlotte", desc: "Professional female" },
    { id: "rachel", name: "Rachel", desc: "Warm female" },
    { id: "adam", name: "Adam", desc: "Deep male" },
    { id: "josh", name: "Josh", desc: "Energetic male" },
  ];

  return (
    <div className={`relative flex items-center gap-2 ${className}`} ref={menuRef}>
      {/* Voice selector */}
      <button
        onClick={() => setShowVoiceMenu(!showVoiceMenu)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        title="Select voice"
      >
        <Mic className="w-3 h-3 text-white/50" />
        <span className="font-mono text-xs text-white/70 capitalize">{selectedVoice}</span>
      </button>

      {/* Voice dropdown menu */}
      {showVoiceMenu && (
        <div className="absolute top-full left-0 mt-2 w-52 rounded-lg bg-[#1a1d21] border border-white/10 shadow-xl z-50 overflow-hidden">
          {voiceOptions.map((voice) => (
            <button
              key={voice.id}
              onClick={() => {
                setSelectedVoice(voice.id);
                setShowVoiceMenu(false);
              }}
              className={`w-full px-3 py-2 text-left hover:bg-white/5 transition-colors ${
                selectedVoice === voice.id ? "bg-[#00FFA3]/10 border-l-2 border-[#00FFA3]" : ""
              }`}
            >
              <span className="font-mono text-sm text-white block">{voice.name}</span>
              <span className="font-mono text-xs text-white/40">{voice.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handlePlay}
        disabled={isGenerating}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-display font-semibold text-sm transition-all
          ${isPlaying
            ? "bg-[#00FFA3] text-[#0B0E11] glow-green"
            : isGenerating
            ? "bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/30 cursor-wait"
            : "bg-white/5 text-white hover:bg-[#00FFA3]/20 hover:text-[#00FFA3] border border-white/10 hover:border-[#00FFA3]/30"
          }
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#00FFA3]" />
            <span className="text-[#00FFA3]">GENERATING AUDIO...</span>
          </>
        ) : isPlaying ? (
          <>
            <AudioWaveform isPlaying={isPlaying} barCount={5} color="#0B0E11" />
            <span>LIVE</span>
            <VolumeX className="w-4 h-4" />
          </>
        ) : (
          <>
            <Radio className="w-4 h-4" />
            <span>ALPHA BRIEFING</span>
          </>
        )}
      </button>

      {/* Pulsing green waveform indicator when playing */}
      {isPlaying && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00FFA3]/10 border border-[#00FFA3]/30 animate-pulse">
          <AudioWaveform isPlaying={isPlaying} barCount={7} color="#00FFA3" />
          <span className="font-mono text-xs text-[#00FFA3] font-semibold">AI SPEAKING</span>
        </div>
      )}

      {/* Generation progress indicator */}
      {isGenerating && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00FFA3]/5 border border-[#00FFA3]/20">
          <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
          <span className="font-mono text-xs text-[#00FFA3]/70">{generationProgress}</span>
        </div>
      )}
    </div>
  );
}
