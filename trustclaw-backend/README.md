# TrustClaw Backend

Security-verified skill marketplace for OpenClaw. Every skill verified. Every agent secure.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Supabase account (free tier works)

### Setup

1. **Clone and install dependencies:**

```bash
cd trustclaw-backend
npm install
```

2. **Create a Supabase project:**

   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and keys

3. **Set up the database:**

   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL from `supabase/schema.sql`

4. **Configure environment:**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_WALLET=your-solana-wallet-address
```

5. **Run development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deploying to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/trustclaw-backend)

## 🏗️ Architecture

### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List verified skills (public) |
| GET | `/api/skills/[id]` | Get skill details |
| POST | `/api/skills/submit` | Submit a new skill |
| POST | `/api/skills/[id]/scan` | Trigger security scan |
| POST | `/api/skills/[id]/approve` | Admin approve (protected) |
| POST | `/api/skills/[id]/reject` | Admin reject (protected) |
| POST | `/api/skills/[id]/report` | Report a skill |
| GET | `/api/publishers/[wallet]` | Publisher profile |
| GET | `/api/admin/skills` | List all skills (admin) |
| GET | `/api/admin/stats` | Dashboard stats (admin) |

### Database Schema

- **publishers** - Skill publishers (wallet, GitHub, reputation)
- **skills** - Submitted skills with status tracking
- **scans** - Security scan results with findings
- **reviews** - Community reviews
- **reports** - Community reports for flagging

### Security Scanner

The scanner checks for:
- Shell command execution (exec, spawn, system)
- Credential file access (.env, .ssh, keys)
- External URL fetches to suspicious domains
- Obfuscated/minified code
- Known malicious patterns (miners, backdoors)

Results: `pass` | `warn` | `fail`

## 🔐 Admin Access

Protected routes require the `x-wallet-address` header matching the `ADMIN_WALLET` env var.

Access admin dashboard at `/admin` and authenticate with your wallet.

## 🎨 Brand Colors

- **TrustClaw Green:** `#00e87b`
- **Dark Background:** `#06080c`
- **Card Background:** `#0d1117`
- **Border:** `#1f2937`

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── skills/
│   │   ├── publishers/
│   │   └── admin/
│   ├── admin/            # Admin dashboard
│   ├── skills/           # Public skill browser
│   ├── submit/           # Skill submission
│   └── docs/             # Documentation
├── components/           # React components
├── lib/
│   ├── supabase.ts       # Supabase client
│   └── scanner.ts        # Security scanner
└── types/
    └── database.ts       # TypeScript types
```

## 🧪 Testing

```bash
npm run test
```

## 📄 License

MIT
