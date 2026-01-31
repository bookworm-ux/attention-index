import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Test trading endpoints
 * These tests validate the market selection and trade placement functionality
 */

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Trading Endpoints", () => {
  describe("trading.selectMarket", () => {
    it("should successfully select a market", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.trading.selectMarket({
        marketId: "test-market-1",
        topic: "OpenAI IPO Hype",
        category: "Tech",
        momentum: 94,
        change24h: 45.2,
        volume: "$1.2M",
        hypeScore: 98,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("OpenAI IPO Hype");
      expect(result.market.id).toBe("test-market-1");
      expect(result.market.topic).toBe("OpenAI IPO Hype");
      expect(result.timestamp).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it("should return correct market details", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const input = {
        marketId: "market-123",
        topic: "Bitcoin ETF Flows",
        category: "Crypto",
        momentum: 65,
        change24h: -8.3,
        volume: "$2.1M",
        hypeScore: 58,
      };

      const result = await caller.trading.selectMarket(input);

      expect(result.market).toEqual({
        id: input.marketId,
        topic: input.topic,
        category: input.category,
        momentum: input.momentum,
        change24h: input.change24h,
        volume: input.volume,
        hypeScore: input.hypeScore,
      });
    });
  });

  describe("trading.placeTrade", () => {
    it("should successfully place a long trade", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.trading.placeTrade({
        marketId: "test-market-1",
        topic: "OpenAI IPO Hype",
        category: "Tech",
        momentum: 94,
        change24h: 45.2,
        volume: "$1.2M",
        hypeScore: 98,
        direction: "long",
        duration: "1h",
        amount: 100,
      });

      expect(result.success).toBe(true);
      expect(result.tradeId).toBeDefined();
      expect(result.tradeId).toMatch(/^TRD-/);
      expect(result.details.direction).toBe("long");
      expect(result.details.duration).toBe("1h");
      expect(result.details.amount).toBe(100);
      expect(result.details.estimatedReturn).toBeGreaterThan(0);
    });

    it("should successfully place a short trade", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.trading.placeTrade({
        marketId: "test-market-2",
        topic: "Bitcoin ETF Flows",
        category: "Crypto",
        momentum: 65,
        change24h: -8.3,
        volume: "$2.1M",
        hypeScore: 58,
        direction: "short",
        duration: "30m",
        amount: 50,
      });

      expect(result.success).toBe(true);
      expect(result.details.direction).toBe("short");
      expect(result.details.duration).toBe("30m");
      expect(result.details.amount).toBe(50);
    });

    it("should calculate correct expiration time for different durations", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const baseInput = {
        marketId: "test-market",
        topic: "Test Market",
        category: "Tech",
        momentum: 50,
        change24h: 0,
        volume: "$100K",
        hypeScore: 50,
        direction: "long" as const,
        amount: 100,
      };

      // Test 30m duration
      const result30m = await caller.trading.placeTrade({ ...baseInput, duration: "30m" });
      const expectedExpiry30m = result30m.timestamp + 30 * 60 * 1000;
      expect(result30m.details.expiresAt).toBeCloseTo(expectedExpiry30m, -3);

      // Test 1h duration
      const result1h = await caller.trading.placeTrade({ ...baseInput, duration: "1h" });
      const expectedExpiry1h = result1h.timestamp + 60 * 60 * 1000;
      expect(result1h.details.expiresAt).toBeCloseTo(expectedExpiry1h, -3);

      // Test 3h duration
      const result3h = await caller.trading.placeTrade({ ...baseInput, duration: "3h" });
      const expectedExpiry3h = result3h.timestamp + 3 * 60 * 60 * 1000;
      expect(result3h.details.expiresAt).toBeCloseTo(expectedExpiry3h, -3);
    });
  });
});
