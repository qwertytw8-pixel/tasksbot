"""aiogram bot: handlers + helpers."""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    BotCommand,
    BufferedInputFile,
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    LabeledPrice,
    Message,
    PreCheckoutQuery,
    ReplyKeyboardMarkup,
    SuccessfulPayment,
    WebAppInfo,
)

from app.config import get_settings
from app.db import Subscription, Task, User, get_sessionmaker
from app.subscription import PREMIUM_PRICE_STARS, is_premium

log = logging.getLogger(__name__)

dp = Dispatcher()

WELCOME_TEXT = (
    "<b>Твой личный task space.</b>\n\n"
    "Планируй день без шума: задачи, категории и напоминания в одном аккуратном Mini App.\n\n"
    "Жми «Открыть приложение» — и поехали."
)

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"


def _open_app_kb() -> InlineKeyboardMarkup:
    settings = get_settings()
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Открыть приложение",
                    web_app=WebAppInfo(url=settings.webapp_url),
                )
            ],
            [
                InlineKeyboardButton(text="📋 Сегодня", callback_data="today"),
                InlineKeyboardButton(text="ℹ️ Помощь", callback_data="help"),
            ],
        ]
    )


def _reply_kb() -> ReplyKeyboardMarkup:
    settings = get_settings()
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🗂 Открыть задачи", web_app=WebAppInfo(url=settings.webapp_url))]
        ],
        resize_keyboard=True,
    )


def _welcome_image() -> BufferedInputFile | None:
    """Pick the first available welcome image from assets/.

    Looks for: welcome.{png,jpg,jpeg,webp}.
    """
    for ext in ("png", "jpg", "jpeg", "webp"):
        p = ASSETS_DIR / f"welcome.{ext}"
        if p.exists():
            return BufferedInputFile(p.read_bytes(), filename=p.name)
    return None


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    img = _welcome_image()
    if img is not None:
        await message.answer_photo(photo=img, caption=WELCOME_TEXT, reply_markup=_open_app_kb())
    else:
        await message.answer(WELCOME_TEXT, reply_markup=_open_app_kb())


@dp.message(Command("app"))
async def cmd_app(message: Message) -> None:
    await message.answer("Открой Mini App:", reply_markup=_open_app_kb())


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "<b>Команды</b>\n"
        "/start — приветствие и кнопка приложения\n"
        "/app — открыть Mini App\n"
        "/premium — оформить Premium-подписку\n"
        "/privacy — как хранятся твои задачи\n"
        "/support — связь и поддержка\n"
        "/help — это сообщение\n\n"
        "Все задачи и напоминания живут внутри Mini App.\n\n"
        "💎 <b>Premium:</b> отправь любое текстовое сообщение — "
        "бот автоматически создаст задачу!",
        reply_markup=_open_app_kb(),
    )


PRIVACY_TEXT = (
    "<b>Приватность</b>\n\n"
    "У каждого пользователя свои задачи, категории и подзадачи. "
    "Доступ к данным проверяется по Telegram <code>initData</code> и user id — "
    "чужие записи не смешиваются и не показываются другим.\n\n"
    "Mini App не использует логины и пароли. Авторизация происходит автоматически "
    "через Telegram.\n\n"
    "Данные хранятся в БД сервиса и нужны только для работы планировщика."
)

SUPPORT_TEXT = (
    "<b>Поддержка</b>\n\n"
    "Если что-то не работает, ошибка или есть идея — напиши владельцу бота "
    "прямым сообщением.\n\n"
    "Команды: /privacy — приватность, /help — список команд, /app — открыть Mini App."
)


@dp.message(Command("privacy"))
async def cmd_privacy(message: Message) -> None:
    await message.answer(PRIVACY_TEXT, reply_markup=_open_app_kb())


@dp.message(Command("support"))
async def cmd_support(message: Message) -> None:
    await message.answer(SUPPORT_TEXT, reply_markup=_open_app_kb())


@dp.callback_query(F.data == "help")
async def cb_help(cq: CallbackQuery) -> None:
    if cq.message:
        await cq.message.answer(
            "Жми кнопку «🚀 Открыть приложение», создавай задачу, выбирай категорию и время — "
            "бот пришлёт напоминание ровно тогда, когда попросишь."
        )
    await cq.answer()


