"""aiogram bot: handlers + helpers."""

from __future__ import annotations

import asyncio
import io
import json
import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandObject, CommandStart
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
from app.nlp import (
    ParsedTask,
    commit_parsed,
    format_summary,
    parse_ru,
)
from app.nlp_ai import smart_parse_tasks
from app.subscription import PREMIUM_PLANS, RENEWAL_DISCOUNT_PLAN, is_premium

log = logging.getLogger(__name__)

dp = Dispatcher()

WELCOME_TEXT = (
    "<b>Твой личный task space.</b>\n\n"
    "Планируй день без шума: задачи, категории и напоминания "
    "в одном аккуратном Mini App.\n\n"
    "💎 <b>Premium</b> — безлимитные задачи, свои категории, "
    "ввод задач текстом и голосом от 99 ⭐/мес.\n\n"
    "Жми «Открыть приложение» — и поехали."
)

WELCOME_TEXT_EN = (
    "<b>Your personal task space.</b>\n\n"
    "Plan your day without noise: tasks, categories, and reminders "
    "in one clean Mini App.\n\n"
    "💎 <b>Premium</b> — unlimited tasks, custom categories, "
    "create tasks via text and voice from 99 ⭐/mo.\n\n"
    "Tap «Open app» to get started."
)

NEW_TASK_HINT = (
    "Просто напиши мне задачу как обычное сообщение — например, "
    "<i>купить молоко завтра в 19:00 #дом</i>. "
    "Я её разберу и добавлю в приложение."
)

NEW_TASK_HINT_EN = (
    "Just send me a task as a regular message — for example, "
    "<i>buy milk tomorrow at 7pm #home</i>. "
    "I'll parse and add it to the app."
)

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"


def _is_ru(message: Message | None = None, cq: CallbackQuery | None = None) -> bool:
    """Return True if user's Telegram language starts with 'ru'."""
    user = None
    if message and message.from_user:
        user = message.from_user
    elif cq and cq.from_user:
        user = cq.from_user
    if user and user.language_code:
        return user.language_code.startswith("ru")
    return True


def _open_app_kb(
    show_premium: bool = True,
    ru: bool = True,
) -> InlineKeyboardMarkup:
    settings = get_settings()
    rows: list[list[InlineKeyboardButton]] = [
        [
            InlineKeyboardButton(
                text="🚀 Открыть приложение" if ru else "🚀 Open app",
                web_app=WebAppInfo(url=settings.webapp_url),
            )
        ],
    ]
    if show_premium:
        rows.append([
            InlineKeyboardButton(
                text="💎 Купить Premium" if ru else "💎 Buy Premium",
                callback_data="show_premium",
            )
        ])
    rows.append([
        InlineKeyboardButton(
            text="➕ Новая задача" if ru else "➕ New task",
            callback_data="new_task",
        ),
        InlineKeyboardButton(
            text="ℹ️ Помощь" if ru else "ℹ️ Help",
            callback_data="help",
        ),
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def _task_actions_kb(task_id: int, ru: bool = True) -> InlineKeyboardMarkup:
    settings = get_settings()
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📋 Открыть в приложении" if ru else "📋 Open in app",
                    web_app=WebAppInfo(url=settings.webapp_url),
                ),
            ],
            [
                InlineKeyboardButton(
                    text="❌ Отменить" if ru else "❌ Cancel",
                    callback_data=f"del:{task_id}",
                ),
            ],
        ]
    )


def _reply_kb(ru: bool = True) -> ReplyKeyboardMarkup:
    settings = get_settings()
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="🗂 Открыть задачи" if ru else "🗂 Open tasks",
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
    ru = _is_ru(message=message)
    kb = _open_app_kb(ru=ru)
    if ru:
        welcome = WELCOME_TEXT
        img = _welcome_image()
        if img is not None:
            await message.answer_photo(photo=img, caption=welcome, reply_markup=kb)
        else:
            await message.answer(welcome, reply_markup=kb)
    else:
        welcome = WELCOME_TEXT_EN
        await message.answer(welcome, reply_markup=kb)

    if message.from_user:
        asyncio.create_task(
            _premium_nudge(message)
        )


