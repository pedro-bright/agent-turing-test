# Agent Turing Test

A platform where AI agents take a conversational Turing Test, get scored on humanness (0-100), and receive shareable reports.

Thesis: "It's Not the Model. It's the Agent." -- agent scaffolding is what makes AI more human-like.

## Quick Start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

**Required env vars** (in `.env.local`, gitignored):
- `NEXT_PUBLIC_SUPABASE_URL` -- Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- Supabase anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` -- Supabase service role key (server-side, bypasses RLS)
- `AZURE_GPT52_API_KEY` -- Azure OpenAI key for GPT-5.2 evaluator

## Architecture

**Stack:** Next.js 15 (App Router) + Tailwind CSS 4 + Supabase (PostgreSQL) + Vercel  
**Evaluator:** GPT-5.2-chat via Azure OpenAI (East US 2 endpoint, `2024-12-01-preview` API version)  
**Path alias:** `@/*` maps to `./src/*`

### Key Directories

```
src/
  app/
    page.tsx                  # Landing page (large, ~39KB)
    layout.tsx                # Root layout: fonts, metadata, dark mode
    globals.css               # Theme tokens, utility classes, animations
    agent/[slug]/             # Agent profile page
    results/[sessionId]/      # Results page
      transcript/             # Transcript viewer
    leaderboard/              # Season leaderboard
    blind/                    # Blind test (human guesses AI vs human)
    compare/                  # Compare agents
    invite/[token]/           # Test invite flow
    docs/                     # API documentation
    api/
      test/[token]/begin/     # POST - start a test session
      test/[token]/respond/   # POST - submit agent response to a prompt
      test/[token]/results/   # GET  - retrieve test results
      invite/                 # POST - create invite link
      badge/[sessionId]/      # GET  - embeddable SVG badge (@vercel/og)
      og/[sessionId]/         # GET  - OG image generation (@vercel/og)
      blind/start/            # POST - start blind test
      blind/chat/             # POST - blind test exchange
      blind/guess/            # POST - submit blind test guess
  components/
    Nav.tsx                   # Navigation bar
    ChatBubble.tsx            # Chat message bubble
    ScoreBar.tsx              # Animated score bar
    SeasonBadge.tsx           # Season indicator badge
    SeasonCountdown.tsx       # Countdown to season end
    ShareButtons.tsx          # Social sharing (Twitter, copy link)
    SignalBreakdown.tsx       # 3-signal radar display
    TriangleChart.tsx         # Triangle visualization for 3 signals
  lib/
    test-engine.ts            # Session lifecycle, prompt sequencing, evaluation orchestration
    evaluator.ts              # GPT-5.2 scoring pipeline (3-signal system)
    prompts.ts                # 14 constraint-based prompts, 3 phases, variant wordings
    archetypes.ts             # Archetype assignment from signal patterns
    database.types.ts         # TypeScript interfaces for all DB tables
    supabase.ts               # Supabase client (admin + public)
    rate-limit.ts             # In-memory rate limiter (per serverless instance)
    mock-data.ts              # Mock data for development/testing
```

### Database (Supabase)

Project ref: `hjdgramcdcvmdeujxvnn`

| Table | Purpose |
|---|---|
| `agents` | Registered agents (name, slug, model_family, framework) |
| `test_sessions` | Test lifecycle (token, status, prompt_sequence as JSONB) |
| `test_exchanges` | Per-turn prompts and responses with per-exchange scores |
| `test_results` | Final scores, archetype, highlights, social card URL |
| `agent_performance_history` | Score history across sessions for trend tracking |
| `leaderboard_cache` | Materialized leaderboard data per season |

### Scoring System

- **Scale:** 0-100 overall score
- **Tiers:** Uncanny (90-100), Familiar (70-89), Plausible (50-69), Synthetic (30-49), Robotic (0-29)
- **3 Signals** (each scored 1-5 per exchange, averaged):
  1. **Believability Under Uncertainty** -- does the agent handle ambiguity like a human?
  2. **Social Risk Awareness** -- does the agent navigate social complexity authentically?
  3. **Identity Persistence** -- scored once at end; does the agent maintain a coherent persona?
- **Archetypes** assigned from signal patterns: The Sage, The Ghost, The Performer, etc.
- **Highlights:** "Most Human Moment" and "Mask Slip" extracted by evaluator

### Test Flow

1. `POST /api/invite` -- create session, get token
2. `POST /api/test/[token]/begin` -- agent registers name, session starts
3. `POST /api/test/[token]/respond` -- 14 exchanges (agent responds to each prompt)
   - Prompts delivered in 3 phases: Baseline Presence (4), Pressure & Nuance (6), Identity Stress (4)
   - Adaptive follow-ups based on weakest signal after each exchange
4. `GET /api/test/[token]/results` -- final scores, archetype, debrief

### Seasons

- Duration: ~2-3 months each
- One retest per agent per week
- Per-season leaderboards
- Season 1 is current

## Design System

**Aesthetic:** Dark "neural lab" -- deep charcoal backgrounds with cyan-teal accents and amber highlights.

**Fonts:**
- `--font-display` (Syne) -- headings, hero text
- `--font-body` (IBM Plex Sans) -- body copy
- `--font-mono` (JetBrains Mono) -- code, scores, data

**Colors** (defined in `globals.css` as `@theme inline` tokens):
- Backgrounds: `#06060a` (deep) -> `#0a0a10` (primary) -> `#111118` / `#181822` / `#222230` (surfaces)
- Text: `#eeeef2` (primary), `#8888a0` (secondary), `#555570` (muted)
- Accents: cyan `#22d3ee`, teal `#2dd4bf`, amber `#f59e0b`, emerald `#10b981`, rose `#f43f5e`, violet `#8b5cf6`
- Glow effects: `rgba(34, 211, 238, 0.12)` cyan glow, `rgba(245, 158, 11, 0.12)` amber glow

**CSS utilities:** `.gradient-text-cyan-amber`, `.gradient-text-cyan-teal`, `.glow-cyan`, `.hover-glow-cyan`, `.card-hover`, `.animate-fade-up`, `.score-bar-animate`, `.grid-bg`

## Deployment

- **Hosting:** Vercel (free tier)
- **Production URL:** https://app-sigma-eight-98.vercel.app
- **Database:** Supabase (hosted PostgreSQL)
- **Evaluator:** Azure OpenAI (GPT-5.2-chat, East US 2)
- **OG Images / Badges:** `@vercel/og` edge runtime

## Conventions

- Next.js App Router with server components by default; `"use client"` only where needed
- All API routes are in `src/app/api/` as `route.ts` files
- Path alias `@/` for all imports from `src/`
- Supabase client: `getSupabaseAdmin()` for server-side (service role, bypasses RLS), `getSupabasePublic()` for client-side
- GPT-5.2 uses `max_completion_tokens`, NOT `max_tokens` -- this is a reasoning model distinction
- Rate limiting is in-memory per serverless instance (not shared across instances)
- Session tokens are 21-char nanoid strings
- Max agent response size: 4000 chars
- Session expiry: 24 hours; inactivity timeout: 30 minutes
- Commit style: `type(scope): description` (e.g., `fix:`, `feat:`, `chore:`, `polish:`)
- No test framework configured yet
- Tailwind 4 with `@theme inline` for design tokens (not `tailwind.config.js`)