@dp.callback_query(F.data == "today")
async def cb_today(cq: CallbackQuery) -> None:
    if cq.message:
        await cq.message.answer(
            "Открой Mini App — там увидишь задачи на сегодня:",
            reply_markup=_open_app_kb(),
        )
    await cq.answer()


@dp.message(Command("premium"))
async def cmd_premium(message: Message) -> None:
    await message.answer(
        "<b>⭐ Premium-подписка</b>\n\n"
        "Безлимитные задачи, свои категории, AI-парсинг текстовых и голосовых сообщений.\n\n"
        f"Цена: {PREMIUM_PRICE_STARS} ⭐ / месяц\n\n"
        "Нажми кнопку ниже, чтобы оформить:",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(
                    text=f"⭐ Купить за {PREMIUM_PRICE_STARS} Stars",
                    callback_data="buy_premium",
                )],
                [InlineKeyboardButton(
                    text="🚀 Открыть приложение",
                    web_app=WebAppInfo(url=get_settings().webapp_url),
                )],
            ]
        ),
    )


@dp.callback_query(F.data == "buy_premium")
async def cb_buy_premium(cq: CallbackQuery) -> None:
    if cq.message and cq.from_user:
        sm = get_sessionmaker()
        async with sm() as session:
            if await is_premium(session, cq.from_user.id):
                await cq.message.answer("У тебя уже есть активная Premium-подписка! 🎉")
                await cq.answer()
                return

        await cq.message.answer_invoice(
            title="Task Blo Premium",
            description=(
                "Подписка Premium на 30 дней: "
                "безлимитные задачи, свои категории, AI-парсинг."
            ),
            payload=json.dumps(
                {"type": "premium_30d", "user_id": cq.from_user.id}
            ),
            currency="XTR",
            prices=[LabeledPrice(label="Premium 30 дней", amount=PREMIUM_PRICE_STARS)],
        )
    await cq.answer()


@dp.pre_checkout_query()
async def on_pre_checkout(query: PreCheckoutQuery) -> None:
    await query.answer(ok=True)


@dp.message(F.successful_payment)
async def on_successful_payment(message: Message) -> None:
    payment: SuccessfulPayment | None = message.successful_payment
    if payment is None or message.from_user is None:
        return

    user_id = message.from_user.id
    now = datetime.now(UTC)
    expires_at = now + timedelta(days=30)

    sm = get_sessionmaker()
    async with sm() as session:
        user = await session.get(User, user_id)
        if user is None:
            user = User(id=user_id)
            session.add(user)
            await session.commit()

        sub = Subscription(
            user_id=user_id,
            plan="premium",
            started_at=now,
            expires_at=expires_at,
            is_active=True,
            source="stars",
            stars_payment_id=payment.telegram_payment_charge_id,
        )
        session.add(sub)
        await session.commit()

    await message.answer(
        "🎉 <b>Premium активирован!</b>\n\n"
        f"Подписка действует до {expires_at.strftime('%d.%m.%Y')}.\n"
        "Теперь ты можешь создавать безлимитные задачи, свои категории и "
        "отправлять текстовые/голосовые сообщения для быстрого добавления задач.",
        reply_markup=_open_app_kb(),
    )


