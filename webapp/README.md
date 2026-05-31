# TasksBot — Webapp (Mini App)

Vite + React + TypeScript + Telegram UI. Responsive interface with native dark/light theme support, Inter (UI) + Manrope (headings) fonts.

## Quick Start

```bash
cd webapp
pnpm install
cp .env.example .env
# Set VITE_API_URL = your backend URL (via ngrok or HTTPS)

pnpm dev
```

> **Note:** Mini App won't work in Telegram Web without proper `initData` — you'll get 401 errors from the API.
> For local testing, use ngrok (see `backend/README.md`).

## Deployment

**Vercel:** Connect repo, set root = `webapp/`, framework = Vite. In Project Settings → Environment Variables, set `VITE_API_URL` = your backend URL (Fly.io). The URL should be like `https://tasksbot.vercel.app` — this is what you register in @BotFather as the Mini App link.

To trigger a rebuild:
```bash
git add webapp/README.md
git commit -m "chore: trigger Vercel rebuild"
git push origin main
```
