/*
 * DESIGN: Neo-Brutalist Terminal
 * Listen to Alpha Button Component
 * Triggers Live Hype Briefing with Gemini script + ElevenLabs voice
 * Shows audio waveform animation during playback
 */

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Loader2, Mic } from "lucide-react";
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

type VoiceOption = "bill" | "charlotte" | "rachel" | "adam" | "josh";

export default function ListenToAlphaButton({ markets, className = "" }: ListenToAlphaButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>("bill");
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
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

      const result = await generateBriefingMutation.mutateAsync({
        markets: topMarkets,
        voice: selectedVoice,
      });

      // Create and play audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        toast.error("Failed to play audio");
      };

      await audio.play();

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Live Hype Briefing</p>
          <p className="text-xs opacity-70">
            {result.wordCount} words · ~{result.estimatedDuration}s · Generated in {result.generationTimeMs}ms
          </p>
        </div>,
        { duration: 4000 }
      );
    } catch (error) {
      console.error("Failed to generate briefing:", error);
      toast.error("Failed to generate briefing. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const voiceOptions: Array<{ id: VoiceOption; name: string; desc: string }> = [
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
        <div className="absolute top-full left-0 mt-2 w-48 rounded-lg bg-[#1a1d21] border border-white/10 shadow-xl z-50 overflow-hidden">
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
            ? "bg-white/10 text-white/50 cursor-wait"
            : "bg-white/5 text-white hover:bg-[#00FFA3]/20 hover:text-[#00FFA3] border border-white/10 hover:border-[#00FFA3]/30"
          }
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>GENERATING...</span>
          </>
        ) : isPlaying ? (
          <>
            <AudioWaveform isPlaying={isPlaying} barCount={5} color="#0B0E11" />
            <span>LIVE</span>
            <VolumeX className="w-4 h-4" />
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            <span>LISTEN TO ALPHA</span>
          </>
        )}
      </button>

      {/* Audio waveform indicator when playing (outside button) */}
      {isPlaying && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00FFA3]/10 border border-[#00FFA3]/30">
          <AudioWaveform isPlaying={isPlaying} barCount={7} color="#00FFA3" />
          <span className="font-mono text-xs text-[#00FFA3] animate-pulse">AI SPEAKING</span>
        </div>
      )}
    </div>
  );
}
