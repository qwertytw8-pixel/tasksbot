"""aiogram bot: handlers + helpers."""

from __future__ import annotations

import logging
import subprocess
import tempfile
from datetime import UTC
from pathlib import Path

import httpx
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

from app.config import get_settings
from app.db import Task, User, get_sessionmaker
from app.nlp import ParsedTask, parse_tasks

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
        "/privacy — как хранятся твои задачи\n"
        "/support — связь и поддержка\n"
        "/help — это сообщение\n\n"
        "Все задачи и напоминания живут внутри Mini App.",
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


_PRIORITY_LABELS = {0: "", 1: "🟢 низкий", 2: "🟡 средний", 3: "🔴 высокий"}


async def _ensure_bot_user(user_id: int) -> None:
    sm = get_sessionmaker()
    async with sm() as session:
        user = await session.get(User, user_id)
        if user is None:
            session.add(User(id=user_id))
            await session.commit()


async def _save_parsed_tasks(
    user_id: int, parsed: list[ParsedTask]
) -> list[Task]:
    sm = get_sessionmaker()
    created: list[Task] = []
    async with sm() as session:
        for p in parsed:
            due_at = p.due_at
            if due_at is not None and due_at.tzinfo is None:
                due_at = due_at.replace(tzinfo=UTC)
            task = Task(
                user_id=user_id,
                title=p.title,
                description=p.description,
                due_date=p.due_date,
                has_time=p.has_time,
                due_at=due_at,
                priority=p.priority,
            )
            session.add(task)
            created.append(task)
        await session.commit()
        for t in created:
            await session.refresh(t)
    return created


def _task_summary(task: Task) -> str:
    parts = [f"<b>{task.title}</b>"]
    if task.due_date:
        parts.append(f"📅 {task.due_date}")
    if task.has_time and task.due_at:
        parts.append(f"⏰ {task.due_at.strftime('%H:%M')}")
    if task.description:
        parts.append(f"({task.description})")
    p_label = _PRIORITY_LABELS.get(task.priority, "")
    if p_label:
        parts.append(p_label)
    return " ".join(parts)


async def _transcribe_voice(bot: Bot, file_id: str) -> str | None:
    file = await bot.get_file(file_id)
    if not file or not file.file_path:
        return None

    settings = get_settings()
    url = f"https://api.telegram.org/file/bot{settings.bot_token}/{file.file_path}"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            return None
        ogg_data = resp.content

    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as ogg_f:
        ogg_f.write(ogg_data)
        ogg_path = ogg_f.name

    wav_path = ogg_path.replace(".ogg", ".wav")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", ogg_path, "-ar", "16000", "-ac", "1", wav_path],
            capture_output=True,
            timeout=30,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        log.warning("ffmpeg not available for voice transcription")
        return None

    if not Path(wav_path).exists():
        return None

    openai_key = getattr(settings, "openai_api_key", None)
    if openai_key:
        try:
            with open(wav_path, "rb") as wav_file:
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/audio/transcriptions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        files={"file": ("voice.wav", wav_file, "audio/wav")},
                        data={"model": "whisper-1", "language": "ru"},
                    )
                    if resp.status_code == 200:
                        return resp.json().get("text", "")
        except Exception:
            log.exception("Whisper API error")

    try:
        import speech_recognition as sr

        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio = recognizer.record(source)
        return recognizer.recognize_google(audio, language="ru-RU")
    except Exception:
        log.exception("Google Speech Recognition error")
        return None
    finally:
        Path(ogg_path).unlink(missing_ok=True)
        Path(wav_path).unlink(missing_ok=True)


@dp.message(Command("new"))
async def cmd_new(message: Message) -> None:
    if not message.from_user:
        return
    raw = (message.text or "").removeprefix("/new").strip()
    if not raw:
        await message.answer("Напиши: <code>/new Текст задачи</code>")
        return

    await _ensure_bot_user(message.from_user.id)
    parsed = parse_tasks(raw)
    if not parsed:
        await message.answer("Не удалось разобрать задачу 🤔")
        return

    tasks = await _save_parsed_tasks(message.from_user.id, parsed)
    if len(tasks) == 1:
        await message.answer(f"✅ Создана: {_task_summary(tasks[0])}", reply_markup=_open_app_kb())
    else:
        lines = [f"✅ Создано задач: {len(tasks)}\n"]
        for i, t in enumerate(tasks, 1):
            lines.append(f"{i}. {_task_summary(t)}")
        await message.answer("\n".join(lines), reply_markup=_open_app_kb())


@dp.message(F.voice)
async def handle_voice(message: Message) -> None:
    if not message.from_user or not message.voice:
        return

    await _ensure_bot_user(message.from_user.id)
    bot = message.bot
    if not bot:
        return

    await message.answer("🎤 Обрабатываю голосовое...")
    text = await _transcribe_voice(bot, message.voice.file_id)
    if not text:
        await message.answer("Не удалось распознать голос 😕 Попробуй ещё раз.")
        return

    parsed = parse_tasks(text)
    if not parsed:
        await message.answer(f"Распознано: «{text}»\nНо не удалось разобрать задачу 🤔")
        return

    tasks = await _save_parsed_tasks(message.from_user.id, parsed)
    if len(tasks) == 1:
        await message.answer(
            f"🎤 Распознано: «{text}»\n\n✅ Создана: {_task_summary(tasks[0])}",
            reply_markup=_open_app_kb(),
        )
    else:
        lines = [f"🎤 Распознано: «{text}»\n\n✅ Создано задач: {len(tasks)}\n"]
        for i, t in enumerate(tasks, 1):
            lines.append(f"{i}. {_task_summary(t)}")
        await message.answer("\n".join(lines), reply_markup=_open_app_kb())


@dp.message(F.text & ~F.text.startswith("/"))
async def handle_text_nlp(message: Message) -> None:
    if not message.from_user or not message.text:
        return

    await _ensure_bot_user(message.from_user.id)
    parsed = parse_tasks(message.text)
    if not parsed:
        await message.answer(
            "Не могу разобрать задачу из сообщения 🤔\n"
            "Используй /new <текст> или просто напиши задачу.",
            reply_markup=_open_app_kb(),
        )
        return

    tasks = await _save_parsed_tasks(message.from_user.id, parsed)
    if len(tasks) == 1:
        await message.answer(f"✅ Создана: {_task_summary(tasks[0])}", reply_markup=_open_app_kb())
    else:
        lines = [f"✅ Создано задач: {len(tasks)}\n"]
        for i, t in enumerate(tasks, 1):
            lines.append(f"{i}. {_task_summary(t)}")
        await message.answer("\n".join(lines), reply_markup=_open_app_kb())


async def configure_bot_commands(bot: Bot) -> None:
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Приветствие"),
            BotCommand(command="app", description="Открыть Mini App"),
            BotCommand(command="new", description="Создать задачу из текста"),
            BotCommand(command="privacy", description="Приватность"),
            BotCommand(command="support", description="Поддержка"),
            BotCommand(command="help", description="Помощь"),
        ]
    )
