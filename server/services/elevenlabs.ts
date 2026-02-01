/**
 * ElevenLabs Service for Audio Narrative
 * Generates briefing audio summaries of top markets
 * Optimized for ultra-low latency using Flash v2.5 model
 * Default voice: Bill (pMsXg8qnD5Ets9xZ9T2o)
 * Includes retry logic for network failures
 */

import { ENV } from "../_core/env";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Voice options
const VOICES = {
  // Bill - Deep, authoritative male voice (default)
  BILL: "6EW6z8IiJRtePnNUNPKW",
  // Charlotte - Professional female news anchor
  CHARLOTTE: "XB0fDUnXU5powFXDhCwa",
  // Rachel - Warm professional female voice
  RACHEL: "21m00Tcm4TlvDq8ikWAM",
  // Adam - Deep male voice
  ADAM: "pNInz6obpgDQGcFmaJgB",
  // Josh - Young professional male
  JOSH: "TxGEqnHWrfWFTfGW9XjX",
};

// Default to Bill voice
const DEFAULT_VOICE_ID = VOICES.BILL;

// Model - Flash v2.5 for sub-second latency
const MODELS = {
  // Flash v2.5 - Ultra-low latency (~75% faster), optimized for real-time applications
  FLASH: "eleven_flash_v2_5",
  // Turbo v2.5 - Low latency with better quality
  TURBO: "eleven_turbo_v2_5",
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

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
  latencyMs: number;
}

export type VoiceOption = "bill" | "charlotte" | "rachel" | "adam" | "josh";

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Strip JSON formatting and brackets from text
 * Ensures only clean plain text is sent to ElevenLabs
 */
function stripJSON(text: string): string {
  // Force to string and remove all JSON artifacts
  const cleanText = String(text).replace(/[{\[\]}]/g, '');
  
  // Remove JSON structure markers
  let cleaned = cleanText
    .replace(/"([^"]+)":/g, '') // Remove JSON keys
    .replace(/\\n/g, ' ') // Replace escaped newlines with spaces
    .replace(/\\"/g, '"') // Unescape quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return cleaned;
}

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
  return voiceMap[voice] || DEFAULT_VOICE_ID;
}

/**
 * Generate a 30-second script for top markets briefing
 * Optimized for brevity to reduce generation time
 */
export function generateBriefingScript(markets: MarketBriefing[]): string {
  const topMarkets = markets.slice(0, 3);

  const intro = "Briefing. Here's what's moving right now.";

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
 * Convert text to speech using ElevenLabs API with retry logic
 * Uses Flash v2.5 model for sub-second latency
 * Strips JSON formatting before sending
 */
export async function textToSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID,
  useFlash: boolean = true,
  retryCount: number = 0
): Promise<{ audioBase64: string; contentType: string; model: string; latencyMs: number }> {
  const startTime = Date.now();
  
  // Strip JSON formatting and brackets - send only clean plain text
  const cleanText = stripJSON(text);
  
  // Always use Flash v2.5 for sub-second latency
  const modelId = MODELS.FLASH;

  // Voice settings
  const voiceSettings = {
    stability: 0.40,
    similarity_boost: 0.60,
    style: 0.3,
    use_speaker_boost: true,
  };

  try {
    console.log(`[ElevenLabs] Starting TTS with model: ${modelId}, voice: ${voiceId}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ENV.elevenLabsApiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: modelId,
        voice_settings: voiceSettings,
        // Maximum latency optimization for real-time streaming
        optimize_streaming_latency: 4,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs] API error:", errorText);
      
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get the audio as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    
    const latencyMs = Date.now() - startTime;
    console.log(`[ElevenLabs] TTS completed in ${latencyMs}ms`);

    return {
      audioBase64,
      contentType: "audio/mpeg",
      model: modelId,
      latencyMs,
    };
  } catch (error: any) {
    const isNetworkError = error.message?.includes('fetch failed') || 
                          error.message?.includes('ECONNRESET') ||
                          error.message?.includes('network') ||
                          error.name === 'AbortError';
    
    // Retry on network errors
    if (isNetworkError && retryCount < MAX_RETRIES) {
      console.log(`[ElevenLabs] Network error, retrying in ${RETRY_DELAY_MS}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS * (retryCount + 1)); // Exponential backoff
      return textToSpeech(text, voiceId, useFlash, retryCount + 1);
    }
    
    console.error("[ElevenLabs] Error generating speech:", error);
    throw error;
  }
}

/**
 * Generate briefing with Wall Street-style delivery
 * Uses Gemini-generated script and Bill voice
 * Optimized for sub-second latency with Flash v2.5
 */
export async function generateLiveHypeBriefing(
  script: string,
  voice: VoiceOption = "bill"
): Promise<AudioBriefingResult> {
  const startTime = Date.now();
  const voiceId = getVoiceId(voice);

  try {
    // Convert to speech using Flash model for instant playback
    const { audioBase64, model, latencyMs } = await textToSpeech(script, voiceId, true);

    // Calculate duration based on word count (~150 words per minute for professional narration)
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    const totalTime = Date.now() - startTime;
    console.log(`[ElevenLabs] Generated briefing in ${totalTime}ms (TTS: ${latencyMs}ms) using ${model}`);

    return {
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
      audioBase64,
      duration: estimatedDuration,
      script,
      model,
      voice,
      latencyMs: totalTime,
    };
  } catch (error) {
    console.error("[ElevenLabs] Failed to generate briefing:", error);
    throw new Error("Audio generation failed. Please try again.");
  }
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

  try {
    // Convert to speech using Flash model
    const { audioBase64, model, latencyMs } = await textToSpeech(script, voiceId, true);

    // Estimate duration (roughly 150 words per minute for professional narration)
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    const totalTime = Date.now() - startTime;
    console.log(`[ElevenLabs] Generated briefing in ${totalTime}ms using ${model}`);

    return {
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
      audioBase64,
      duration: estimatedDuration,
      script,
      model,
      voice,
      latencyMs: totalTime,
    };
  } catch (error) {
    console.error("[ElevenLabs] Failed to generate briefing:", error);
    throw new Error("Audio generation failed. Please try again.");
  }
}

/**
 * Get list of available voice options for the UI
 */
export function getVoiceOptions(): Array<{ id: VoiceOption; name: string; description: string }> {
  return [
    { id: "bill", name: "Bill", description: "Deep, authoritative male voice - Default" },
    { id: "charlotte", name: "Charlotte", description: "Professional female news anchor" },
    { id: "rachel", name: "Rachel", description: "Warm, professional female voice" },
    { id: "adam", name: "Adam", description: "Deep, commanding male voice" },
    { id: "josh", name: "Josh", description: "Young, energetic male voice" },
  ];
}
