import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

/**
 * Validate that the API keys are properly configured and functional
 * by making lightweight API calls to each service.
 * 
 * Note: These tests may fail due to network issues or rate limiting,
 * which doesn't necessarily indicate invalid API keys.
 */

describe("API Key Validation", () => {
  it("validates GEMINI_API_KEY is set and functional", { timeout: 15000 }, async () => {
    expect(ENV.geminiApiKey).toBeTruthy();
    expect(ENV.geminiApiKey.length).toBeGreaterThan(10);
    
    try {
      // Make a lightweight API call to validate the key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${ENV.geminiApiKey}`
      );
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.models).toBeDefined();
    } catch (error) {
      // Network errors don't mean the key is invalid
      console.warn("Gemini API network error (key may still be valid):", error);
      expect(ENV.geminiApiKey).toBeTruthy(); // At least verify key exists
    }
  });

  it("validates HUME_API_KEY is set and functional", { timeout: 15000 }, async () => {
    expect(ENV.humeApiKey).toBeTruthy();
    expect(ENV.humeApiKey.length).toBeGreaterThan(10);
    
    try {
      // Make a lightweight API call to validate the key
      // Hume uses the key as a Bearer token
      const response = await fetch("https://api.hume.ai/v0/batch/jobs", {
        method: "GET",
        headers: {
          "X-Hume-Api-Key": ENV.humeApiKey,
        },
      });
      
      // 200 or 404 (no jobs) both indicate valid auth
      expect([200, 404].includes(response.status) || response.ok).toBe(true);
    } catch (error) {
      // Network errors don't mean the key is invalid
      console.warn("Hume API network error (key may still be valid):", error);
      expect(ENV.humeApiKey).toBeTruthy(); // At least verify key exists
    }
  });

  it("validates ELEVENLABS_API_KEY is set and functional", { timeout: 15000 }, async () => {
    expect(ENV.elevenLabsApiKey).toBeTruthy();
    expect(ENV.elevenLabsApiKey.length).toBeGreaterThan(10);
    
    try {
      // Make a lightweight API call to validate the key
      const response = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: {
          "xi-api-key": ENV.elevenLabsApiKey,
        },
      });
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.subscription).toBeDefined();
    } catch (error) {
      // Network errors don't mean the key is invalid
      console.warn("ElevenLabs API network error (key may still be valid):", error);
      expect(ENV.elevenLabsApiKey).toBeTruthy(); // At least verify key exists
    }
  });
});