async def _premium_nudge(message: Message) -> None:
    """Send a delayed premium promo to non-premium users."""
    if message.from_user is None:
        return
    ru = _is_ru(message=message)
    await asyncio.sleep(3)
    sm = get_sessionmaker()
    async with sm() as session:
        if await is_premium(session, message.from_user.id):
            return
    text = (
        "💎 <b>Попробуй Premium!</b>\n\n"
        "Безлимитные задачи, свои категории, "
        "ввод задач текстом и голосом — от 99 ⭐/мес."
    ) if ru else (
        "💎 <b>Try Premium!</b>\n\n"
        "Unlimited tasks, custom categories, "
        "create tasks via text and voice — from 99 ⭐/mo."
    )
    btn_text = "💎 Подробнее о Premium" if ru else "💎 Learn more about Premium"
    await message.answer(
        text,
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[[
                InlineKeyboardButton(
                    text=btn_text,
                    callback_data="show_premium",
                )
            ]]
        ),
    )


@dp.message(Command("app"))
async def cmd_app(message: Message) -> None:
    ru = _is_ru(message=message)
    text = "Открой Mini App:" if ru else "Open Mini App:"
    await message.answer(text, reply_markup=_open_app_kb(ru=ru))


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    ru = _is_ru(message=message)
    if ru:
        text = (
            "<b>Команды</b>\n"
            "/start — приветствие и кнопка приложения\n"
            "/new &lt;текст&gt; — добавить задачу из чата\n"
            "/premium — купить Premium-подписку\n"
            "/app — открыть Mini App\n"
            "/privacy — как хранятся твои задачи\n"
            "/support — связь и поддержка\n"
            "/help — это сообщение\n\n"
            "💡 Можно просто написать задачу текстом — например, "
            "<i>позвонить маме завтра в 18:00 #семья</i>. Я распознаю дату, время и категорию."
        )
    else:
        text = (
            "<b>Commands</b>\n"
            "/start — welcome message and app button\n"
            "/new &lt;text&gt; — add a task from chat\n"
            "/premium — buy Premium subscription\n"
            "/app — open Mini App\n"
            "/privacy — how your tasks are stored\n"
            "/support — contact and support\n"
            "/help — this message\n\n"
            "💡 You can simply send a task as text — for example, "
            "<i>call mom tomorrow at 6pm #family</i>. I'll parse the date, time, and category."
        )
    await message.answer(text, reply_markup=_open_app_kb(ru=ru))


PRIVACY_TEXT = (
    "<b>Приватность</b>\n\n"
    "У каждого пользователя свои задачи, категории и подзадачи. "
    "Доступ к данным проверяется по Telegram <code>initData</code> и user id — "
    "чужие записи не смешиваются и не показываются другим.\n\n"
    "Mini App не использует логины и пароли. Авторизация происходит автоматически "
    "через Telegram.\n\n"
    "Данные хранятся в БД сервиса и нужны только для работы планировщика."
)

PRIVACY_TEXT_EN = (
    "<b>Privacy</b>\n\n"
    "Each user has their own tasks, categories, and subtasks. "
    "Access is verified via Telegram <code>initData</code> and user id — "
    "records are never mixed or shown to others.\n\n"
    "The Mini App does not use logins or passwords. Authentication is automatic "
    "via Telegram.\n\n"
    "Data is stored in the service database and is only used for the planner."
)

SUPPORT_TEXT = (
    "<b>Поддержка</b>\n\n"
    "Если что-то не работает, ошибка или есть идея — напиши владельцу бота "
    "прямым сообщением.\n\n"
    "Команды: /privacy — приватность, /help — список команд, /app — открыть Mini App."
)

