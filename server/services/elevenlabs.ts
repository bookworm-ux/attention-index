/**
 * ElevenLabs Service for Audio Narrative
 * Generates "Live Alpha Briefing" audio summaries of top markets
 */

import { ENV } from "../_core/env";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Professional news anchor voice
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - professional female voice

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
}

/**
 * Generate a 30-second script for top markets briefing
 */
export function generateBriefingScript(markets: MarketBriefing[]): string {
  const topMarkets = markets.slice(0, 3);

  const intro = "Welcome to your Live Alpha Briefing from Attention Index. Here's what's moving the attention markets right now.";

  const marketSegments = topMarkets.map((market, index) => {
    const position = index === 0 ? "Leading the pack" : index === 1 ? "In second place" : "Rounding out the top three";
    const direction = market.change24h >= 0 ? "up" : "down";
    const changeAbs = Math.abs(market.change24h).toFixed(1);

    return `${position}, ${market.topic} with a momentum score of ${market.momentum}. It's ${direction} ${changeAbs} percent in the last 24 hours. ${market.hypeSummary}`;
  });

  const outro = "That's your alpha briefing. Trade smart, and remember: attention is the new currency.";

  return [intro, ...marketSegments, outro].join(" ");
}

/**
 * Convert text to speech using ElevenLabs API
 */
export async function textToSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<{ audioBase64: string; contentType: string }> {
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
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs] API error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get the audio as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    return {
      audioBase64,
      contentType: "audio/mpeg",
    };
  } catch (error) {
    console.error("[ElevenLabs] Error generating speech:", error);
    throw error;
  }
}

/**
 * Generate a complete audio briefing for top markets
 */
export async function generateAlphaBriefing(markets: MarketBriefing[]): Promise<AudioBriefingResult> {
  // Generate the script
  const script = generateBriefingScript(markets);

  // Convert to speech
  const { audioBase64 } = await textToSpeech(script);

  // Estimate duration (roughly 150 words per minute for professional narration)
  const wordCount = script.split(/\s+/).length;
  const estimatedDuration = Math.round((wordCount / 150) * 60);

  return {
    audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
    audioBase64,
    duration: estimatedDuration,
    script,
  };
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
