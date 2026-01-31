import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

/**
 * Validate that the API keys are properly configured and functional
 * by making lightweight API calls to each service.
 */

describe("API Key Validation", () => {
  it("validates GEMINI_API_KEY is set and functional", async () => {
    expect(ENV.geminiApiKey).toBeTruthy();
    expect(ENV.geminiApiKey.length).toBeGreaterThan(10);
    
    // Make a lightweight API call to validate the key
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${ENV.geminiApiKey}`
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.models).toBeDefined();
  });

  it("validates HUME_API_KEY is set and functional", async () => {
    expect(ENV.humeApiKey).toBeTruthy();
    expect(ENV.humeApiKey.length).toBeGreaterThan(10);
    
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
  });

  it("validates ELEVENLABS_API_KEY is set and functional", async () => {
    expect(ENV.elevenLabsApiKey).toBeTruthy();
    expect(ENV.elevenLabsApiKey.length).toBeGreaterThan(10);
    
    // Make a lightweight API call to validate the key
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: {
        "xi-api-key": ENV.elevenLabsApiKey,
      },
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.subscription).toBeDefined();
  });
});
