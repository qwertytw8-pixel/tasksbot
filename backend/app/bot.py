"""aiogram bot: handlers + helpers."""

from __future__ import annotations

import io
import logging
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
    Message,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from app.api import _ensure_user, _sync_reminders
from app.auth import TelegramUser
from app.config import get_settings
from app.db import Task, get_sessionmaker
from app.nlp import ParsedTask, commit_parsed, format_summary, parse_ru

log = logging.getLogger(__name__)

dp = Dispatcher()

WELCOME_TEXT = (
    "<b>Твой личный task space.</b>\n\n"
    "Планируй день без шума: задачи, категории и напоминания в одном "
    "аккуратном Mini App.\n\n"
    "📝 <b>Быстрый способ:</b> просто напиши мне в чат, что хочешь сделать "
    "— я распознаю дату, время и категорию.\n"
    "   • <i>купить молоко завтра в 19:00</i>\n"
    "   • <i>созвон в пн в 10 напомни за 30 мин #работа</i>\n"
    "   • <i>через час позвонить маме</i>\n\n"
    "Или жми «🚀 Открыть приложение» — там весь календарь и задачи."
)

NEW_TASK_HINT = (
    "Просто напиши мне задачу как обычное сообщение — например, "
    "<i>купить молоко завтра в 19:00 #дом</i>. "
    "Я её разберу и добавлю в приложение."
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
                InlineKeyboardButton(text="➕ Новая задача", callback_data="new_task"),
                InlineKeyboardButton(text="ℹ️ Помощь", callback_data="help"),
            ],
        ]
    )


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


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    img = _welcome_image()
    if img is not None:
        await message.answer_photo(
            photo=img, caption=WELCOME_TEXT, reply_markup=_open_app_kb()
        )
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
        "/new &lt;текст&gt; — добавить задачу из чата\n"
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


@dp.message(F.voice)
async def on_voice(message: Message) -> None:
    settings = get_settings()
    if not settings.openai_api_key:
        await message.answer(
            "🎙 Голосовой ввод пока не настроен. "
            "Добавь <code>OPENAI_API_KEY</code> в переменные окружения, "
            "чтобы я мог распознавать голосовые сообщения.",
            reply_markup=_open_app_kb(),
        )
        return

    bot = message.bot
    if bot is None or message.voice is None:
        return

    await message.answer("🎙 Распознаю голосовое сообщение…")

    try:
        file = await bot.get_file(message.voice.file_id)
        if file.file_path is None:
            await message.answer("Не удалось скачать голосовое сообщение.")
            return

        buf = io.BytesIO()
        await bot.download_file(file.file_path, buf)
        buf.seek(0)
        buf.name = "voice.ogg"

        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        transcript = await client.audio.transcriptions.create(
            model="whisper-1",
            file=buf,
            language="ru",
        )
        text = transcript.text.strip()
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
            BotCommand(command="app", description="Открыть Mini App"),
            BotCommand(command="privacy", description="Приватность"),
            BotCommand(command="support", description="Поддержка"),
            BotCommand(command="help", description="Помощь"),
        ]
    )
