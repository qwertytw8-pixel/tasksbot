"""aiogram bot: handlers + helpers."""

from __future__ import annotations

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

from app.config import get_settings

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
        "/help — это сообщение\n\n"
        "Все задачи и напоминания живут внутри Mini App.",
        reply_markup=_open_app_kb(),
    )


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


async def configure_bot_commands(bot: Bot) -> None:
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Приветствие"),
            BotCommand(command="app", description="Открыть Mini App"),
            BotCommand(command="help", description="Помощь"),
        ]
    )
