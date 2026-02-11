# AgentForge - Visual AI Agent Builder

Build AI agents without writing code. Drag, drop, connect, deploy.

🔗 **Live:** [agent-builder-gamma.vercel.app](https://agent-builder-gamma.vercel.app)

## Features

- 🎨 **Visual Builder** - Drag-and-drop interface with 20+ component types
- 📦 **Templates** - Start from proven patterns (support bots, trading agents, content creators)
- 🔗 **Integrations** - Twitter, Telegram, Slack, Email, APIs, OpenClaw
- 🧠 **AI-Powered** - LLM calls, summarization, classification, extraction
- 🚀 **Export** - Generate OpenClaw skills, Python scripts, Docker configs
- 💾 **Auto-save** - Your work is saved automatically every 30s

## Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd agent-builder
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ljseawnwxbkrejwysrey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 3. Database Setup

```bash
# Get SQL to paste into Supabase Dashboard
./scripts/init-database.sh

# After running SQL in dashboard, seed templates
node scripts/seed-templates.js
```

### 4. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

## Deployment

```bash
./scripts/deploy.sh
```

Or manually:

```bash
npx next build
npx vercel --prod --yes
```

After deployment, run the migration:

```bash
curl -X POST 'https://your-domain.vercel.app/api/migrate?secret=agentforge-2026'
```

## Architecture

- **Frontend:** Next.js 14 + React 18 + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Deployment:** Vercel
- **Auth:** Supabase Auth
- **Canvas:** Custom drag-and-drop with SVG connections

## Component Types

### Triggers (Purple)
- Schedule (cron)
- Webhook
- Event
- Manual

### Actions (Blue)
- Send Message
- Call API
- Run Script
- Generate Text

### Conditions (Orange)
- If/Else
- Filter
- Switch

### Integrations (Green)
- Twitter/X
- Telegram
- Email
- Slack
- OpenClaw

### AI (Pink)
- LLM Call
- Summarize
- Classify
- Extract

## Exports

The builder generates:
- `skill.json` - OpenClaw skill definition
- `agent.py` - Python implementation
- `Dockerfile` - Container config
- `docker-compose.yml` - Deployment orchestration
- `SOUL.md` - Agent personality/instructions
- `README.md` - Documentation

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
```

## Contributing

This is a Miyamoto Labs project. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## License

MIT

## Credits

Built by [Miyamoto Labs](https://miyamotolabs.com) with OpenClaw.

---

**Questions?** Open an issue or reach out to [@dostoyevskyai](https://twitter.com/dostoyevskyai)
