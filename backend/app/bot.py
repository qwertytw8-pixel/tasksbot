"""aiogram bot: handlers + helpers."""

from __future__ import annotations

import asyncio
import io
import json
import logging
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

from app.api import _ensure_user, _sync_reminders
from app.auth import TelegramUser
from app.config import get_settings
from app.db import Subscription, Task, User, get_sessionmaker
from app.nlp import ParsedTask, commit_parsed, format_summary, parse_ru
from app.subscription import PREMIUM_PLANS, is_premium

log = logging.getLogger(__name__)

dp = Dispatcher()

WELCOME_TEXT = (
    "<b>Твой личный task space.</b>\n\n"
    "Планируй день без шума: задачи, категории и напоминания "
    "в одном аккуратном Mini App.\n\n"
    "💎 <b>Premium</b> — безлимитные задачи, свои категории, "
    "AI-парсинг текста и голоса от 99 ⭐/мес.\n\n"
    "Жми «Открыть приложение» — и поехали."
)

NEW_TASK_HINT = (
    "Просто напиши мне задачу как обычное сообщение — например, "
    "<i>купить молоко завтра в 19:00 #дом</i>. "
    "Я её разберу и добавлю в приложение."
)

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"


def _open_app_kb(
    show_premium: bool = True,
) -> InlineKeyboardMarkup:
    settings = get_settings()
    rows: list[list[InlineKeyboardButton]] = [
        [
            InlineKeyboardButton(
                text="🚀 Открыть приложение",
                web_app=WebAppInfo(url=settings.webapp_url),
            )
        ],
    ]
    if show_premium:
        rows.append([
            InlineKeyboardButton(
                text="💎 Купить Premium",
                callback_data="show_premium",
            )
        ])
    rows.append([
        InlineKeyboardButton(
            text="➕ Новая задача",
            callback_data="new_task",
        ),
        InlineKeyboardButton(
            text="ℹ️ Помощь",
            callback_data="help",
        ),
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def _task_actions_kb(task_id: int) -> InlineKeyboardMarkup:
    settings = get_settings()
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📋 Открыть в приложении",
                    web_app=WebAppInfo(url=settings.webapp_url),
                ),
            ],
            [
                InlineKeyboardButton(
                    text="❌ Отменить",
                    callback_data=f"del:{task_id}",
                ),
            ],
        ]
    )


def _reply_kb() -> ReplyKeyboardMarkup:
    settings = get_settings()
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="🗂 Открыть задачи",
                    web_app=WebAppInfo(url=settings.webapp_url),
                )
            ]
        ],
        resize_keyboard=True,
    )


def _welcome_image() -> BufferedInputFile | None:
    """Pick the first available welcome image from assets/."""
    for ext in ("png", "jpg", "jpeg", "webp"):
        p = ASSETS_DIR / f"welcome.{ext}"
        if p.exists():
            return BufferedInputFile(p.read_bytes(), filename=p.name)
    return None


@dp.message(CommandStart(deep_link=True, deep_link_encoded=True))
async def cmd_start_deep(message: Message) -> None:
    args = (message.text or "").split(maxsplit=1)
    param = args[1].strip().lower() if len(args) > 1 else ""
    if param == "premium":
        await cmd_premium(message)
        return
    await _do_start(message)


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await _do_start(message)


async def _do_start(message: Message) -> None:
    img = _welcome_image()
    if img is not None:
        await message.answer_photo(
            photo=img, caption=WELCOME_TEXT, reply_markup=_open_app_kb()
        )
    else:
        await message.answer(WELCOME_TEXT, reply_markup=_open_app_kb())

    if message.from_user:
        asyncio.create_task(
            _premium_nudge(message)
        )


async def _premium_nudge(message: Message) -> None:
    """Send a delayed premium promo to non-premium users."""
    if message.from_user is None:
        return
    await asyncio.sleep(3)
    sm = get_sessionmaker()
    async with sm() as session:
        if await is_premium(session, message.from_user.id):
            return
    await message.answer(
        "💎 <b>Попробуй Premium!</b>\n\n"
        "Безлимитные задачи, свои категории "
        "и AI-парсинг — от 99 ⭐/мес.",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[[
                InlineKeyboardButton(
                    text="💎 Подробнее о Premium",
                    callback_data="show_premium",
                )
            ]]
        ),
    )


