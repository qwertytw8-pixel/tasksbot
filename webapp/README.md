# tasksbot — webapp (Mini App)

Vite + React + TypeScript + Telegram UI. Минималистичный дизайн, нативная тёмная/светлая тема
из Telegram, шрифты Inter (UI) + Manrope (заголовки).

## Локально

```bash
cd webapp
pnpm install   # или npm install / yarn
cp .env.example .env
# заполни VITE_API_URL = адрес локального бэкенда (через ngrok тоже HTTPS-домен)

pnpm dev
```

> Запускать Mini App вне Telegram можно — но `initData` будет пустой и API вернёт 401.
> Для полноценного теста открывай через бота (см. `backend/README.md`).

## Деплой

Vercel: подключи репо, root = `webapp/`, Framework = Vite. В Project Settings → Environment Variables
добавь `VITE_API_URL` = публичный URL бэкенда (Fly.io). Получишь домен типа
`https://tasksbot.vercel.app` — его и пропиши в @BotFather в настройках Mini App.
  ; git add webapp/README.md ; git commit -m "chore: trigger Vercel rebuild" ; git push origin main
