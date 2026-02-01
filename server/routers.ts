import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { analyzeSignal, analyzeBatchSignals, generateMarketStrategy, generateBriefingText, generateLiveHypeBriefing, type RawSignal, type MarketBriefingData } from "./services/gemini";
import { analyzeMarketVibe, analyzeTextVibe, generateVibeAlert } from "./services/hume";
import { generateAlphaBriefing, generateLiveHypeBriefing as generateAudioBriefing, type MarketBriefing, type VoiceOption, getVoiceOptions } from "./services/elevenlabs";

// Market selection schema
const marketSelectionSchema = z.object({
  marketId: z.string(),
  topic: z.string(),
  category: z.string(),
  momentum: z.number(),
  change24h: z.number(),
  volume: z.string(),
  hypeScore: z.number(),
  direction: z.enum(["long", "short"]),
  duration: z.enum(["30m", "1h", "3h"]),
  amount: z.number().min(1),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Trading Router
  trading: router({
    // Select a market for trading
    selectMarket: publicProcedure
      .input(
        z.object({
          marketId: z.string(),
          topic: z.string(),
          category: z.string(),
          momentum: z.number(),
          change24h: z.number(),
          volume: z.string(),
          hypeScore: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        // Log the market selection
        console.log(`[Trading] Market selected: ${input.topic} (${input.marketId})`);
        
        // Return confirmation with market details
        return {
          success: true,
          message: `Market "${input.topic}" selected for trading`,
          market: {
            id: input.marketId,
            topic: input.topic,
            category: input.category,
            momentum: input.momentum,
            change24h: input.change24h,
            volume: input.volume,
            hypeScore: input.hypeScore,
          },
          timestamp: Date.now(),
        };
      }),

    // Place a trade on a selected market
    placeTrade: publicProcedure
      .input(marketSelectionSchema)
      .mutation(async ({ input }) => {
        // Log the trade
        console.log(`[Trading] Trade placed: ${input.direction.toUpperCase()} ${input.amount} USDC on ${input.topic} (${input.duration})`);
        
        // Calculate estimated return based on momentum and direction
        const baseReturn = input.direction === "long" 
          ? input.momentum * 0.01 
          : (100 - input.momentum) * 0.01;
        const estimatedReturn = input.amount * (1 + baseReturn);
        
        // Generate a mock trade ID
        const tradeId = `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        return {
          success: true,
          tradeId,
          message: `Trade placed successfully`,
          details: {
            marketId: input.marketId,
            topic: input.topic,
            direction: input.direction,
            duration: input.duration,
            amount: input.amount,
            estimatedReturn: Math.round(estimatedReturn * 100) / 100,
            expiresAt: Date.now() + (input.duration === "30m" ? 30 * 60 * 1000 : input.duration === "1h" ? 60 * 60 * 1000 : 3 * 60 * 60 * 1000),
          },
          timestamp: Date.now(),
        };
      }),
  }),

  // AI Services Router
  ai: router({
    // Gemini: Analyze a single signal with combined Filter+Strategist output
    analyzeSignal: publicProcedure
      .input(
        z.object({
          id: z.string(),
          source: z.enum(["twitter", "reddit", "hackernews", "news"]),
          content: z.string(),
          timestamp: z.number(),
          engagement: z
            .object({
              likes: z.number().optional(),
              retweets: z.number().optional(),
              comments: z.number().optional(),
            })
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const analysis = await analyzeSignal(input as RawSignal);
        return analysis;
      }),

    // Gemini: Batch analyze signals (10 per API call for Free Tier efficiency)
    analyzeBatchSignals: publicProcedure
      .input(
        z.object({
          signals: z.array(
            z.object({
              id: z.string(),
              source: z.enum(["twitter", "reddit", "hackernews", "news"]),
              content: z.string(),
              timestamp: z.number(),
              engagement: z
                .object({
                  likes: z.number().optional(),
                  retweets: z.number().optional(),
                  comments: z.number().optional(),
                })
                .optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results = await analyzeBatchSignals(input.signals as RawSignal[]);
        // Convert Map to array of [id, analysis] pairs for JSON serialization
        return Array.from(results.entries()).map(([id, analysis]) => ({
          signalId: id,
          ...analysis,
        }));
      }),

    // Gemini: Generate market strategy with combined analysis
    generateMarketStrategy: publicProcedure
      .input(
        z.object({
          topic: z.string(),
          signals: z.array(
            z.object({
              id: z.string(),
              source: z.enum(["twitter", "reddit", "hackernews", "news"]),
              content: z.string(),
              timestamp: z.number(),
            })
          ),
          currentMomentum: z.number(),
          vibeData: z.object({
            joy: z.number(),
            anxiety: z.number(),
          }).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const strategy = await generateMarketStrategy(
          input.topic,
          input.signals as RawSignal[],
          input.currentMomentum,
          input.vibeData
        );
        return strategy;
      }),

    // Gemini: Generate briefing text for ElevenLabs
    generateBriefingText: publicProcedure
      .input(
        z.object({
          markets: z.array(
            z.object({
              topic: z.string(),
              momentum: z.number(),
              hype_summary: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const text = await generateBriefingText(input.markets);
        return { text };
      }),

    // Hume: Analyze vibe/sentiment from text
    analyzeVibe: publicProcedure
      .input(
        z.object({
          text: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const vibe = await analyzeTextVibe(input.text);
        const alert = generateVibeAlert(vibe);
        return { vibe, alert };
      }),

    // Hume: Full market vibe analysis
    analyzeMarketVibe: publicProcedure
      .input(
        z.object({
          hypeSummary: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await analyzeMarketVibe(input.hypeSummary);
        return result;
      }),

    // ElevenLabs: Generate audio briefing (legacy)
    generateAudioBriefing: publicProcedure
      .input(
        z.object({
          markets: z.array(
            z.object({
              topic: z.string(),
              momentum: z.number(),
              change24h: z.number(),
              hypeSummary: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const briefing = await generateAlphaBriefing(input.markets as MarketBriefing[]);
        return briefing;
      }),

    // Live Hype Briefing: Gemini script + ElevenLabs voice
    generateLiveHypeBriefing: publicProcedure
      .input(
        z.object({
          markets: z.array(
            z.object({
              topic: z.string(),
              momentum: z.number(),
              change24h: z.number(),
              volume: z.string(),
              hypeScore: z.number(),
              hypeSummary: z.string().optional(),
            })
          ),
          voice: z.enum(["bill", "charlotte", "rachel", "adam", "josh"]).optional().default("bill"),
        })
      )
      .mutation(async ({ input }) => {
        const startTime = Date.now();
        
        try {
          // Step 1: Generate Wall Street-style script using Gemini
          console.log("[LiveHypeBriefing] Generating script with Gemini...");
          const scriptResult = await generateLiveHypeBriefing(input.markets as MarketBriefingData[]);
          
          // Step 2: Convert script to speech using ElevenLabs Flash v2.5
          console.log(`[LiveHypeBriefing] Converting to speech with voice: ${input.voice}...`);
          const audioResult = await generateAudioBriefing(scriptResult.script, input.voice as VoiceOption);
          
          const totalTime = Date.now() - startTime;
          console.log(`[LiveHypeBriefing] Complete in ${totalTime}ms`);
          
          return {
            script: scriptResult.script,
            wordCount: scriptResult.wordCount,
            estimatedDuration: scriptResult.estimatedDuration,
            audioUrl: audioResult.audioUrl,
            audioBase64: audioResult.audioBase64,
            model: audioResult.model,
            voice: audioResult.voice,
            generationTimeMs: totalTime,
          };
        } catch (error: any) {
          console.error("[LiveHypeBriefing] Error:", error.message || error);
          throw new Error(`Failed to generate briefing: ${error.message || 'Network error. Please try again.'}`);
        }
      }),

    // Get available voice options
    getVoiceOptions: publicProcedure.query(() => {
      return getVoiceOptions();
    }),
  }),
});

export type AppRouter = typeof appRouter;