@dp.message(Command("app"))
async def cmd_app(message: Message) -> None:
    await message.answer("Открой Mini App:", reply_markup=_open_app_kb())


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "<b>Команды</b>\n"
        "/start — приветствие и кнопка приложения\n"
        "/new &lt;текст&gt; — добавить задачу из чата\n"
        "/premium — купить Premium-подписку\n"
        "/app — открыть Mini App\n"
        "/privacy — как хранятся твои задачи\n"
        "/support — связь и поддержка\n"
        "/help — это сообщение\n\n"
        "💡 Можно просто написать задачу текстом — например, "
        "<i>позвонить маме завтра в 18:00 #семья</i>. Я распознаю дату, время и категорию.",
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
            "Жми кнопку «🚀 Открыть приложение», создавай задачу, выбирай категорию "
            "и время — бот пришлёт напоминание ровно тогда, когда попросишь.\n\n"
            + NEW_TASK_HINT
        )
    await cq.answer()


@dp.callback_query(F.data == "new_task")
async def cb_new_task(cq: CallbackQuery) -> None:
    if cq.message:
        await cq.message.answer(NEW_TASK_HINT)
    await cq.answer()


# ---- premium / payment -----------------------------------------------


def _premium_image() -> BufferedInputFile | None:
    p = ASSETS_DIR / "premium.png"
    if p.exists():
        return BufferedInputFile(p.read_bytes(), filename=p.name)
    return None


def _premium_success_image() -> BufferedInputFile | None:
    p = ASSETS_DIR / "premium_success.png"
    if p.exists():
        return BufferedInputFile(
            p.read_bytes(), filename=p.name,
        )
    return None


def _premium_kb() -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    for plan in PREMIUM_PLANS:
        label = f"\u2b50 {plan['label']} \u2014 {plan['stars']} Stars"
        if "save" in plan:
            label += f" (\u2212{plan['save']})"
        rows.append([InlineKeyboardButton(
            text=label,
            callback_data=f"buy:{plan['key']}",
        )])
    return InlineKeyboardMarkup(inline_keyboard=rows)


PREMIUM_TEXT = (
    "<b>⭐ Task Blo Premium</b>\n\n"
    "Безлимитные задачи и никаких "
    "ограничений.\n\n"
    "<b>Что входит:</b>\n"
    "• ♾️ Безлимитные задачи "
    "(в Free — только 5)\n"
    "• 🏷 Свои категории\n"
    "• 📝 AI-парсинг текстовых "
    "сообщений\n"
    "• 🎤 Голосовые задачи\n\n"
    "<b>Тарифы:</b>\n"
    "• 1 месяц — 99 ⭐\n"
    "• 3 месяца — 249 ⭐ "
    "<i>(выгода 16%)</i>\n"
    "• 12 месяцев — 799 ⭐ "
    "<i>(выгода 33%)</i>\n\n"
    "Выбери тариф ниже:"
)


@dp.message(Command("premium"))
async def cmd_premium(message: Message) -> None:
    img = _premium_image()
    if img:
        await message.answer_photo(
            photo=img,
            caption=PREMIUM_TEXT,
            reply_markup=_premium_kb(),
        )
    else:
        await message.answer(
            PREMIUM_TEXT, reply_markup=_premium_kb(),
        )


@dp.callback_query(F.data == "show_premium")
async def cb_show_premium(cq: CallbackQuery) -> None:
    if cq.message:
        img = _premium_image()
        if img:
            await cq.message.answer_photo(
                photo=img,
                caption=PREMIUM_TEXT,
                reply_markup=_premium_kb(),
            )
        else:
            await cq.message.answer(
                PREMIUM_TEXT, reply_markup=_premium_kb(),
            )
    await cq.answer()


def _plan_by_key(key: str) -> dict | None:
    for p in PREMIUM_PLANS:
        if p["key"] == key:
            return p
    return None


