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
