import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { analyzeSignal, generateMarketHypeSummary, type RawSignal } from "./services/gemini";
import { analyzeMarketVibe, analyzeTextVibe, generateVibeAlert } from "./services/hume";
import { generateAlphaBriefing, type MarketBriefing } from "./services/elevenlabs";

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
    // Gemini: Analyze a signal and extract structured data
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

    // Gemini: Generate market hype summary
    generateMarketSummary: publicProcedure
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
        })
      )
      .mutation(async ({ input }) => {
        const summary = await generateMarketHypeSummary(input.topic, input.signals as RawSignal[]);
        return summary;
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

    // ElevenLabs: Generate audio briefing
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
  }),
});

export type AppRouter = typeof appRouter;