@dp.callback_query(F.data.startswith("buy:"))
async def cb_buy_premium(cq: CallbackQuery) -> None:
    if not cq.message or not cq.from_user or not cq.data:
        await cq.answer()
        return

    plan_key = cq.data.split(":", 1)[1]
    plan = _plan_by_key(plan_key)
    if plan is None:
        await cq.answer(
            "Неизвестный тариф",
            show_alert=True,
        )
        return

    sm = get_sessionmaker()
    async with sm() as session:
        if await is_premium(session, cq.from_user.id):
            await cq.message.answer(
                "У тебя уже есть активная "
                "Premium-подписка! 🎉"
            )
            await cq.answer()
            return

    await cq.message.answer_invoice(
        title="Task Blo Premium",
        description=(
            f"Premium {plan['label']}: "
            "безлимитные задачи, "
            "свои категории, AI."
        ),
        payload=json.dumps({
            "type": f"premium_{plan_key}",
            "user_id": cq.from_user.id,
            "days": plan["days"],
        }),
        currency="XTR",
        prices=[
            LabeledPrice(
                label=f"Premium {plan['label']}",
                amount=plan["stars"],
            )
        ],
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

    try:
        payload = json.loads(payment.invoice_payload)
        days = int(payload.get("days", 30))
    except (json.JSONDecodeError, ValueError, TypeError):
        days = 30

    expires_at = now + timedelta(days=days)

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

    exp_str = expires_at.strftime("%d.%m.%Y")
    success_text = (
        "🎉 <b>Добро пожаловать в Premium!</b>\n\n"
        "Спасибо, что выбрал Task Blo Premium. "
        "Теперь тебе доступны все возможности:\n\n"
        "• Безлимитные задачи\n"
        "• Свои категории\n"
        "• Умный ввод текстом\n"
        "• Голосовые сообщения\n\n"
        f"Подписка активна до {exp_str}.\n"
        "Просто напиши или запиши голосовое — "
        "я создам задачу за тебя!"
    )
    kb = _open_app_kb(show_premium=False)
    img = _premium_success_image()
    if img is not None:
        await message.answer_photo(
            photo=img,
            caption=success_text,
            reply_markup=kb,
        )
    else:
        await message.answer(
            success_text, reply_markup=kb,
        )


# ---- natural-language task creation -----------------------------------


async def _create_task_from_text(
    message: Message, text: str
) -> tuple[ParsedTask, Task, str] | None:
    """Parse a user message, persist a Task, return (parsed, task, tz_name)."""
    if message.from_user is None:
        return None
    tg = TelegramUser(
        id=message.from_user.id,
        first_name=message.from_user.first_name or "",
        last_name=message.from_user.last_name,
        username=message.from_user.username,
        language_code=message.from_user.language_code,
        is_premium=None,
    )
    sm = get_sessionmaker()
    async with sm() as session:
        user = await _ensure_user(session, tg)
        tz_name = user.tz or "UTC"
        parsed = parse_ru(text, tz_name=tz_name)
        task = await commit_parsed(session, user, parsed)
        await _sync_reminders(session, task)
        await session.commit()
        await session.refresh(task)
    return parsed, task, tz_name


def _format_task_confirmation(parsed: ParsedTask, task: Task, tz_name: str) -> str:
    lines = ["✅ <b>Задача добавлена</b>", f"<b>{_escape(task.title)}</b>"]
    summary = format_summary(parsed, tz_name)
    if summary:
        lines.append(f"🕒 {_escape(summary)}")
    return "\n".join(lines)


def _escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


@dp.message(Command("new"))
async def cmd_new(message: Message) -> None:
    text = (message.text or "").partition(" ")[2].strip()
    if not text:
        await message.answer(NEW_TASK_HINT, reply_markup=_open_app_kb())
        return
    await _handle_task_text(message, text)


@dp.message(F.text)
async def on_plain_text(message: Message) -> None:
    text = (message.text or "").strip()
    if not text or text.startswith("/"):
        return
    if message.from_user:
        sm = get_sessionmaker()
        async with sm() as session:
            if not await is_premium(session, message.from_user.id):
                await message.answer(
                    "💎 Добавление задач через сообщения доступно "
                    "с Premium-подпиской.",
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[[
                            InlineKeyboardButton(
                                text="💎 Купить Premium",
                                callback_data="show_premium",
                            )
                        ]]
                    ),
                )
                return
    await _handle_task_text(message, text)


async def _handle_task_text(message: Message, text: str) -> None:
    try:
        result = await _create_task_from_text(message, text)
    except Exception:  # pragma: no cover
        log.exception("failed to create task from NL text")
        await message.answer(
            "Ой, не получилось добавить задачу — попробуй ещё раз чуть позже "
            "или открой приложение:",
            reply_markup=_open_app_kb(),
        )
        return
    if result is None:
        return
    parsed, task, tz = result
    await message.answer(
        _format_task_confirmation(parsed, task, tz),
        reply_markup=_task_actions_kb(task.id),
    )


