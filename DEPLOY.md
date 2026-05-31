# Deploying TasksBot — Step by Step

**Amvera (backend) + PostgreSQL + Vercel (Mini App) + GitHub Actions (cron)**.

> Backend runs on [Amvera](https://amvera.ru) — Russian cloud platform.
> GitHub Actions runs cron every 5 minutes hitting `/healthz` and `/cron/tick` (triggers background jobs).

## 1. Database (PostgreSQL)

1. https://neon.tech — Sign up with GitHub.
2. Create project: name it `tasksbot`, region **AWS Frankfurt** (`eu-central-1`).
3. Copy **Connection string → Pooled connection**. Change `postgresql://` to `postgresql+asyncpg://` and save as `DATABASE_URL`.

## 2. Amvera — Backend

1. https://amvera.ru — Sign up.
2. Create project, connect repo branch `main`, root directory — `backend`.
3. Set environment variables:
   - `BOT_TOKEN` — token from @BotFather.
   - `PUBLIC_URL` — public URL of your Amvera app.
   - `WEBAPP_URL` — Vercel Mini App URL.
   - `DATABASE_URL` — connection string to PostgreSQL.
   - `CORS_ORIGINS` — `https://<your-vercel>.vercel.app,http://localhost:5173`.
   - `WEBHOOK_SECRET` — any random string (for Telegram webhook verification).
   - `CRON_SECRET` — any random string (for GitHub Actions cron).
4. Verify deployment:
   ```
   curl https://<your-amvera-app>/healthz
   # {"status":"ok"}
   ```

## 3. Vercel — Mini App

1. https://vercel.com — Continue with GitHub → Import repo `tasksbot`.
2. **Root Directory** = `webapp`. Framework `Vite` auto-detected.
3. **Environment Variables**:
   - `VITE_API_URL` = `https://<your-amvera-app>` (without trailing slash).
4. Deploy. You'll get a URL like `https://tasksbot-xxx.vercel.app`.
5. Go back to Amvera → environment variables, update `WEBAPP_URL` and `CORS_ORIGINS` with the real Vercel URL. Amvera auto-redeploys.

## 4. GitHub Actions — Background Cron

Go to repo Settings → **Secrets and variables → Actions → New repository secret**. Add:

- `PUBLIC_URL` = `https://<your-amvera-app>`
- `CRON_SECRET` = same value as in Amvera step 2

The workflow `.github/workflows/cron-tick.yml` is already in the repo — it runs automatically via schedule `*/5 * * * *`. To test manually: Actions → cron-tick → Run workflow.

## 5. BotFather — Connect to Telegram

In Telegram, message `@BotFather`:

1. `/mybots` → select your bot → **Bot Settings → Menu Button → Configure menu button**:
   - Text: `Open TasksBot`
   - URL: `https://<your-vercel>.vercel.app`

2. (Optional) `/newapp` → create a Mini App with the same URL — this creates a deep link `t.me/<your-bot>/<short-name>`.

## 6. End-to-End Test

In Telegram:
1. Send `/start` → bot responds with welcome image and `< Open Mini App >` button.
2. Tap the button → Mini App opens with current theme (dark/light Telegram).
3. Create a task, set category, `due_at = now + 7 days`, `remind = in 5 min`.
4. In ~5-10 minutes (depending on cron interval) — you should get a reminder notification.

## Assets

Place `welcome.png` (or `.jpg`/`.webp`) in `backend/assets/`, and Amvera will serve it as a bot image sent on `/start`.

## Troubleshooting

- **Amvera** — backend works great on free tier. Cron runs every 5 minutes via GitHub Actions to keep the service alive (Amvera pauses idle services after inactivity).
- **GitHub Actions cron** — may take 5-15 minutes depending on GitHub load. The free tier is sufficient.
- **Timezone note:** Mini App uses `Intl.DateTimeFormat().resolvedOptions().timezone` from `/api/me`. All `due_at` is stored in UTC.
- **Webhook secret:** Telegram sends `X-Telegram-Bot-Api-Secret-Token` header. If it doesn't match `WEBHOOK_SECRET` — webhook returns 403.

## Local Dev

To simulate the cron job locally without GitHub Actions:
```bash
watch -n 60 'curl -X POST localhost:8080/cron/tick -H "Authorization: Bearer change-me-too"'
```
