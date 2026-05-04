# Деплой tasksbot — пошаговая инструкция

**Amvera (бэкенд) + PostgreSQL + Vercel (Mini App) + GitHub Actions (cron)**.

> Бэкенд размещён на [Amvera](https://amvera.ru) — российский облачный хостинг.
> GitHub Actions раз в 5 минут пингует `/healthz` и зовёт `/cron/tick`
> (рассылает напоминания).

## 1. База данных (PostgreSQL)

1. https://neon.tech → Sign up with GitHub.
2. Create project: имя `tasksbot`, регион **AWS Frankfurt** (`eu-central-1`).
3. Скопируй **Connection string → Pooled connection**. Замени `postgresql://` на
   `postgresql+asyncpg://` и сохрани — это `DATABASE_URL`.

## 2. Amvera — Бэкенд

1. https://amvera.ru → Регистрация.
2. Создай проект, подключи репозиторий `tasksbot`, корневая директория — `backend`.
3. Задай переменные окружения:
   - `BOT_TOKEN` — токен от @BotFather.
   - `PUBLIC_URL` — публичный URL сервиса на Amvera.
   - `WEBAPP_URL` — домен Vercel-приложения.
   - `DATABASE_URL` — строка подключения к PostgreSQL.
   - `CORS_ORIGINS` — `https://<ВАШ-Vercel>.vercel.app,http://localhost:5173`.
   - `WEBHOOK_SECRET` — любой секретный токен (для верификации вебхуков от Telegram).
   - `CRON_SECRET` — любой секретный токен (для GitHub Actions крона).
4. После деплоя проверь:
   ```
   curl https://<твой-amvera-домен>/healthz
   # {"status":"ok"}
   ```

## 3. Vercel — Mini App

1. https://vercel.com → Continue with GitHub → Import репо `tasksbot-`.
2. **Root Directory** = `webapp`. Framework `Vite` определится сам.
3. **Environment Variables**:
   - `VITE_API_URL` = `https://<твой-amvera-домен>` (без слэша на конце).
4. Deploy. Получишь домен вида `https://tasksbot-xxx.vercel.app`.
5. Вернись в Amvera → Переменные окружения, обнови `WEBAPP_URL` и `CORS_ORIGINS` на этот реальный домен.
   Amvera автоматически передеплоит.

## 4. GitHub Actions — крон для напоминаний

В репо открой Settings → **Secrets and variables → Actions → New repository secret**
и добавь два секрета:

- `PUBLIC_URL` = `https://<твой-amvera-домен>`
- `CRON_SECRET` = тот, что ты задал в Amvera в шаге 2

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

Положи `welcome.png` (или `.jpg`/`.webp`) в `backend/assets/`, закоммить, Amvera передеплоит автоматом.
Бот сам подхватит её в `/start`.

## Тонкие моменты

- **Amvera** — бэкенд работает постоянно без засыпания. Крон всё равно полезен для
  рассылки напоминаний каждые 5 минут.
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
