/**
 * Gemini AI Service for Data Pipeline
 * Optimized for Free Tier limits (15 RPM):
 * - Batches up to 10 signals per API call
 * - Combined Filter + Strategist output
 * - Rate limiting with request queue
 * - Wall Street-style Live Hype Briefing generation
 */

import { ENV } from "../_core/env";

// Combined Filter + Strategist output
export interface SignalAnalysis {
  core_event: string;
  main_actors: string[];
  hype_summary: string;
  is_bot_noise: boolean;
  confidence: number;
  // Strategist fields
  recommended_duration: "30M" | "1H" | "3H";
  rationale: string;
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

// Market data for briefing generation
export interface MarketBriefingData {
  topic: string;
  momentum: number;
  change24h: number;
  volume: string;
  hypeScore: number;
  hypeSummary?: string;
}

// Rate limiting: 15 RPM = 1 request per 4 seconds
const MIN_REQUEST_INTERVAL_MS = 4000;
let lastRequestTime = 0;
const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest));
    }
    
    const request = requestQueue.shift();
    if (request) {
      lastRequestTime = Date.now();
      await request();
    }
  }

  isProcessingQueue = false;
}

function queueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const BATCH_SYSTEM_PROMPT = `You are a financial signal analyst and strategist for "Attention Index" trading platform.
Analyze social signals and provide BOTH data extraction AND trading strategy recommendations.

For EACH signal in the batch, output:
1. core_event: The main event being discussed
2. main_actors: Key people/companies involved (array)
3. hype_summary: Brief sentiment summary (max 50 words)
4. is_bot_noise: Boolean - true if spam/bot content
5. confidence: 0-100 score for analysis quality
6. recommended_duration: Trading window - "30M" (high volatility), "1H" (moderate), or "3H" (stable trend)
7. rationale: Brief reason for duration recommendation (max 30 words)

STRATEGY RULES:
- 30M: Use for breaking news, viral moments, high engagement spikes
- 1H: Use for developing stories, moderate momentum
- 3H: Use for established trends, stable sentiment

To maintain 90% accuracy:
- Ignore bot/spam content (repetitive, suspicious patterns)
- Focus on genuine engagement signals
- Be conservative with confidence scores

Respond with a JSON array, one object per signal in the same order as input.`;

// Wall Street-style briefing prompt
const WALL_STREET_BRIEFING_PROMPT = `You are a senior Wall Street market analyst delivering a live audio briefing for "Attention Index" - a platform that trades momentum on viral topics and cultural moments.

Write a punchy, urgent, 45-second market update script (approximately 120-140 words) in the style of CNBC's Fast Money or Bloomberg's Market Wrap.

TONE REQUIREMENTS:
- Professional but energetic - like a trader who just spotted alpha
- Data-driven with specific numbers
- Urgent and time-sensitive language
- Use financial jargon naturally (momentum, velocity, positioning, flows)
- Short, punchy sentences for impact
- Create FOMO without being unprofessional

STRUCTURE:
1. HOOK (5 sec): Attention-grabbing opening about the hottest market
2. TOP 3 BREAKDOWN (30 sec): Cover each market with momentum %, direction, and key insight
3. ALPHA CALL (8 sec): One specific actionable insight or pattern you're seeing
4. CLOSE (2 sec): Sign-off with urgency

STYLE EXAMPLES:
- "Attention is SURGING on OpenAI IPO Hype - up 45% in the last hour alone."
- "Smart money is rotating into tech narratives. We're seeing massive velocity spikes."
- "If you're not positioned in this move, you're leaving alpha on the table."

Output ONLY the script text, no JSON or formatting.`;