SUPPORT_TEXT_EN = (
    "<b>Support</b>\n\n"
    "If something isn't working, there's an error, or you have an idea — "
    "send a direct message to the bot owner.\n\n"
    "Commands: /privacy — privacy, /help — command list, /app — open Mini App."
)


@dp.message(Command("privacy"))
async def cmd_privacy(message: Message) -> None:
    ru = _is_ru(message=message)
    text = PRIVACY_TEXT if ru else PRIVACY_TEXT_EN
    await message.answer(text, reply_markup=_open_app_kb(ru=ru))


@dp.message(Command("support"))
async def cmd_support(message: Message) -> None:
    ru = _is_ru(message=message)
    text = SUPPORT_TEXT if ru else SUPPORT_TEXT_EN
    await message.answer(text, reply_markup=_open_app_kb(ru=ru))


@dp.callback_query(F.data == "help")
async def cb_help(cq: CallbackQuery) -> None:
    ru = _is_ru(cq=cq)
    if cq.message:
        if ru:
            text = (
                "Жми кнопку «🚀 Открыть приложение», создавай задачу, выбирай категорию "
                "и время — бот пришлёт напоминание ровно тогда, когда попросишь.\n\n"
                + NEW_TASK_HINT
            )
        else:
            text = (
                "Tap «🚀 Open app», create a task, pick a category "
                "and time — the bot will send a reminder exactly when you ask.\n\n"
                + NEW_TASK_HINT_EN
            )
        await cq.message.answer(text)
    await cq.answer()


@dp.callback_query(F.data == "new_task")
async def cb_new_task(cq: CallbackQuery) -> None:
    ru = _is_ru(cq=cq)
    if cq.message:
        await cq.message.answer(NEW_TASK_HINT if ru else NEW_TASK_HINT_EN)
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
    "• ♾️ Безлимитные задачи каждый день\n"
    "• 🏷 Свои категории\n"
    "• 📝 Создавай задачи прямо из чата\n"
    "• 🎤 Создавай задачи голосом\n"
    "• ⏰ Напоминания заранее\n\n"
    "<b>Тарифы:</b>\n"
    "• 1 месяц — 99 ⭐\n"
    "• 3 месяца — 249 ⭐ "
    "<i>(выгода 16%)</i>\n"
    "• 12 месяцев — 799 ⭐ "
    "<i>(выгода 33%)</i>\n\n"
    "Выбери тариф ниже:"
)

PREMIUM_TEXT_EN = (
    "<b>⭐ Task Blo Premium</b>\n\n"
    "Unlimited tasks and no "
    "restrictions.\n\n"
    "<b>What's included:</b>\n"
    "• ♾️ Unlimited tasks every day\n"
    "• 🏷 Custom categories\n"
    "• 📝 Create tasks from chat messages\n"
    "• 🎤 Create tasks via voice\n"
    "• ⏰ Early reminders\n\n"
    "<b>Plans:</b>\n"
    "• 1 month — 99 ⭐\n"
    "• 3 months — 249 ⭐ "
    "<i>(save 16%)</i>\n"
    "• 12 months — 799 ⭐ "
    "<i>(save 33%)</i>\n\n"
    "Choose a plan below:"
)


@dp.message(Command("premium"))
async def cmd_premium(message: Message) -> None:
    ru = _is_ru(message=message)
    text = PREMIUM_TEXT if ru else PREMIUM_TEXT_EN
    if ru:
        img = _premium_image()
        if img:
            await message.answer_photo(
                photo=img,
                caption=text,
                reply_markup=_premium_kb(),
            )
            return
    await message.answer(
        text, reply_markup=_premium_kb(),
    )


