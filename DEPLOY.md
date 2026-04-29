# Деплой tasksbot — пошаговая инструкция

Бесплатная связка **без банковской карты**:
**Render (бэкенд) + Neon (Postgres) + Vercel (Mini App) + GitHub Actions (cron)**.

> Render free Web Service засыпает после 15 мин простоя, а нам нужен живой бот.
> Решение: GitHub Actions раз в 5 минут пингует `/healthz` (будит) и зовёт `/cron/tick`
> (рассылает напоминания).

## 1. Neon — База данных

1. https://neon.tech → Sign up with GitHub.
2. Create project: имя `tasksbot`, регион **AWS Frankfurt** (`eu-central-1`).
3. Скопируй **Connection string → Pooled connection**. Замени `postgresql://` на
   `postgresql+asyncpg://` и сохрани — это `DATABASE_URL`.

## 2. Render — Бэкенд

1. https://render.com → Sign up with GitHub. Карта **не нужна** для free-tier.
2. **New → Blueprint** (он сам подхватит `render.yaml` из корня репо).
   Альтернатива: **New → Web Service**, выбрать репо вручную, в `Root Directory` указать
   `backend`, runtime `Docker`, плану — `Free`.
3. После клика «Apply» Render предложит заполнить секреты, которые в `render.yaml`
   помечены `sync: false`:
   - `BOT_TOKEN` — токен от @BotFather.
   - `PUBLIC_URL` — публичный URL этого же сервиса. Render подскажет домен (типа
     `https://tasksbot-backend.onrender.com`) сразу после старта; впиши его.
   - `WEBAPP_URL` — домен Vercel-приложения (заполним после п.3, пока можно поставить
     `https://example.com` — потом обновишь).
   - `DATABASE_URL` — строка Neon из шага 1.
   - `CORS_ORIGINS` — `https://<ВАШ-Vercel>.vercel.app,http://localhost:5173`.
   - `WEBHOOK_SECRET` и `CRON_SECRET` Render сгенерит сам (`generateValue: true`).
4. После первого деплоя проверь:
   ```
   curl https://<твой-render-домен>/healthz
   # {"status":"ok"}
   ```
5. Зайди в Render → Service → Environment, скопируй сгенерированный `CRON_SECRET` —
   он понадобится для GitHub Actions.

## 3. Vercel — Mini App

1. https://vercel.com → Continue with GitHub → Import репо `tasksbot-`.
2. **Root Directory** = `webapp`. Framework `Vite` определится сам.
3. **Environment Variables**:
   - `VITE_API_URL` = `https://<твой-render-домен>` (без слэша на конце).
4. Deploy. Получишь домен вида `https://tasksbot-xxx.vercel.app`.
5. Вернись в Render → Environment, обнови `WEBAPP_URL` и `CORS_ORIGINS` на этот реальный домен.
   Render автоматически передеплоит.

## 4. GitHub Actions — крон для напоминаний

В репо открой Settings → **Secrets and variables → Actions → New repository secret**
и добавь два секрета:

- `PUBLIC_URL` = `https://<твой-render-домен>`
- `CRON_SECRET` = тот, что сгенерил Render в шаге 2

Workflow `.github/workflows/cron-tick.yml` уже в репо — он запустится автоматически
по расписанию `*/5 * * * *`. Можно проверить вручную: Actions → cron-tick → Run workflow.

## 5. BotFather — связать всё в Telegram

В Telegram открой `@BotFather`:

1. `/mybots` → выбери бота → **Bot Settings → Menu Button → Configure menu button**:
   - Текст: `Открыть задачи`
   - URL: `https://<твой-Vercel>.vercel.app`
2. (Опционально) `/newapp` → создай Mini App с тем же URL — получишь короткую ссылку
   `t.me/<твой-бот>/<short-name>`.

## 6. Проверка end-to-end

В Telegram:
1. Открой бота → `/start` → видишь приветствие, кнопку «🚀 Открыть приложение».
2. Жми кнопку → открывается Mini App в текущей теме (тёмная/светлая Telegram).
3. Создай категорию, потом задачу с `due_at = now + 7 минут`, `remind = −5 мин`.
4. В пределах ~5–10 минут (с учётом окна крона) — приходит уведомление от бота.

## Картинки бота

Положи `welcome.png` (или `.jpg`/`.webp`) в `backend/assets/`, закоммить, Render передеплоит автоматом.
Бот сам подхватит её в `/start`.

## Тонкие моменты

- **Render free спит** через 15 мин. Крон будит каждые 5 мин — должно хватать.
  Первый ответ после долгого простоя (если крон не успел) занимает ~30 секунд —
  Telegram дождётся.
- **GitHub Actions cron** иногда задерживается на 5–15 минут под нагрузкой GitHub —
  это нормальное поведение. Для личного планировщика не критично; если нужна точность
  «секунда в секунду», уже надо платный сервис.
- **Часовой пояс:** Mini App при первом входе шлёт `Intl.DateTimeFormat().resolvedOptions().timeZone`
  на `/api/me`. Бэкенд хранит `due_at` в UTC.
- **Webhook secret:** Telegram при каждом апдейте присылает заголовок
  `X-Telegram-Bot-Api-Secret-Token`. Если он не совпадает с `WEBHOOK_SECRET` — бэк возвращает 403.

## Локальный dev

Чтобы тикать напоминания локально без GitHub Actions, просто дёргай эндпоинт
сам каждую минуту:
```bash
watch -n 60 'curl -X POST localhost:8080/cron/tick -H "Authorization: Bearer change-me-too"'
```