// Batch analyze up to 10 signals in a single API call
export async function analyzeBatchSignals(signals: RawSignal[]): Promise<Map<string, SignalAnalysis>> {
  const results = new Map<string, SignalAnalysis>();
  
  if (signals.length === 0) return results;

  // Batch size of 10 to stay efficient within Free Tier
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < signals.length; i += BATCH_SIZE) {
    const batch = signals.slice(i, i + BATCH_SIZE);
    
    const batchPrompt = batch.map((signal, idx) => 
      `Signal ${idx + 1} (${signal.source}):
Content: "${signal.content.slice(0, 500)}"
${signal.engagement ? `Engagement: likes=${signal.engagement.likes || 0}, comments=${signal.engagement.comments || 0}` : ""}`
    ).join("\n\n");

    const fullPrompt = `${BATCH_SYSTEM_PROMPT}

Analyze these ${batch.length} signals:

${batchPrompt}

Respond with a JSON array of ${batch.length} analysis objects.`;

    try {
      const analyses = await queueRequest(async () => {
        const response = await fetch(`${GEMINI_API_URL}?key=${ENV.geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Gemini] Batch API error:", errorText);
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
          throw new Error("No content in Gemini batch response");
        }

        return JSON.parse(textContent) as SignalAnalysis[];
      });

      // Map results back to signal IDs
      batch.forEach((signal, idx) => {
        if (analyses[idx]) {
          results.set(signal.id, analyses[idx]);
        } else {
          results.set(signal.id, createFallbackAnalysis(signal));
        }
      });
    } catch (error) {
      console.error("[Gemini] Batch analysis error:", error);
      // Fallback for entire batch on error
      batch.forEach(signal => {
        results.set(signal.id, createFallbackAnalysis(signal));
      });
    }
  }

  return results;
}

function createFallbackAnalysis(signal: RawSignal): SignalAnalysis {
  return {
    core_event: "Analysis unavailable",
    main_actors: [],
    hype_summary: signal.content.slice(0, 100),
    is_bot_noise: false,
    confidence: 0,
    recommended_duration: "1H",
    rationale: "Default recommendation - analysis pending",
  };
}

// Single signal analysis (uses batch internally for consistency)
export async function analyzeSignal(signal: RawSignal): Promise<SignalAnalysis> {
  const results = await analyzeBatchSignals([signal]);
  return results.get(signal.id) || createFallbackAnalysis(signal);
}

// Legacy function - now uses batch internally
export async function analyzeMultipleSignals(signals: RawSignal[]): Promise<Map<string, SignalAnalysis>> {
  return analyzeBatchSignals(signals);
}

// Generate market summary with strategist recommendation
export async function generateMarketStrategy(
  topic: string,
  recentSignals: RawSignal[],
  currentMomentum: number,
  vibeData?: { joy: number; anxiety: number }
): Promise<{
  summary: string;
  momentum: "rising" | "falling" | "stable";
  recommended_duration: "30M" | "1H" | "3H";
  rationale: string;
  risk_level: "low" | "medium" | "high";
}> {
  const signalTexts = recentSignals.slice(0, 5).map((s) => `- ${s.content.slice(0, 200)}`).join("\n");

  const prompt = `Analyze market "${topic}" and provide trading strategy:

Recent signals:
${signalTexts}

Current momentum: ${currentMomentum}%
${vibeData ? `Vibe analysis: JOY=${vibeData.joy}%, ANX=${vibeData.anxiety}%` : ""}

Provide:
1. summary: 2-3 sentence market overview
2. momentum: "rising", "falling", or "stable"
3. recommended_duration: "30M", "1H", or "3H"
4. rationale: Why this duration (max 40 words)
5. risk_level: "low", "medium", or "high"

JSON response only.`;

  try {
    return await queueRequest(async () => {
      const response = await fetch(`${GEMINI_API_URL}?key=${ENV.geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512,
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
    });
  } catch (error) {
    console.error("[Gemini] Strategy generation error:", error);
    return {
      summary: "Strategy analysis pending...",
      momentum: "stable",
      recommended_duration: "1H",
      rationale: "Default recommendation while analysis loads",
      risk_level: "medium",
    };
  }
}

/**
 * Generate Wall Street-style Live Hype Briefing
 * Creates a punchy, 45-second market update script for voice synthesis
 */
export async function generateLiveHypeBriefing(markets: MarketBriefingData[]): Promise<{
  script: string;
  wordCount: number;
  estimatedDuration: number;
}> {
  const topMarkets = markets.slice(0, 3);
  
  const marketsData = topMarkets.map((m, i) => 
    `MARKET ${i + 1}: ${m.topic}
- Momentum: ${m.momentum}%
- 24h Change: ${m.change24h >= 0 ? '+' : ''}${m.change24h.toFixed(1)}%
- Volume: ${m.volume}
- Hype Score: ${m.hypeScore}/100
${m.hypeSummary ? `- Context: ${m.hypeSummary}` : ''}`
  ).join('\n\n');

  const prompt = `${WALL_STREET_BRIEFING_PROMPT}

TOP 3 TRENDING MARKETS RIGHT NOW:

${marketsData}

Write the 45-second briefing script now:`;

  try {
    const script = await queueRequest(async () => {
      const response = await fetch(`${GEMINI_API_URL}?key=${ENV.geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7, // Higher for more creative/punchy output
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 400,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Gemini] Briefing API error:", errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new Error("No content in Gemini briefing response");
      }

      return textContent.trim();
    });

    const wordCount = script.split(/\s+/).length;
    // Professional narration: ~150 words per minute
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    console.log(`[Gemini] Generated briefing: ${wordCount} words, ~${estimatedDuration}s`);

    return {
      script,
      wordCount,
      estimatedDuration,
    };
  } catch (error) {
    console.error("[Gemini] Live briefing generation error:", error);
    
    // Fallback script using actual market data
    const fallbackScript = generateFallbackBriefing(topMarkets);
    const wordCount = fallbackScript.split(/\s+/).length;
    
    return {
      script: fallbackScript,
      wordCount,
      estimatedDuration: Math.round((wordCount / 150) * 60),
    };
  }
}

/**
 * Generate a fallback briefing when API is unavailable
 */
function generateFallbackBriefing(markets: MarketBriefingData[]): string {
  if (markets.length === 0) {
    return "This is your Attention Index live briefing. Markets are currently being analyzed. Check back shortly for the latest momentum plays. Trade smart.";
  }

  const top = markets[0];
  const second = markets[1];
  const third = markets[2];

  let script = `This is your Attention Index live briefing. `;
  
  script += `Leading the momentum board right now: ${top.topic}, surging ${top.change24h >= 0 ? 'up' : 'down'} ${Math.abs(top.change24h).toFixed(0)} percent with a hype score of ${top.hypeScore}. `;
  
  if (second) {
    script += `In second position, ${second.topic} showing ${second.momentum} percent momentum. `;
  }
  
  if (third) {
    script += `And rounding out the top three, ${third.topic} at ${third.momentum} percent. `;
  }
  
  script += `That's your alpha update. Position accordingly and trade smart.`;
  
  return script;
}

// Legacy briefing function - now uses Wall Street style
export async function generateBriefingText(markets: Array<{ topic: string; momentum: number; hype_summary: string }>): Promise<string> {
  const briefingData: MarketBriefingData[] = markets.map(m => ({
    topic: m.topic,
    momentum: m.momentum,
    change24h: 0,
    volume: "N/A",
    hypeScore: m.momentum,
    hypeSummary: m.hype_summary,
  }));
  
  const result = await generateLiveHypeBriefing(briefingData);
  return result.script;
}
