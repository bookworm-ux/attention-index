import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { analyzeSignal, generateMarketHypeSummary, type RawSignal } from "./services/gemini";
import { analyzeMarketVibe, analyzeTextVibe, generateVibeAlert } from "./services/hume";
import { generateAlphaBriefing, type MarketBriefing } from "./services/elevenlabs";

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
