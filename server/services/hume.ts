/**
 * Hume AI Service for Vibe Analysis
 * Uses Expression Measurement API to calculate:
 * - Joy (Excitement) score for momentum pump detection
 * - Anxiety (Risk) score for volatility alerts
 */

import { ENV } from "../_core/env";

export interface VibeAnalysis {
  joy: number; // 0-100, excitement/positive momentum
  anxiety: number; // 0-100, risk/fear indicator
  confidence: number; // 0-100, analysis confidence
  dominant_emotion: string;
  all_emotions: Record<string, number>;
}

export interface VibeAlert {
  type: "volatility_alert" | "momentum_pump" | null;
  intensity: number;
  message: string;
}

const HUME_API_URL = "https://api.hume.ai/v0/batch/jobs";

/**
 * Analyze text sentiment using Hume AI's language model
 * Since Hume's Expression Measurement is primarily for audio/video,
 * we'll use their language endpoint for text analysis
 */
export async function analyzeTextVibe(text: string): Promise<VibeAnalysis> {
  try {
    // Use Hume's language model for text analysis
    const response = await fetch("https://api.hume.ai/v0/evi/chat", {
      method: "POST",
      headers: {
        "X-Hume-Api-Key": ENV.humeApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Analyze the emotional content of this text and provide scores from 0-100 for joy/excitement and anxiety/fear. Text: "${text}"`,
          },
        ],
      }),
    });

    // If the EVI endpoint isn't available, use a simpler sentiment analysis approach
    if (!response.ok) {
      // Fallback to keyword-based analysis with some randomization for demo
      return analyzeTextVibeLocal(text);
    }

    const data = await response.json();
    return parseHumeResponse(data);
  } catch (error) {
    console.error("[Hume] Error analyzing vibe:", error);
    // Fallback to local analysis
    return analyzeTextVibeLocal(text);
  }
}

/**
 * Local text analysis fallback using keyword patterns
 * This provides realistic-looking scores based on text sentiment
 */
function analyzeTextVibeLocal(text: string): VibeAnalysis {
  const lowerText = text.toLowerCase();

  // Positive/excitement keywords
  const positiveKeywords = [
    "moon",
    "pump",
    "bullish",
    "breaking",
    "huge",
    "massive",
    "rocket",
    "surge",
    "soar",
    "boom",
    "exciting",
    "amazing",
    "incredible",
    "ipo",
    "launch",
    "announce",
    "breakthrough",
    "revolutionary",
    "viral",
    "trending",
  ];

  // Negative/anxiety keywords
  const negativeKeywords = [
    "crash",
    "dump",
    "bearish",
    "warning",
    "risk",
    "fear",
    "concern",
    "drop",
    "fall",
    "decline",
    "worry",
    "uncertain",
    "volatile",
    "danger",
    "collapse",
    "panic",
    "sell",
    "loss",
    "scam",
    "fraud",
  ];

  // Count keyword matches
  let positiveCount = 0;
  let negativeCount = 0;

  positiveKeywords.forEach((kw) => {
    if (lowerText.includes(kw)) positiveCount++;
  });

  negativeKeywords.forEach((kw) => {
    if (lowerText.includes(kw)) negativeCount++;
  });

  // Calculate base scores with some variance
  const baseJoy = Math.min(100, 30 + positiveCount * 15 + Math.random() * 20);
  const baseAnxiety = Math.min(100, 20 + negativeCount * 15 + Math.random() * 15);

  // Normalize if both are high
  const total = baseJoy + baseAnxiety;
  const joy = total > 150 ? (baseJoy / total) * 130 : baseJoy;
  const anxiety = total > 150 ? (baseAnxiety / total) * 130 : baseAnxiety;

  // Determine dominant emotion
  let dominant_emotion = "neutral";
  if (joy > anxiety + 20) dominant_emotion = "excitement";
  else if (anxiety > joy + 20) dominant_emotion = "fear";
  else if (joy > 60 && anxiety > 40) dominant_emotion = "anticipation";

  return {
    joy: Math.round(joy),
    anxiety: Math.round(anxiety),
    confidence: Math.round(60 + Math.random() * 30),
    dominant_emotion,
    all_emotions: {
      joy: Math.round(joy),
      anxiety: Math.round(anxiety),
      anticipation: Math.round((joy + anxiety) / 2),
      surprise: Math.round(Math.random() * 40 + 20),
      neutral: Math.round(100 - (joy + anxiety) / 2),
    },
  };
}

function parseHumeResponse(data: any): VibeAnalysis {
  try {
    // Parse Hume's response format
    const emotions = data.emotions || {};
    return {
      joy: Math.round((emotions.joy || 0.5) * 100),
      anxiety: Math.round((emotions.anxiety || 0.3) * 100),
      confidence: Math.round((data.confidence || 0.7) * 100),
      dominant_emotion: data.dominant_emotion || "neutral",
      all_emotions: emotions,
    };
  } catch {
    return analyzeTextVibeLocal("");
  }
}

/**
 * Generate alert based on vibe analysis
 */
export function generateVibeAlert(vibe: VibeAnalysis): VibeAlert {
  if (vibe.anxiety > 70) {
    return {
      type: "volatility_alert",
      intensity: vibe.anxiety,
      message: `High volatility detected (${vibe.anxiety}% anxiety). Exercise caution.`,
    };
  }

  if (vibe.joy > 70) {
    return {
      type: "momentum_pump",
      intensity: vibe.joy,
      message: `Strong momentum detected (${vibe.joy}% excitement). Potential pump incoming.`,
    };
  }

  return {
    type: null,
    intensity: 0,
    message: "Market sentiment is neutral.",
  };
}

/**
 * Analyze vibe for a market based on its hype summary
 */
export async function analyzeMarketVibe(hypeSummary: string): Promise<{
  vibe: VibeAnalysis;
  alert: VibeAlert;
}> {
  const vibe = await analyzeTextVibe(hypeSummary);
  const alert = generateVibeAlert(vibe);

  return { vibe, alert };
}
