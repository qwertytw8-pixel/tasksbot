# Перенос бота на свои серверы

Этот гайд — для случая, если ты хочешь полностью переехать с текущей бесплатной связки (Render + Vercel + Neon) куда-то ещё или поднять копию у себя. Бот целиком твой: код в твоём GitHub-репозитории, БД с твоими задачами, токен бота — у тебя в `@BotFather`. Подписка на Devin тут ни на что не влияет: даже если она кончится, бот продолжит работать в текущем виде, просто новые правки больше не будут прилетать автоматически.

## Из чего состоит бот

| Часть          | Что это                                     | Где сейчас живёт                                        |
| -------------- | ------------------------------------------- | ------------------------------------------------------- |
| Backend        | FastAPI + aiogram, Python 3.12              | [Render](https://render.com) (free, без карты)          |
| Frontend       | React + Vite (Telegram Mini App)            | [Vercel](https://vercel.com) (free навсегда)            |
| База           | PostgreSQL                                  | [Neon](https://neon.tech) (free)                        |
| Бот в Telegram | `@tasksblo_bot`                             | [@BotFather](https://t.me/BotFather)                    |
| Cron           | GitHub Actions, дёргает `/cron/tick` каждые 2 мин | этот же репозиторий                               |

Все четыре сервиса (Render / Vercel / Neon / GitHub Actions) на бесплатном плане работают в этой нагрузке без проблем — задержки реминдеров до ~2 минут, остальное мгновенно.

## Что нужно при себе

1. Аккаунт **GitHub** (у тебя уже есть, репозиторий [`ClampSerfScoop/tasksbot`](https://github.com/ClampSerfScoop/tasksbot)).
2. Доступ к **@BotFather** (там твой бот и его токен).
3. Подтверждённая почта на GitHub — без неё мерджить PR'ы и пользоваться GitHub Actions нельзя.

## Сценарий A — оставить как есть (ничего не трогать)

Просто ничего не делай. Все 4 сервиса работают на free-плане.
- Render free-план может «засыпать» неактивный сервис через 15 минут — первая команда после паузы доходит чуть медленнее, дальше всё нормально.
- Neon free-план хранит до 0.5 ГБ — этого хватит на десятки тысяч задач.
- Vercel free-план не имеет ограничений по времени.

Раз в месяц зайди в Render и Neon — на free-планах они иногда требуют подтвердить, что проект ещё активен (одна кнопка). Если не подтвердить — могут поставить на паузу, но **данные не теряются**, просто сервис надо разбудить.

## Сценарий B — переехать на свой сервер (VPS)

Минимально нужен один VPS на Linux (например, Hetzner / Timeweb / Aeza от 200 ₽/мес) и домен (опционально).

### B.1 Установить Docker

```bash
ssh user@your-server
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Перелогинься, чтобы группа применилась.

### B.2 Получить код

```bash
git clone https://github.com/ClampSerfScoop/tasksbot.git
cd tasksbot
```

### B.3 Поднять Postgres + бэкенд

Создай `docker-compose.yml` рядом с репозиторием:

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: tasksbot
      POSTGRES_PASSWORD: replace_me_strong_password
      POSTGRES_DB: tasksbot
    volumes:
      - ./pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql+asyncpg://tasksbot:replace_me_strong_password@db:5432/tasksbot
      BOT_TOKEN: "<твой токен из @BotFather>"
      WEBAPP_URL: "https://<твой_домен>"
      WEBHOOK_URL: "https://api.<твой_домен>/telegram/webhook"
      WEBHOOK_SECRET: "<любая случайная строка >= 32 символов>"
      CRON_SECRET: "<любая случайная строка >= 32 символов>"
      CORS_ORIGINS: "https://<твой_домен>"
    depends_on:
      - db
    ports:
      - "127.0.0.1:8000:8000"
```

Запусти:

```bash
docker compose up -d --build
```

Бэкенд поднимется на `localhost:8000`. Поставь перед ним **Caddy** или **Nginx** с TLS-сертификатом и проброс на 8000:

`/etc/caddy/Caddyfile` (если используешь Caddy — он сам выпускает Let's Encrypt):

```
api.example.com {
  reverse_proxy 127.0.0.1:8000
}
```

### B.4 Поднять фронт

Самый простой путь — собрать фронт локально и положить статикой:

```bash
cd webapp
echo 'VITE_API_BASE_URL=https://api.<твой_домен>' > .env.production
npm install
npm run build
```

Папку `webapp/dist` положи на любой статический хостинг:
- **Cloudflare Pages** (бесплатно): просто загрузи папку через UI.
- **Netlify** (бесплатно): то же самое.
- **Свой Caddy/Nginx**: добавь второй блок:
  ```
  example.com {
    root * /var/www/tasksbot
    try_files {path} /index.html
    file_server
  }
  ```

### B.5 Перевести бот на новый адрес

В Telegram → @BotFather → выбери своего бота → Bot Settings → Menu Button:
- В Menu Button укажи **новый** URL фронта (`https://example.com`).

В коде `WEBAPP_URL` уже указан, бот сам обновит webhook при старте.

### B.6 Заменить cron

GitHub Actions можно оставить (работает удалённо и бесплатно) — нужно только обновить секреты в репозитории:
- `PUBLIC_URL` → `https://api.<твой_домен>`
- `CRON_SECRET` → тот же, что в `docker-compose.yml`

Либо настроить локальный cron на VPS:

```bash
crontab -e
```

```
*/2 * * * * curl -fsS -H "X-Cron-Secret: <CRON_SECRET>" https://api.example.com/cron/tick >/dev/null
```

## Сценарий C — забрать данные

Если просто хочешь иметь дамп БД у себя на всякий случай:

```bash
# через psql из любой системы (нужны creds с Neon Console)
pg_dump "postgres://USER:PASS@HOST/DB?sslmode=require" -Fc -f tasksbot-backup.dump
```

Восстановить в любой Postgres:

```bash
pg_restore --no-owner --no-acl -d "postgres://USER:PASS@HOST/DB" tasksbot-backup.dump
```

Этим же способом можно перенести задачи с Neon на любой другой Postgres-сервер.

## Что в итоге у тебя есть

- **Код**: в твоём GitHub. Можешь форкнуть, склонировать, выложить куда угодно.
- **Бот**: токен у тебя в `@BotFather`, можешь повесить его на любой сервер.
- **Данные**: дамп Postgres снимается одной командой, разворачивается тоже одной.
- **Зависимостей от Devin или внешних сервисов нет** — после миграции всё крутится у тебя.

Если что-то не сработает или хочется сразу пройтись по этому гайду живьём — скажи, помогу.
