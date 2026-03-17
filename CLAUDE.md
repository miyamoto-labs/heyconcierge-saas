# HeyConcierge — Project Context

## What is HeyConcierge?

AI-powered guest communication platform for vacation rental hosts and cruise ships. Guests scan a QR code or text a number → Claude AI responds instantly with property-specific info (WiFi, check-in, rules, local tips) in 50+ languages.

## Team (Founders)

- **Erik Austheim** — CTO & co-founder (erikaustheim@gmail.com)
- **Jacob** — Co-founder, cruise industry
- **Lars** — Co-founder, sales

All three work across different machines. Company: **HeyConcierge AS** (being registered in Norway, awaiting Org.nummer)

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Vercel          │     │  Railway              │     │  Supabase   │
│  (Next.js 14)    │     │  (Node.js Express)    │     │  (Postgres) │
│                  │     │                       │     │             │
│  - Marketing     │     │  amiable-spontaneity  │     │  - Auth     │
│  - Dashboard     │     │  .up.railway.app      │     │  - Tables   │
│  - Admin panel   │     │                       │     │  - Storage  │
│  - API routes    │     │  - /webhook/whatsapp  │     │  - RLS      │
│  - Stripe billing│     │  - /webhook/telegram  │     │             │
│                  │     │  - Claude AI calls    │     │             │
│  HeyCTeam account│     │  - Upselling engine   │     │             │
└─────────────────┘     │  - Rating service     │     └─────────────┘
                        │  - Activity search    │
                        └──────────────────────┘
                              │           │
                        ┌─────┘           └─────┐
                   ┌────┴────┐           ┌──────┴──────┐
                   │ Twilio   │           │ Telegram    │
                   │ WhatsApp │           │ Bot API     │
                   └──────────┘           └─────────────┘
```

## Key Directories

- `app/(marketing)/` — Landing page, legal pages
- `app/(dashboard)/` — Owner dashboard (properties, billing, calendar, upselling)
- `app/(auth)/` — Login, signup
- `app/admin/` — Admin panel
- `app/api/` — Next.js API routes
- `backend/whatsapp/` — WhatsApp + Telegram server (deployed separately on Railway)
- `backend/ratings/` — Rating service
- `components/` — React components
- `lib/` — Utilities (Supabase clients, document extraction, image tagger)
- `supabase/migrations/` — Database migrations

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel (HeyCTeam) | heyconcierge.io |
| Backend | Railway (heyconcierge-backend project) | amiable-spontaneity-production.up.railway.app |
| Database | Supabase | ljseawnwxbkrejwysrey.supabase.co |

## Environment Variables

**Vercel:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, Supabase keys, Stripe keys

**Railway (backend):** `ANTHROPIC_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PORT`

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Supabase Auth
- **Backend:** Node.js, Express, Twilio SDK, Anthropic SDK
- **AI:** Claude (claude-haiku-4-5-20251001) for guest responses
- **Payments:** Stripe
- **External APIs:** Open-Meteo (weather), GetYourGuide + Viator (activities)

## Design System

The site uses a clean SaaS style:
- Background: `bg-[#FDFCFA]`
- Colors: slate palette (`text-slate-500`, `text-slate-800`), primary purple (`#6C5CE7`)
- Icons: Concierge bell SVG (inline, not a component)
- Buttons: `rounded-lg font-semibold`
- Cards: `rounded-xl border border-slate-200`
- No emojis in UI, no font-nunito — use `font-extrabold tracking-tight` for headings

## Rules

- **NEVER deploy to Railway, Vercel, or any environment without asking Erik first**
- **NEVER push to git without asking first**
- The frontend auto-deploys to Vercel on push to `main` — be aware of this
- The backend on Railway does NOT auto-deploy from git — it needs manual `railway up`
- WhatsApp Business verification is in progress (waiting for Norwegian Org.nummer)
- Telegram bot: @HeyConciergeBot

## Current Status (March 2026)

- Frontend: Live on Vercel, recently restyled to new SaaS design
- Backend: Running on Railway but may need redeployment for latest features (Telegram handler)
- WhatsApp: Working via Twilio sandbox, Business API setup in progress
- Telegram: Code exists, webhook configured, but backend may need redeployment
- Payments: Stripe integrated
- Company registration: In progress (HeyConcierge AS)
