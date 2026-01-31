/**
 * Gemini AI Service for Data Pipeline
 * Filters live signals and extracts structured data:
 * - core_event: The main event being discussed
 * - main_actors: Key people/companies involved
 * - hype_summary: A brief summary of the hype/sentiment
 */

import { ENV } from "../_core/env";

export interface SignalAnalysis {
  core_event: string;
  main_actors: string[];
  hype_summary: string;
  is_bot_noise: boolean;
  confidence: number;
}

export interface RawSignal {
  id: string;
  source: "twitter" | "reddit" | "hackernews" | "news";
  content: string;
  timestamp: number;
  engagement?: {
    likes?: number;
    retweets?: number;
    comments?: number;
  };
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a financial signal analyst for a trading platform called "Attention Index". 
Your job is to analyze social media signals and news to extract structured data for traders.

For each signal, you must:
1. Identify the core event being discussed
2. Extract the main actors (people, companies, projects) involved
3. Write a brief hype summary (max 50 words) capturing the sentiment and momentum
4. Determine if this is bot noise (spam, automated posts, low-quality content)
5. Provide a confidence score (0-100) for your analysis

IMPORTANT: To maintain our 90% accuracy claim, you must:
- Ignore obvious bot/spam content (repetitive text, suspicious patterns)
- Focus on signals with genuine engagement
- Be conservative with confidence scores
- Flag uncertain signals as potential bot noise

Respond ONLY with valid JSON in this exact format:
{
  "core_event": "string describing the main event",
  "main_actors": ["actor1", "actor2"],
  "hype_summary": "brief sentiment summary",
  "is_bot_noise": boolean,
  "confidence": number between 0-100
}`;

export async function analyzeSignal(signal: RawSignal): Promise<SignalAnalysis> {
  const prompt = `Analyze this ${signal.source} signal:

Content: "${signal.content}"
${signal.engagement ? `Engagement: ${JSON.stringify(signal.engagement)}` : ""}

Extract the structured data as specified.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${ENV.geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini] API error:", errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No content in Gemini response");
    }

    // Parse the JSON response
    const analysis = JSON.parse(textContent) as SignalAnalysis;

    // Validate the response structure
    if (
      typeof analysis.core_event !== "string" ||
      !Array.isArray(analysis.main_actors) ||
      typeof analysis.hype_summary !== "string" ||
      typeof analysis.is_bot_noise !== "boolean" ||
      typeof analysis.confidence !== "number"
    ) {
      throw new Error("Invalid response structure from Gemini");
    }

    return analysis;
  } catch (error) {
    console.error("[Gemini] Error analyzing signal:", error);
    // Return a fallback analysis for failed requests
    return {
      core_event: "Analysis unavailable",
      main_actors: [],
      hype_summary: signal.content.slice(0, 100),
      is_bot_noise: false,
      confidence: 0,
    };
  }
}

export async function analyzeMultipleSignals(signals: RawSignal[]): Promise<Map<string, SignalAnalysis>> {
  const results = new Map<string, SignalAnalysis>();

  // Process signals in parallel with rate limiting (max 5 concurrent)
  const batchSize = 5;
  for (let i = 0; i < signals.length; i += batchSize) {
    const batch = signals.slice(i, i + batchSize);
    const analyses = await Promise.all(batch.map((signal) => analyzeSignal(signal)));

    batch.forEach((signal, index) => {
      results.set(signal.id, analyses[index]);
    });
  }

  return results;
}

export async function generateMarketHypeSummary(
  topic: string,
  recentSignals: RawSignal[]
): Promise<{ summary: string; momentum: "rising" | "falling" | "stable" }> {
  const signalTexts = recentSignals.slice(0, 10).map((s) => `- ${s.content}`).join("\n");

  const prompt = `Analyze the overall hype and momentum for "${topic}" based on these recent signals:

${signalTexts}

Provide:
1. A 2-3 sentence summary of the current hype/sentiment
2. Whether momentum is "rising", "falling", or "stable"

Respond ONLY with valid JSON:
{
  "summary": "your summary here",
  "momentum": "rising" | "falling" | "stable"
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${ENV.geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No content in Gemini response");
    }

    return JSON.parse(textContent);
  } catch (error) {
    console.error("[Gemini] Error generating market summary:", error);
    return {
      summary: "Unable to generate summary at this time.",
      momentum: "stable",
    };
  }
}
