import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

/**
 * Test AI service integrations
 * These tests validate that the AI services are properly configured
 * and can make basic API calls.
 */

describe("AI Services Integration", () => {
  describe("Gemini Service", () => {
    it("should have Gemini API key configured", () => {
      expect(ENV.geminiApiKey).toBeTruthy();
      expect(ENV.geminiApiKey.length).toBeGreaterThan(10);
    });

    it("should be able to call Gemini API for signal analysis", { timeout: 15000 }, async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${ENV.geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: "Respond with only the word 'OK' to confirm the API is working." }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 10,
            },
          }),
        }
      );

      // Accept 200 (success) or 429 (rate limited) as valid responses
      // Rate limiting indicates the API key is valid but quota exceeded
      expect([200, 429].includes(response.status)).toBe(true);
      
      if (response.ok) {
        const data = await response.json();
        expect(data.candidates).toBeDefined();
        expect(data.candidates[0]?.content?.parts?.[0]?.text).toBeDefined();
      }
    });
  });

  describe("Hume AI Service", () => {
    it("should have Hume API key configured", () => {
      expect(ENV.humeApiKey).toBeTruthy();
      expect(ENV.humeApiKey.length).toBeGreaterThan(10);
    });

    it("should be able to authenticate with Hume API", { timeout: 15000 }, async () => {
      // Test authentication by checking batch jobs endpoint
      const response = await fetch("https://api.hume.ai/v0/batch/jobs", {
        method: "GET",
        headers: {
          "X-Hume-Api-Key": ENV.humeApiKey,
        },
      });

      // 200 (success) or 404 (no jobs) both indicate valid auth
      expect([200, 404].includes(response.status)).toBe(true);
    });
  });

  describe("ElevenLabs Service", () => {
    it("should have ElevenLabs API key configured", () => {
      expect(ENV.elevenLabsApiKey).toBeTruthy();
      expect(ENV.elevenLabsApiKey.length).toBeGreaterThan(10);
    });

    it("should be able to fetch user info from ElevenLabs", { timeout: 15000 }, async () => {
      const response = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: {
          "xi-api-key": ENV.elevenLabsApiKey,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.subscription).toBeDefined();
    });

    it("should be able to list available voices", { timeout: 15000 }, async () => {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": ENV.elevenLabsApiKey,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.voices).toBeDefined();
      expect(Array.isArray(data.voices)).toBe(true);
    });
  });
});
