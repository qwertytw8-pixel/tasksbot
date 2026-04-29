# Деплой tasksbot — пошаговая инструкция

Бесплатная связка: **Fly.io (бэкенд) + Neon (Postgres) + Vercel (Mini App)**.

## 1. База данных — Neon

1. Зарегистрируйся на https://neon.tech (можно через GitHub).
2. Создай проект `tasksbot` (регион ближе к Fly.io — например, AWS Frankfurt).
3. На дашборде скопируй **Connection string → Pooled connection** (это URL для приложения).
4. Замени префикс `postgresql://` → `postgresql+asyncpg://`. Получится что-то вроде:
   ```
   postgresql+asyncpg://USER:PASSWORD@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Сохрани этот URL — это `DATABASE_URL` для бэкенда.

## 2. Бэкенд — Fly.io

1. Установи CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   export PATH="$HOME/.fly/bin:$PATH"
   fly auth login        # откроется браузер
   ```
2. В папке `backend/` запусти:
   ```bash
   cd backend
   fly launch --no-deploy --copy-config --name tasksbot --region fra
   # Когда спросит про Postgres / Redis — ответь No (мы используем Neon)
   ```
   Это создаст `fly.toml`. В нём убедись, что есть:
   ```toml
   [http_service]
   internal_port = 8080
   force_https = true
   auto_stop_machines = false   # бот должен быть всегда онлайн
   auto_start_machines = true
   min_machines_running = 1
   ```
3. Сгенерируй случайный `WEBHOOK_SECRET`:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
4. Заведи секреты (URL бэкенда узнаем после первого деплоя — пока поставь `https://tasksbot.fly.dev`, потом обнови, если будет другой):
   ```bash
   fly secrets set \
     BOT_TOKEN="123456:AAA..." \
     PUBLIC_URL="https://tasksbot.fly.dev" \
     WEBAPP_URL="https://tasksbot.vercel.app" \
     WEBHOOK_SECRET="<сгенерированный_выше>" \
     DATABASE_URL="postgresql+asyncpg://...@neon..." \
     CORS_ORIGINS="https://tasksbot.vercel.app,http://localhost:5173"
   ```
5. Деплой:
   ```bash
   fly deploy
   ```
6. Проверь: `curl https://tasksbot.fly.dev/healthz` → `{"status":"ok"}`.

## 3. Фронт — Vercel

1. Зарегистрируйся на https://vercel.com (через GitHub).
2. Import Project → выбери репо `tasksbot`.
3. **Root Directory** = `webapp`.
4. **Framework preset** должен сам определиться как `Vite`.
5. **Environment Variables** → добавь:
   ```
   VITE_API_URL = https://tasksbot.fly.dev
   ```
6. Deploy. Получишь URL вида `https://tasksbot.vercel.app`.
7. Если URL не совпадает с тем, что ты записал в `WEBAPP_URL` на Fly, обнови:
   ```bash
   fly secrets set WEBAPP_URL="https://<реальный>.vercel.app" CORS_ORIGINS="https://<реальный>.vercel.app"
   ```

## 4. BotFather — связать всё вместе

В Telegram открой `@BotFather`:
1. `/mybots` → выбери своего бота → **Bot Settings → Menu Button → Configure menu button**:
   - Текст кнопки: `Открыть задачи` (или что нравится)
   - URL: `https://<реальный>.vercel.app`
2. `/newapp` (или `/myapps` → выбери бота) — создай Mini App:
   - Title: `Задачи`
   - Description: пара строк
   - Photo + GIF — можно скипнуть (или загрузить позже).
   - **Web App URL**: `https://<реальный>.vercel.app`
   - Short name: `tasks` (получишь ссылку `t.me/<bot>/tasks`)

## 5. Проверка

В Telegram:
1. Открой своего бота → `/start` → видишь приветствие, кнопку «🚀 Открыть приложение»
   и нижнюю кнопку «🗂 Открыть задачи».
2. Жми кнопку → открывается Mini App в текущей теме (тёмная/светлая).
3. Создай категорию, потом задачу с `due_at` = текущее время + 2 минуты, `remind = −1 мин`.
4. Через минуту — приходит уведомление от бота.

## Картинки бота

Положи `welcome.png` (или `.jpg`/`.webp`) в `backend/assets/`, закоммить, `fly deploy`.
Бот сам подхватит её в `/start`.

## Обновления

- Бэкенд: пуш в `main` → нет авто-деплоя по умолчанию, надо `fly deploy` руками
  (либо настроить GitHub Actions — `fly deploy --remote-only`).
- Фронт: пуш в `main` → Vercel автоматом пересобирает.

## Тонкие моменты

- **Часовой пояс:** Mini App при первом запуске берёт `Intl.DateTimeFormat().resolvedOptions().timeZone`
  и шлёт в `/api/me`. Бэк хранит `due_at` в UTC. Проверь, что в Neon настроена UTC (это дефолт).
- **Webhook secret:** Telegram при каждом апдейте присылает заголовок
  `X-Telegram-Bot-Api-Secret-Token`. Если он не совпадает с `WEBHOOK_SECRET` — бэк отвечает 403.
  Это защита от поддельных апдейтов.
- **Бот не отвечает:** проверь `fly logs` — там должно быть `webhook set: ...`. Если нет,
  смотри `BOT_TOKEN` и `PUBLIC_URL`.
- **Mini App не открывается:** проверь, что `WEBAPP_URL` в BotFather и в `fly secrets` совпадают,
  и что они по HTTPS.