@dp.callback_query(F.data == "show_premium")
async def cb_show_premium(cq: CallbackQuery) -> None:
    ru = _is_ru(cq=cq)
    if cq.from_user:
        sm = get_sessionmaker()
        async with sm() as session:
            user = await session.get(User, cq.from_user.id)
            if user and user.premium_interest_at is None:
                user.premium_interest_at = datetime.now(UTC)
                await session.commit()
    text = PREMIUM_TEXT if ru else PREMIUM_TEXT_EN
    if cq.message:
        if ru:
            img = _premium_image()
            if img:
                await cq.message.answer_photo(
                    photo=img,
                    caption=text,
                    reply_markup=_premium_kb(),
                )
                await cq.answer()
                return
        await cq.message.answer(
            text, reply_markup=_premium_kb(),
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
    ru = _is_ru(cq=cq)
    if plan is None:
        await cq.answer(
            "Неизвестный тариф" if ru else "Unknown plan",
            show_alert=True,
        )
        return

    sm = get_sessionmaker()
    async with sm() as session:
        if await is_premium(session, cq.from_user.id):
            await cq.message.answer(
                "У тебя уже есть активная Premium-подписка! 🎉" if ru
                else "You already have an active Premium subscription! 🎉"
            )
            await cq.answer()
            return

    desc = (
        f"Premium {plan['label']}: безлимитные задачи, свои категории и все возможности."
    ) if ru else (
        f"Premium {plan['label']}: unlimited tasks, custom categories, and all features."
    )
    await cq.message.answer_invoice(
        title="Task Blo Premium",
        description=desc,
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



@dp.callback_query(F.data == "renew_discount")
async def cb_renew_discount(cq: CallbackQuery) -> None:
    if not cq.message or not cq.from_user:
        await cq.answer()
        return

    ru = _is_ru(cq=cq)
    sm = get_sessionmaker()
    async with sm() as session:
        if await is_premium(session, cq.from_user.id):
            await cq.message.answer(
                "У тебя уже есть активная Premium-подписка! 🎉" if ru
                else "You already have an active Premium subscription! 🎉"
            )
            await cq.answer()
            return

    plan = RENEWAL_DISCOUNT_PLAN
    desc = (
        f"Premium {plan['label']}: безлимитные задачи, свои категории и все возможности."
    ) if ru else (
        f"Premium {plan['label']}: unlimited tasks, custom categories, and all features."
    )
    await cq.message.answer_invoice(
        title="Task Blo Premium" if ru else "Task Blo Premium — discount",
        description=desc,
        payload=json.dumps({
            "type": "premium_renewal_1m",
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

    ru = _is_ru(message=message)
    exp_str = expires_at.strftime("%d.%m.%Y")
    if ru:
        success_text = (
            "🎉 <b>Добро пожаловать в Premium!</b>\n\n"
            "Спасибо, что выбрал Task Blo Premium. "
            "Теперь тебе доступны все возможности:\n\n"
            "• Безлимитные задачи каждый день\n"
            "• Свои категории\n"
            "• Создавай задачи прямо из чата\n"
            "• Создавай задачи голосом\n"
            "• Напоминания заранее\n\n"
            f"Подписка активна до {exp_str}.\n"
            "Просто напиши или запиши голосовое — "
            "я создам задачу за тебя!"
        )
    else:
        success_text = (
            "🎉 <b>Welcome to Premium!</b>\n\n"
            "Thanks for choosing Task Blo Premium. "
            "Now you have access to all features:\n\n"
            "• Unlimited tasks every day\n"
            "• Custom categories\n"
            "• Create tasks from chat messages\n"
            "• Create tasks via voice\n"
            "• Early reminders\n\n"
            f"Subscription active until {exp_str}.\n"
            "Just send a message or a voice note — "
            "I'll create the task for you!"
        )
    kb = _open_app_kb(show_premium=False, ru=ru)
    if ru:
        img = _premium_success_image()
        if img is not None:
            await message.answer_photo(
                photo=img,
                caption=success_text,
                reply_markup=kb,
            )
            return
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


def _format_task_confirmation(parsed: ParsedTask, task: Task, tz_name: str, ru: bool = True) -> str:
    header = "✅ <b>Задача добавлена</b>" if ru else "✅ <b>Task added</b>"
    lines = [header, f"<b>{_escape(task.title)}</b>"]
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
async def cmd_new(message: Message, command: CommandObject) -> None:
    ru = _is_ru(message=message)
    text = (command.args or "").strip()
    if not text:
        await message.answer(
            NEW_TASK_HINT if ru else NEW_TASK_HINT_EN,
            reply_markup=_open_app_kb(ru=ru),
        )
        return
    if message.from_user:
        sm = get_sessionmaker()
        async with sm() as session:
            if not await is_premium(session, message.from_user.id):
                msg = (
                    "💎 Добавление задач через сообщения доступно с Premium-подпиской." if ru
                    else "💎 Adding tasks via messages is available with a Premium subscription."
                )
                await message.answer(
                    msg,
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[[
                            InlineKeyboardButton(
                                text="💎 Купить Premium" if ru else "💎 Buy Premium",
                                callback_data="show_premium",
                            )
                        ]]
                    ),
                )
                return
    await _handle_task_text(message, text)


@dp.message(F.text)
async def on_plain_text(message: Message) -> None:
    text = (message.text or "").strip()
    if not text or text.startswith("/"):
        return
    ru = _is_ru(message=message)
    if message.from_user:
        sm = get_sessionmaker()
        async with sm() as session:
            if not await is_premium(session, message.from_user.id):
                msg = (
                    "💎 Добавление задач через сообщения доступно с Premium-подпиской." if ru
                    else "💎 Adding tasks via messages is available with a Premium subscription."
                )
                await message.answer(
                    msg,
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[[
                            InlineKeyboardButton(
                                text="💎 Купить Premium" if ru else "💎 Buy Premium",
                                callback_data="show_premium",
                            )
                        ]]
                    ),
                )
                return
    await _handle_task_text(message, text)


async def _handle_task_text(message: Message, text: str) -> None:
    if message.from_user is None:
        return

    ru = _is_ru(message=message)
    settings = get_settings()

    # Resolve user timezone
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

    # AI-powered parsing with automatic regex fallback
    parsed_tasks = await smart_parse_tasks(
        text,
        groq_api_key=settings.groq_api_key,
        tz_name=tz_name,
    )

    if not parsed_tasks:
        err = (
            "Не удалось разобрать задачи — попробуй ещё раз." if ru
            else "Couldn't parse the tasks — please try again."
        )
        await message.answer(err, reply_markup=_open_app_kb(ru=ru))
        return

    # Persist all parsed tasks
    results: list[tuple[ParsedTask, Task, str]] = []
    for parsed in parsed_tasks:
        try:
            sm2 = get_sessionmaker()
            async with sm2() as session:
                user = await _ensure_user(session, tg)
                task = await commit_parsed(session, user, parsed)
                await _sync_reminders(session, task)
                await session.commit()
                await session.refresh(task)
            results.append((parsed, task, tz_name))
        except Exception:
            log.exception("failed to create task from parsed: %s", parsed.title)

    if not results:
        err = (
            "Не удалось создать задачи — попробуй ещё раз." if ru
            else "Couldn't create the tasks — please try again."
        )
        await message.answer(err, reply_markup=_open_app_kb(ru=ru))
        return

    # Single task — show with action buttons
    if len(results) == 1:
        parsed, task, tz = results[0]
        await message.answer(
            _format_task_confirmation(parsed, task, tz, ru=ru),
            reply_markup=_task_actions_kb(task.id, ru=ru),
        )
        return

    # Multiple tasks — show summary
    header = (
        f"✅ <b>Создано задач: {len(results)}</b>"
        if ru else
        f"✅ <b>Tasks created: {len(results)}</b>"
    )
    lines = [header + "\n"]
    for i, (parsed, task, tz) in enumerate(results, 1):
        summary = format_summary(parsed, tz)
        priority_label = ""
        if task.priority == 1:
            priority_label = " 🟢"
        elif task.priority == 2:
            priority_label = " 🟡"
        elif task.priority == 3:
            priority_label = " 🔴"
        line = f"{i}. <b>{_escape(task.title)}</b>"
        if summary:
            line += f" · {_escape(summary)}"
        line += priority_label
        lines.append(line)

    await message.answer(
        "\n".join(lines),
        reply_markup=_open_app_kb(ru=ru),
    )


@dp.callback_query(F.data.startswith("del:"))
async def cb_delete_task(cq: CallbackQuery) -> None:
    ru = _is_ru(cq=cq)
    if cq.data is None or cq.from_user is None:
        await cq.answer()
        return
    try:
        task_id = int(cq.data.split(":", 1)[1])
    except (ValueError, IndexError):
        await cq.answer("неверный id" if ru else "invalid id", show_alert=False)
        return
    sm = get_sessionmaker()
    async with sm() as session:
        task = await session.get(Task, task_id)
        if task is None or task.user_id != cq.from_user.id:
            await cq.answer("задача не найдена" if ru else "task not found", show_alert=False)
            return
        await session.delete(task)
        await session.commit()
    deleted_text = "❌ Задача отменена." if ru else "❌ Task cancelled."
    if cq.message:
        try:
            await cq.message.edit_text(deleted_text)
        except Exception:  # noqa: BLE001
            await cq.message.answer(deleted_text)
    await cq.answer("удалено" if ru else "deleted")


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
            try:
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
            finally:
                import contextlib
                import os

                with contextlib.suppress(OSError):
                    os.unlink(wav_path)

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
    ru = _is_ru(message=message)
    settings = get_settings()
    bot = message.bot
    if bot is None or message.voice is None:
        return

    if message.from_user:
        sm = get_sessionmaker()
        async with sm() as session:
            if not await is_premium(session, message.from_user.id):
                msg = (
                    "💎 Добавление задач через голосовые "
                    "сообщения доступно с Premium-подпиской."
                ) if ru else (
                    "💎 Adding tasks via voice messages is "
                    "available with a Premium subscription."
                )
                await message.answer(
                    msg,
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[[
                            InlineKeyboardButton(
                                text="💎 Купить Premium" if ru else "💎 Buy Premium",
                                callback_data="show_premium",
                            )
                        ]]
                    ),
                )
                return

    await message.answer(
        "🎙 Распознаю голосовое сообщение…" if ru
        else "🎙 Recognizing voice message…"
    )

    try:
        file = await bot.get_file(message.voice.file_id)
        if file.file_path is None:
            await message.answer(
                "Не удалось скачать голосовое сообщение." if ru
                else "Couldn't download the voice message."
            )
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
                (
                    "Не удалось распознать текст из голосового. "
                    "Попробуй ещё раз или напиши текстом."
                ) if ru else (
                    "Couldn't recognize text from voice. "
                    "Try again or type it out."
                ),
                reply_markup=_open_app_kb(ru=ru),
            )
            return

        await _handle_task_text(message, text)
    except Exception:
        log.exception("voice transcription failed")
        await message.answer(
            "Ой, не получилось распознать голосовое — попробуй ещё раз чуть позже." if ru
            else "Oops, couldn't recognize the voice message — try again later.",
            reply_markup=_open_app_kb(ru=ru),
        )


async def configure_bot_commands(bot: Bot) -> None:
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Приветствие"),
            BotCommand(command="new", description="Добавить задачу из чата"),
            BotCommand(command="premium", description="Купить Premium"),
            BotCommand(command="app", description="Открыть Mini App"),
            BotCommand(command="new", description="Создать задачу из текста"),
            BotCommand(command="privacy", description="Приватность"),
            BotCommand(command="support", description="Поддержка"),
            BotCommand(command="help", description="Помощь"),
        ],
        language_code="ru",
    )
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Welcome"),
            BotCommand(command="new", description="Add a task from chat"),
            BotCommand(command="premium", description="Buy Premium"),
            BotCommand(command="app", description="Open Mini App"),
            BotCommand(command="privacy", description="Privacy"),
            BotCommand(command="support", description="Support"),
            BotCommand(command="help", description="Help"),
        ],
    )