@dp.callback_query(F.data.startswith("del:"))
async def cb_delete_task(cq: CallbackQuery) -> None:
    if cq.data is None or cq.from_user is None:
        await cq.answer()
        return
    try:
        task_id = int(cq.data.split(":", 1)[1])
    except (ValueError, IndexError):
        await cq.answer("неверный id", show_alert=False)
        return
    sm = get_sessionmaker()
    async with sm() as session:
        task = await session.get(Task, task_id)
        if task is None or task.user_id != cq.from_user.id:
            await cq.answer("задача не найдена", show_alert=False)
            return
        await session.delete(task)
        await session.commit()
    if cq.message:
        try:
            await cq.message.edit_text("❌ Задача отменена.")
        except Exception:  # noqa: BLE001
            await cq.message.answer("❌ Задача отменена.")
    await cq.answer("удалено")


async def _transcribe_google(ogg_bytes: bytes) -> str | None:
    """Free transcription via Google Speech Recognition (no API key)."""
    import asyncio
    import subprocess
    import tempfile

    import speech_recognition as sr

    def _sync_transcribe() -> str | None:
        with tempfile.NamedTemporaryFile(suffix=".ogg") as ogg_f:
            ogg_f.write(ogg_bytes)
            ogg_f.flush()
            wav_path = ogg_f.name + ".wav"
            subprocess.run(
                ["ffmpeg", "-y", "-i", ogg_f.name, "-ar", "16000", "-ac", "1", wav_path],
                capture_output=True,
            )
            recognizer = sr.Recognizer()
            with sr.AudioFile(wav_path) as source:
                audio = recognizer.record(source)
            try:
                return recognizer.recognize_google(audio, language="ru-RU")
            except (sr.UnknownValueError, sr.RequestError):
                return None

    return await asyncio.to_thread(_sync_transcribe)


async def _transcribe_openai(ogg_bytes: bytes, api_key: str) -> str | None:
    """Transcription via OpenAI Whisper API (paid, higher quality)."""
    from openai import AsyncOpenAI

    buf = io.BytesIO(ogg_bytes)
    buf.name = "voice.ogg"
    client = AsyncOpenAI(api_key=api_key)
    transcript = await client.audio.transcriptions.create(
        model="whisper-1", file=buf, language="ru",
    )
    return transcript.text.strip() or None


@dp.message(F.voice)
async def on_voice(message: Message) -> None:
    settings = get_settings()
    bot = message.bot
    if bot is None or message.voice is None:
        return

    if message.from_user:
        sm = get_sessionmaker()
        async with sm() as session:
            if not await is_premium(session, message.from_user.id):
                await message.answer(
                    "💎 Добавление задач через голосовые сообщения "
                    "доступно с Premium-подпиской.",
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[[
                            InlineKeyboardButton(
                                text="💎 Купить Premium",
                                callback_data="show_premium",
                            )
                        ]]
                    ),
                )
                return

    await message.answer("🎙 Распознаю голосовое сообщение…")

    try:
        file = await bot.get_file(message.voice.file_id)
        if file.file_path is None:
            await message.answer("Не удалось скачать голосовое сообщение.")
            return

        buf = io.BytesIO()
        await bot.download_file(file.file_path, buf)
        ogg_bytes = buf.getvalue()

        text = None
        if settings.openai_api_key:
            text = await _transcribe_openai(ogg_bytes, settings.openai_api_key)
        else:
            text = await _transcribe_google(ogg_bytes)

        if not text:
            await message.answer(
                "Не удалось распознать текст из голосового сообщения. "
                "Попробуй ещё раз или напиши текстом.",
                reply_markup=_open_app_kb(),
            )
            return

        await _handle_task_text(message, text)
    except Exception:
        log.exception("voice transcription failed")
        await message.answer(
            "Ой, не получилось распознать голосовое — попробуй ещё раз чуть позже.",
            reply_markup=_open_app_kb(),
        )


async def configure_bot_commands(bot: Bot) -> None:
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Приветствие"),
            BotCommand(command="new", description="Добавить задачу из чата"),
            BotCommand(command="premium", description="Купить Premium"),
            BotCommand(command="app", description="Открыть Mini App"),
            BotCommand(command="privacy", description="Приватность"),
            BotCommand(command="support", description="Поддержка"),
            BotCommand(command="help", description="Помощь"),
        ]
    )
