/**
 * ElevenLabs Service for Audio Narrative
 * Generates "Live Hype Briefing" audio summaries of top markets
 * Optimized for ultra-low latency using Flash v2.5 model
 * Professional news anchor voices for Wall Street-style delivery
 */

import { ENV } from "../_core/env";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Professional news anchor voices
const VOICES = {
  // Bill - Deep, authoritative male voice (like CNBC anchor)
  BILL: "pqHfZKP75CvOlQylNhV4",
  // Charlotte - Professional female news anchor
  CHARLOTTE: "XB0fDUnXU5powFXDhCwa",
  // Rachel - Warm professional female voice
  RACHEL: "21m00Tcm4TlvDq8ikWAM",
  // Adam - Deep male voice
  ADAM: "pNInz6obpgDQGcFmaJgB",
  // Josh - Young professional male
  JOSH: "TxGEqnHWrfWFTfGW9XjX",
};

// Default to Bill for that authoritative Wall Street feel
const DEFAULT_VOICE_ID = VOICES.BILL;

// Model options for different latency requirements
const MODELS = {
  // Flash v2.5 - Ultra-low latency (~75% faster), optimized for real-time applications
  FLASH: "eleven_flash_v2_5",
  // Turbo v2.5 - Low latency with better quality
  TURBO: "eleven_turbo_v2_5",
  // Multilingual v2 - Best quality, higher latency
  MULTILINGUAL: "eleven_multilingual_v2",
  // Monolingual v1 - Legacy model
  MONOLINGUAL: "eleven_monolingual_v1",
};

export interface MarketBriefing {
  topic: string;
  momentum: number;
  change24h: number;
  hypeSummary: string;
}

export interface AudioBriefingResult {
  audioUrl: string;
  audioBase64: string;
  duration: number;
  script: string;
  model: string;
  voice: string;
}

export type VoiceOption = "bill" | "charlotte" | "rachel" | "adam" | "josh";

/**
 * Get voice ID from voice name
 */
function getVoiceId(voice: VoiceOption): string {
  const voiceMap: Record<VoiceOption, string> = {
    bill: VOICES.BILL,
    charlotte: VOICES.CHARLOTTE,
    rachel: VOICES.RACHEL,
    adam: VOICES.ADAM,
    josh: VOICES.JOSH,
  };
  return voiceMap[voice] || VOICES.BILL;
}

/**
 * Generate a 30-second script for top markets briefing
 * Optimized for brevity to reduce generation time
 */
export function generateBriefingScript(markets: MarketBriefing[]): string {
  const topMarkets = markets.slice(0, 3);

  const intro = "Alpha Briefing. Here's what's moving right now.";

  const marketSegments = topMarkets.map((market, index) => {
    const position = index === 0 ? "Number one" : index === 1 ? "Second" : "Third";
    const direction = market.change24h >= 0 ? "up" : "down";
    const changeAbs = Math.abs(market.change24h).toFixed(0);

    // Shortened format for faster generation
    return `${position}: ${market.topic}, momentum ${market.momentum}, ${direction} ${changeAbs} percent.`;
  });

  const outro = "Trade smart. Attention is currency.";

  return [intro, ...marketSegments, outro].join(" ");
}

/**
 * Convert text to speech using ElevenLabs API
 * Uses Flash v2.5 model for ultra-low latency
 */
export async function textToSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID,
  useFlash: boolean = true
): Promise<{ audioBase64: string; contentType: string; model: string }> {
  // Select model based on latency preference
  const modelId = useFlash ? MODELS.FLASH : MODELS.TURBO;

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ENV.elevenLabsApiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.75, // Higher stability for professional delivery
          similarity_boost: 0.75,
          style: 0.5, // Moderate style for natural but professional tone
          use_speaker_boost: true, // Enable for clearer audio
        },
        // Optimize for latency
        optimize_streaming_latency: 3, // Balance between latency and quality
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs] API error:", errorText);
      
      // Fallback to turbo model if flash fails
      if (useFlash && response.status === 400) {
        console.log("[ElevenLabs] Falling back to turbo model");
        return textToSpeech(text, voiceId, false);
      }
      
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get the audio as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    return {
      audioBase64,
      contentType: "audio/mpeg",
      model: modelId,
    };
  } catch (error) {
    console.error("[ElevenLabs] Error generating speech:", error);
    throw error;
  }
}

/**
 * Generate Live Hype Briefing with Wall Street-style delivery
 * Uses Gemini-generated script and professional news anchor voice
 */
export async function generateLiveHypeBriefing(
  script: string,
  voice: VoiceOption = "bill"
): Promise<AudioBriefingResult> {
  const startTime = Date.now();
  const voiceId = getVoiceId(voice);

  // Convert to speech using Flash model for instant playback
  const { audioBase64, model } = await textToSpeech(script, voiceId, true);

  // Calculate duration based on word count (~150 words per minute for professional narration)
  const wordCount = script.split(/\s+/).length;
  const estimatedDuration = Math.round((wordCount / 150) * 60);

  const generationTime = Date.now() - startTime;
  console.log(`[ElevenLabs] Generated Live Hype Briefing in ${generationTime}ms using ${model} with voice ${voice}`);

  return {
    audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
    audioBase64,
    duration: estimatedDuration,
    script,
    model,
    voice,
  };
}

/**
 * Generate a complete audio briefing for top markets
 * Optimized for speed with Flash v2.5 model
 */
export async function generateAlphaBriefing(
  markets: MarketBriefing[],
  voice: VoiceOption = "bill"
): Promise<AudioBriefingResult> {
  const startTime = Date.now();
  const voiceId = getVoiceId(voice);

  // Generate the script (optimized for brevity)
  const script = generateBriefingScript(markets);

  // Convert to speech using Flash model
  const { audioBase64, model } = await textToSpeech(script, voiceId, true);

  // Estimate duration (roughly 150 words per minute for professional narration)
  const wordCount = script.split(/\s+/).length;
  const estimatedDuration = Math.round((wordCount / 150) * 60);

  const generationTime = Date.now() - startTime;
  console.log(`[ElevenLabs] Generated briefing in ${generationTime}ms using ${model}`);

  return {
    audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
    audioBase64,
    duration: estimatedDuration,
    script,
    model,
    voice,
  };
}

/**
 * Stream audio generation for even lower latency (experimental)
 * Returns chunks as they're generated
 */
export async function streamTextToSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID,
  onChunk: (chunk: Uint8Array) => void
): Promise<void> {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: {
        "xi-api-key": ENV.elevenLabsApiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODELS.FLASH,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        },
        optimize_streaming_latency: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs streaming error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body for streaming");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        onChunk(value);
      }
    }
  } catch (error) {
    console.error("[ElevenLabs] Streaming error:", error);
    throw error;
  }
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices(): Promise<
  Array<{ voice_id: string; name: string; category: string }>
> {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        "xi-api-key": ENV.elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    return data.voices.map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
    }));
  } catch (error) {
    console.error("[ElevenLabs] Error fetching voices:", error);
    return [];
  }
}

/**
 * Get list of available voice options for the UI
 */
export function getVoiceOptions(): Array<{ id: VoiceOption; name: string; description: string }> {
  return [
    { id: "bill", name: "Bill", description: "Deep, authoritative male voice - CNBC style" },
    { id: "charlotte", name: "Charlotte", description: "Professional female news anchor" },
    { id: "rachel", name: "Rachel", description: "Warm, professional female voice" },
    { id: "adam", name: "Adam", description: "Deep, commanding male voice" },
    { id: "josh", name: "Josh", description: "Young, energetic male voice" },
  ];
}