def _parse_task_from_text(text: str) -> dict:
    """Simple NLP-like parser for Russian task text.

    Supports patterns like:
    - "купить молоко завтра в 15:00"
    - "позвонить маме сегодня"
    - "сдать отчёт 25.05"
    """
    result: dict = {"title": text, "due_date": None, "due_at": None, "has_time": False}
    now = datetime.now(UTC)
    remaining = text

    time_match = re.search(r"\bв\s+(\d{1,2})[:\.](\d{2})\b", remaining)
    hour, minute = None, None
    if time_match:
        hour, minute = int(time_match.group(1)), int(time_match.group(2))
        remaining = remaining[: time_match.start()] + remaining[time_match.end() :]

    date_match = re.search(r"\b(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\b", remaining)
    if date_match:
        day = int(date_match.group(1))
        month = int(date_match.group(2))
        year = int(date_match.group(3)) if date_match.group(3) else now.year
        if year < 100:
            year += 2000
        try:
            target = datetime(year, month, day, tzinfo=UTC)
            result["due_date"] = target.strftime("%Y-%m-%d")
            remaining = remaining[: date_match.start()] + remaining[date_match.end() :]
        except ValueError:
            pass

    if re.search(r"\bсегодня\b", remaining, re.IGNORECASE):
        result["due_date"] = now.strftime("%Y-%m-%d")
        remaining = re.sub(r"\bсегодня\b", "", remaining, flags=re.IGNORECASE)
    elif re.search(r"\bзавтра\b", remaining, re.IGNORECASE):
        tomorrow = now + timedelta(days=1)
        result["due_date"] = tomorrow.strftime("%Y-%m-%d")
        remaining = re.sub(r"\bзавтра\b", "", remaining, flags=re.IGNORECASE)
    elif re.search(r"\bпослезавтра\b", remaining, re.IGNORECASE):
        day_after = now + timedelta(days=2)
        result["due_date"] = day_after.strftime("%Y-%m-%d")
        remaining = re.sub(r"\bпослезавтра\b", "", remaining, flags=re.IGNORECASE)

    if hour is not None and minute is not None and result["due_date"]:
        parts = result["due_date"].split("-")
        dt = datetime(int(parts[0]), int(parts[1]), int(parts[2]), hour, minute, tzinfo=UTC)
        result["due_at"] = dt.isoformat()
        result["has_time"] = True

    result["title"] = re.sub(r"\s+", " ", remaining).strip()
    if not result["title"]:
        result["title"] = text.strip()

    return result


@dp.message(F.text & ~F.text.startswith("/"))
async def on_text_message(message: Message) -> None:
    if message.from_user is None or not message.text:
        return

    user_id = message.from_user.id
    sm = get_sessionmaker()
    async with sm() as session:
        if not await is_premium(session, user_id):
            await message.answer(
                "💎 Добавление задач через сообщения доступно с Premium-подпиской.\n"
                "Используй /premium для оформления.",
            )
            return

        user = await session.get(User, user_id)
        if user is None:
            user = User(id=user_id)
            session.add(user)
            await session.commit()

        parsed = _parse_task_from_text(message.text)

        task = Task(
            user_id=user_id,
            title=parsed["title"],
            due_date=datetime.strptime(parsed["due_date"], "%Y-%m-%d").date()
            if parsed["due_date"]
            else None,
            has_time=parsed["has_time"],
            due_at=datetime.fromisoformat(parsed["due_at"]) if parsed["due_at"] else None,
        )
        session.add(task)
        await session.commit()

        date_info = ""
        if parsed["due_date"]:
            date_info = f"\n📅 {parsed['due_date']}"
        if parsed["has_time"] and parsed["due_at"]:
            dt = datetime.fromisoformat(parsed["due_at"])
            date_info += f" в {dt.strftime('%H:%M')}"

        await message.answer(
            f"✅ Задача добавлена!\n\n<b>{parsed['title']}</b>{date_info}",
            reply_markup=_open_app_kb(),
        )


@dp.message(F.voice)
async def on_voice_message(message: Message) -> None:
    if message.from_user is None:
        return

    user_id = message.from_user.id
    sm = get_sessionmaker()
    async with sm() as session:
        if not await is_premium(session, user_id):
            await message.answer(
                "💎 Добавление задач через голосовые сообщения доступно с Premium-подпиской.\n"
                "Используй /premium для оформления.",
            )
            return

    await message.answer(
        "🎙 Голосовые сообщения пока в разработке. "
        "Напиши задачу текстом — я добавлю её сразу!",
        reply_markup=_open_app_kb(),
    )


async def configure_bot_commands(bot: Bot) -> None:
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Приветствие"),
            BotCommand(command="app", description="Открыть Mini App"),
            BotCommand(command="premium", description="Купить Premium"),
            BotCommand(command="privacy", description="Приватность"),
            BotCommand(command="support", description="Поддержка"),
            BotCommand(command="help", description="Помощь"),
        ]
    )
