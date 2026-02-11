# TrustClaw Discord Outreach Templates

Authentic, value-focused messaging for the Clawd community. Use these as starting points, adapt to context.

---

## 1. Announcement Post (#general or #announcements)

**Subject:** Free Security Scanning for OpenClaw/Clawd Skills 🛡️

Hey everyone! 👋

We just launched **TrustClaw** — a free security scanner specifically for OpenClaw and Clawd skills.

**The problem:** As our skill marketplace grows, it's getting harder to know which skills are safe to install. Anyone can publish code, but not everyone has time to audit it.

**What we built:**
- Automated security scanning for skills (detects unsafe API calls, data exfiltration, suspicious patterns)
- Public scan results for every skill in the marketplace
- Free for skill creators and users — scan before you publish or install
- Website: https://trustclaw.xyz

**How it works:**
1. Submit your skill (GitHub URL or paste code)
2. Get instant scan results (pass/warn/fail)
3. Fix any issues, then publish with a verified badge

Think of it like VirusTotal for agent skills — helping everyone install safely while keeping bad actors out.

If you're building skills, run them through TrustClaw before publishing. If you're installing skills, check the scan results first.

Happy to answer questions! 🚀

---

## 2. Reply Template (When Someone Asks About Skill Security)

**Context:** Use when someone asks "Is this skill safe?" or "How do I know this won't steal my data?"

---

Great question! Security is a real concern as the marketplace grows.

If you want to check a skill before installing:

1. **Check TrustClaw** (https://trustclaw.xyz) — we scan every public skill for:
   - Unsafe API calls (network requests, file access, shell commands)
   - Data exfiltration patterns (sending your data to unknown servers)
   - Known malicious code signatures

2. **Read the skill source** — Skills are just code. Look at what it's importing and what APIs it calls. If you see `fetch()` to random domains or `exec()` running shell commands, ask why.

3. **Check the publisher** — Is this a known developer? Do they have other skills with good reviews?

4. **Start with read-only skills** — If you're unsure, stick to skills that only read data (weather, search, etc.) vs. ones that post/delete/modify things.

TrustClaw is free to use — you can scan any skill before installing. Not perfect, but it catches most obvious red flags.

---

## 3. DM Template (Inviting Skill Creators to List)

**Context:** Send to skill creators who have published on GitHub but not submitted to TrustClaw

---

**Subject:** Get Your Skill Verified on TrustClaw

Hey [Name]! 👋

I saw your OpenClaw skill **[Skill Name]** on GitHub — looks useful!

I'm working on **TrustClaw** (https://trustclaw.xyz), a security-verified marketplace for OpenClaw/Clawd skills. We're inviting early skill creators to:

1. **Get free security scans** — We check for unsafe patterns, data leaks, etc.
2. **Get listed with a verified badge** — Helps users find trustworthy skills
3. **Earn from skill installs** — Publishers earn when others use their skills (coming soon)

**Why security scanning?**  
As agents become more autonomous, users need to know which skills are safe. We're building the trust layer so the marketplace can grow without becoming a security nightmare.

**No catch** — scanning is free, listing is free. We just want to help quality skills get discovered.

If you're interested, you can submit your skill here: https://trustclaw.xyz/submit  
Or just paste your GitHub URL and we'll handle the rest.

Let me know if you have questions!

---

## 4. Bonus: Quick Reply (When Someone Mentions TrustClaw)

**Context:** Short thank-you when someone shares TrustClaw or recommends it

---

Thanks for sharing! 🙏  

If anyone wants their skill scanned, just drop the GitHub link at https://trustclaw.xyz — takes ~30 seconds and it's free.

---

## Usage Guidelines

**DO:**
- Focus on value (safety, trust, convenience)
- Share real scan results as examples
- Answer security questions honestly (admit limitations)
- Engage with feedback and feature requests

**DON'T:**
- Spam channels with repeated announcements
- Claim TrustClaw makes skills "100% safe" (nothing is)
- Attack other projects or marketplaces
- DM people who didn't ask (unless they published a skill)

**Tone:** Helpful engineer, not marketer. We're solving a real problem, not selling snake oil.

---

## Response to Common Questions

**Q: "Is TrustClaw affiliated with OpenClaw/Clawd?"**  
A: No, we're independent. We built this because we use OpenClaw ourselves and wanted a way to verify skills before installing them. Open-source community tool.

**Q: "How do you make money?"**  
A: Not figured out yet. For now it's free. Might add paid features later (API access for enterprises, premium scans), but core scanning will stay free.

**Q: "Can I see the scanner code?"**  
A: Planning to open-source it soon. Right now it's a Next.js app with pattern matching + VirusTotal integration. Happy to share the detection logic if you're curious.

**Q: "What if a skill passes but is actually malicious?"**  
A: That's possible — we catch obvious red flags, not sophisticated attacks. If you find a false negative, please report it! We'll improve the scanner and warn users.

**Q: "Can you scan private/proprietary skills?"**  
A: Yes, we have a paid API ($0.10/scan) for external scanning. DM for details or check /api/scan/external docs.

---

**Last Updated:** 2026-02-07  
**Contact:** team@trustclaw.xyz (or ping @TrustClaw in Discord once we have a bot)
