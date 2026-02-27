# Security Fixes — 27. februar 2026

Branch: `fix/security-review-feb27`

## Fikset (alle 🔴 kritiske)

### 1. `/api/chat/send` — Rate limiting + createAdminClient
- Lagt til IP-basert rate limiting (10 req/min)
- Byttet fra anon-key singleton (`lib/supabase.ts`) til `createAdminClient()`

### 2. `/api/chat/create` — Rate limiting + createAdminClient
- Lagt til IP-basert rate limiting (5 req/min)
- Byttet til `createAdminClient()`

### 3. `/api/sync-calendar` — CRON_SECRET-sjekk
- Lagt til `Authorization: Bearer <CRON_SECRET>` sjekk (samme pattern som `/api/cron/upsell`)

### 4. `lib/supabase.ts` — Opprydding
- Alle 4 consumers (`chat/send`, `chat/create`, `chat/reply`, `chat/[id]`) er migrert til `createAdminClient()`
- `lib/supabase.ts` er nå ubrukt og kan fjernes (beholdt for å unngå breaking changes)

### 5. `/api/chat/reply` — Ekte admin-auth
- Byttet fra enkel cookie-sjekk til `requireAdminSession()` fra `lib/admin-auth.ts`
- Validerer nå token mot DB + krever MFA

### 6. RLS-policies
- Ny migrasjon: `012_enable_rls_policies.sql`
- Aktiverer RLS på: `properties`, `organizations`, `bookings`, `guest_sessions`, `goconcierge_messages`, `chats`, `messages`
- Org-scoped policies for authenticated users
- Open read/insert for `chats`/`messages` (public support chat)

### 7. GDPR-endpoints — Kolonnenavn-bug
- `gdpr/export-guest` og `gdpr/delete-guest`: `organization_id` → `org_id` (matcher resten av kodebasen)

## Ny fil
- `lib/rate-limit.ts` — In-memory IP-basert rate limiter med auto-cleanup

## Notater
- Rate limiter er in-memory — ved multi-instance deploy bør den byttes til Redis
- RLS-policies bruker `auth.jwt() ->> 'org_id'` — verifiser at JWT custom claims inkluderer `org_id`
- `lib/supabase.ts` singleton-filen har ingen importører lenger, kan trygt slettes
