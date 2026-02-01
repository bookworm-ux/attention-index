# Attention Index - AI Integration TODO

## Completed Features
- [x] Basic homepage layout with Neo-Brutalist Terminal design
- [x] Navigation with category tabs (Trending, Alpha, Crypto, Tech, Culture)
- [x] Market Cards with Velocity Sparklines
- [x] Ticker Wall showing Live Momentum Markets
- [x] Trade Sidebar with short-window contracts (30m, 1h, 3h)
- [x] Hype Score meter
- [x] Oracle Feed with social signal aggregation
- [x] Upgrade to full-stack with database and user management

## AI Integration Features
- [x] Gemini Data Pipeline: Filter live signals to extract core_event, main_actors, hype_summary
- [x] Hume AI Vibe Analysis: Add radar charts with Joy/Anxiety scores to market cards
- [x] Volatility Alert: Pulsing red indicator when Anxiety > 70%
- [x] Momentum Pump: Pulsing green indicator when Joy > 70%
- [x] ElevenLabs Audio Narrative: Live Alpha Briefing button for top 3 markets summary

## Bug Fixes
- [x] Fix Select Market button - add backend POST endpoint and frontend handler
- [x] Fix Radar Chart: Clamp JOY/ANX values at 100% and scale chart properly
- [x] Fix Radar Chart label overlap: Add padding between labels and chart area
- [x] Fix Radar Chart size: Maximize visual impact with better scaling and asymmetric padding

## AI Pipeline Optimization
- [x] Gemini: Batch signals (10 per API call) to stay within 15 RPM Free Tier limit
- [x] Gemini: Combined Filter+Strategist output (core_event, hype_summary, recommended_duration, rationale)
- [x] Alerts: Update thresholds - ANX>75% Volatility Trap, JOY>80% Hype Train
- [x] UI: Add Strategist box with 'Scanning...' animation
- [x] ElevenLabs: Optimize for low latency with Flash v2.5 model

## Live Hype Briefing Feature
- [x] Backend: Gemini 1.5 Flash function for Wall Street-style 45-second market briefing
- [x] ElevenLabs: Professional news anchor voice (Bill or Charlotte) with Flash v2.5
- [x] UI: Listen to Alpha button with volume icon in header
- [x] UI: Audio waveform animation during playback

## Alpha Briefing Finalization
- [x] Update ElevenLabs with custom Voice ID 6EW6z8IiJRtePnNUNPKW
- [x] Configure Flash v2.5 model with Stability 40%, Similarity 60%
- [x] Add 'Generating Audio...' spinner to button
- [x] Add pulsing green waveform icon during playback
