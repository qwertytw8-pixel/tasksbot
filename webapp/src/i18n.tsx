import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { getUserLanguage } from "./telegram";

export type Lang = "ru" | "en";

const LS_KEY = "taskblo_lang";
const HORIZON_LS_KEY = "taskblo_horizon";

function getStoredLang(): Lang {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === "ru" || v === "en") return v;
  } catch { /* ignore */ }
  return getUserLanguage();
}

export function getStoredHorizon(): number {
  try {
    const v = localStorage.getItem(HORIZON_LS_KEY);
    if (v) {
      const n = Number(v);
      if ([7, 14, 30, 90, 0].includes(n)) return n;
    }
  } catch { /* ignore */ }
  return 0; // 0 = all
}

export function setStoredHorizon(days: number): void {
  try { localStorage.setItem(HORIZON_LS_KEY, String(days)); } catch { /* ignore */ }
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "ru",
  setLang: () => {},
  t: (k) => k,
});

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LS_KEY, l); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict = lang === "ru" ? ru : en;
      return (dict as Record<string, string>)[key] ?? key;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ── Russian ──────────────────────────────────────────────────────────

const ru: Record<string, string> = {
  // App / TabBar
  "tab.all": "Все",
  "tab.today": "Сегодня",
  "tab.calendar": "Календарь",
  "tab.profile": "Профиль",
  "fab.label": "Новая задача",
  "loading": "Загрузка…",

  // All page
  "all.title": "Все",
  "all.subtitle": "Полная лента задач: просроченное, ближайшее и всё, что ждёт даты.",
  "all.focus": "В фокусе",
  "all.overdue": "Просрочено",
  "all.closed": "Закрыто",
  "all.filter_all": "Все",
  "all.empty_title": "Чисто",
  "all.empty_text": "Добавь первую задачу круглой кнопкой внизу.",
  "section.overdue": "Просрочено",
  "section.today": "Сегодня",
  "section.tomorrow": "Завтра",
  "section.week": "Ближайшие 7 дней",
  "section.later": "Позже",
  "section.undated": "Без даты",
  "section.done": "Готово сегодня",

  // Today page
  "today.title": "Сегодня",
  "today.subtitle": "Спокойный обзор дня: главное, просроченное и всё, что ждёт внимания.",
  "today.focus": "В фокусе",
  "today.closed": "Закрыто",
  "today.empty_title": "Чисто и спокойно",
  "today.empty_text": "Пока задач нет. Нажми на круглую кнопку внизу и добавь первую.",
  "today.section_overdue": "Просрочено",
  "today.section_today": "На сегодня",
  "today.section_inbox": "Без даты",
  "today.section_done": "Готово сегодня",
  "today.error": "Ошибка",

  // Focus widget
  "focus.title": "Фокус дня",
  "focus.empty": "Нет задач на сегодня",

  // Calendar page
  "calendar.title": "Календарь",
  "calendar.subtitle": "Тапни по числу — увидишь задачи на этот день и сможешь добавить новую.",
  "calendar.prev_month": "Предыдущий месяц",
  "calendar.next_month": "Следующий месяц",
  "calendar.list": "Список",
  "calendar.hourly": "По часам",
  "calendar.new": "Новая",
  "calendar.empty_title": "На этот день пусто",
  "calendar.empty_text": "Жми «Новая задача», чтобы добавить дело на этот день.",
  "calendar.subtasks_label": "подзадачи на этот день",
  "calendar.all_day": "Весь день",

  // Date picker
  "dp.today": "Сегодня",
  "dp.tomorrow": "Завтра",

  // Profile page
  "profile.title": "Профиль",
  "profile.subtitle": "Подписка, тема, поддержка и приватность — всё на одной полке.",
  "profile.premium_active": "💎 Premium активен",
  "profile.premium": "💎 Premium",
  "profile.premium_until": "До",
  "profile.premium_lifetime": "Бессрочная",
  "profile.premium_unlock": "Разблокируй все возможности",
  "profile.promo": "Промокод",
  "profile.promo_placeholder": "Введи промокод",
  "profile.promo_activate": "Активировать",
  "profile.promo_not_found": "Промокод не найден",
  "profile.promo_used": "Промокод уже использован или исчерпан",
  "profile.theme": "Тема",
  "profile.theme_hint": "По умолчанию следуем за оформлением Telegram. Можно зафиксировать светлую или тёмную.",
  "profile.theme_system": "Системная",
  "profile.theme_system_hint": "как в Telegram",
  "profile.theme_light": "Светлая",
  "profile.theme_light_hint": "белая, дневная",
  "profile.theme_dark": "Тёмная",
  "profile.theme_dark_hint": "ночной режим",
  "profile.settings": "Настройки",
  "profile.lang_label": "Язык",
  "profile.horizon_label": "Горизонт задач",
  "profile.horizon_hint": "Сколько дней вперёд показывать во вкладке «Все»",
  "profile.horizon_all": "Все",
  "profile.horizon_days": "дн.",
  "profile.archive": "Архив задач",
  "profile.archive_sub": "Выполненные и убранные вручную",
  "profile.support": "Поддержка",
  "profile.support_sub": "Связаться с автором —",
  "profile.privacy": "Приватность",
  "profile.privacy_sub": "Что хранится и кто это видит",
  "profile.reset_onboarding": "Пройти обучение заново",
  "profile.admin": "👑 Админ-панель",
  "profile.admin_sub": "Статистика, промокоды, управление пользователями",
  "profile.back": "Профиль",

  // Support page
  "support.title": "Поддержка",
  "support.subtitle": "Если что-то сломалось или есть идея — напиши автору.",
  "support.contact": "Связь с автором",
  "support.contact_hint": "Telegram — самый быстрый способ. Опиши, что именно произошло, и приложи скриншот, если можно.",
  "support.tap_to_open": "тапни, чтобы открыть чат",
  "support.commands": "Команды бота",
  "support.cmd_help": "/help — короткая справка по приложению.",
  "support.cmd_privacy": "/privacy — что хранится и кто это видит.",
  "support.cmd_support": "/support — как со мной связаться.",

  // Privacy page
  "privacy.title": "Приватность",
  "privacy.subtitle": "Что хранится, у кого есть доступ и как это устроено.",
  "privacy.hero": "Каждому — свой task space",
  "privacy.fallback_summary": "У каждого пользователя свои задачи, категории и подзадачи. Доступ к данным проверяется по Telegram initData и user id — чужие записи не смешиваются и не показываются другим.",
  "privacy.fallback_label": "Поддержка и приватность",
  "privacy.fallback_text": "Если что-то не работает, напиши владельцу бота. Данные внутри Mini App хранятся отдельно для каждого Telegram-пользователя.",
  "privacy.inside": "Что внутри",
  "privacy.p1": "Задачи, категории и подзадачи разделены по Telegram user id.",
  "privacy.p2": "Данные хранятся в твоей собственной БД, к которой имеет доступ только этот сервис.",
  "privacy.p3": "Mini App авторизуется через Telegram initData — без логинов и паролей.",
  "privacy.p4": "Никакой публичной ленты, никаких чужих задач — всё видишь только ты.",

  // Archive page
  "archive.title": "Архив задач",
  "archive.subtitle": "Сюда попадают выполненные задачи старше 24 часов и всё, что ты убрал вручную.",
  "archive.count": "в архиве",
  "archive.hint": "Свайпни влево → «Вернуть» или «Удалить».",
  "archive.empty_title": "Архив пуст",
  "archive.empty_text": "Сюда уходит всё, что ты пометишь как «В архив».",

  // Task form
  "form.new": "Новая задача",
  "form.edit": "Задача",
  "form.subtitle": "Заголовок, категория и при желании дата, время или ссылка на проект.",
  "form.close": "Закрыть",
  "form.title_label": "Что нужно сделать",
  "form.title_placeholder": "Например: Созвон с командой",
  "form.desc_label": "Описание",
  "form.desc_placeholder": "Короткий контекст, если нужен",
  "form.category": "Категория",
  "form.cat_none": "Без",
  "form.cat_new": "Новая",
  "form.cat_name_placeholder": "Название",
  "form.cat_add": "Добавить",
  "form.priority": "Важность",
  "form.priority_none": "Без",
  "form.priority_low": "Низкий",
  "form.priority_med": "Средний",
  "form.priority_high": "Высокий",
  "form.when": "Когда",
  "form.when_none": "Без даты",
  "form.when_date": "Дата",
  "form.add_time": "Добавить время",
  "form.remind": "Напомнить",
  "form.remind_off": "Без",
  "form.remind_on_time": "Вовремя",
  "form.remind_before": "Заранее",
  "form.remind_before_premium": "Заранее 💎",
  "form.remind_feature": "Напоминание заранее",
  "form.remind_minutes": "минут до начала",
  "form.remind_5m": "5 мин",
  "form.remind_15m": "15 мин",
  "form.remind_30m": "30 мин",
  "form.remind_1h": "1 ч",
  "form.remind_3h": "3 ч",
  "form.remind_1d": "1 день",
  "form.recurrence": "Повторение",
  "form.rec_none": "Без",
  "form.rec_daily": "День",
  "form.rec_weekly": "Неделя",
  "form.rec_monthly": "Месяц",
  "form.project": "Часть проекта",
  "form.project_standalone": "Самостоятельная",
  "form.project_hint": "Можно вложить задачу в большой проект — например, проект «Сайт» и задача «Текст на главную».",
  "form.save": "Сохранить",
  "form.add_task": "Добавить задачу",
  "form.delete_task": "Удалить задачу",
  "form.delete_subtask": "Удалить подзадачу",
  "form.subtasks": "Подзадачи",
  "form.subtasks_hint": "Дроби крупную задачу на шаги — каждый можно отметить отдельно.",
  "form.subtask_placeholder": "Название подзадачи",
  "form.add_subtask": "Добавить подзадачу",
  "form.daily_limit_alert": "Дневной лимит задач исчерпан.",
  "form.remind_unit": "минут до начала",

  // Confirm dialogs
  "confirm.delete_task": "Удалить задачу «{title}»?",
  "confirm.delete_task_subs": "Удалить задачу? Подзадачи тоже будут удалены.",
  "confirm.delete_subtask": "Удалить подзадачу?",
  "confirm.delete_archive": "Удалить задачу «{title}» навсегда? Это действие нельзя отменить.",
  "confirm.delete_category": "Удалить категорию?",

  // Categories page
  "cat.title": "Категории",
  "cat.subtitle": "Собери свой рабочий ритм: личное, созвоны, спорт, дедлайны — как удобно тебе.",
  "cat.name": "Название",
  "cat.name_placeholder": "Напр. Спорт",
  "cat.emoji": "Эмодзи",
  "cat.color": "Цвет",
  "cat.add": "Добавить категорию",
  "cat.empty_title": "Категорий пока нет",
  "cat.empty_text": "Создай первую, чтобы задачи выглядели аккуратнее и были легче для навигации.",
  "cat.delete": "Удалить",

  // Subscription page
  "sub.title": "Premium",
  "sub.back": "Профиль",
  "sub.active": "Premium активен",
  "sub.active_until": "Действует до",
  "sub.lifetime": "Бессрочная подписка",
  "sub.unlock": "Разблокируй всё",
  "sub.unlock_sub": "Безлимитные задачи, свои категории, AI-парсинг текста и голоса",
  "sub.features_heading": "Что входит в Premium",
  "sub.pick_plan": "Выбери тариф",
  "sub.best": "Выгодно",
  "sub.per_month": "⭐/мес",
  "sub.buy": "Оплатить",
  "sub.buy_loading": "Загрузка…",
  "sub.buy_hint": "Оплата через Telegram Stars — безопасно и мгновенно",
  "sub.buy_bot": "Или оплатить в чате с ботом →",
  "sub.usage": "📊 Использование сегодня",
  "sub.tasks_today": "Задач создано сегодня",
  "sub.free_plan": "Free план",
  "sub.error": "Ошибка",
  "sub.1m": "1 месяц",
  "sub.3m": "3 месяца",
  "sub.12m": "12 месяцев",

  // Limit modal
  "limit.daily_title": "Дневной лимит задач",
  "limit.premium_title": "Доступно в Premium",
  "limit.daily_text_before": "Ты создал",
  "limit.daily_text_of": "из",
  "limit.daily_text_after": "задач сегодня на бесплатном плане. Создание новых задач будет доступно завтра.",
  "limit.premium_text_after": "доступна только с подпиской Premium.",
  "limit.premium_text_default": "Эта функция",
  "limit.features_title": "С Premium ты получишь:",
  "limit.f1": "Безлимитные задачи каждый день",
  "limit.f2": "Свои категории",
  "limit.f3": "Создавай задачи прямо из чата",
  "limit.f4": "Создавай задачи голосовым сообщением",
  "limit.f5": "Настраивай напоминания заранее",
  "limit.f6": "Подзадачи без ограничений",
  "limit.buy": "💎 Купить подписку",
  "limit.close": "Закрыть",

  // TaskRow
  "task.overdue": "Просрочено",
  "task.just_now": "только что",
  "task.min": "мин",
  "task.hr": "ч",
  "task.day_short": "дн",
  "task.by": "на",
  "task.by_1_day": "на 1 день",
  "task.tomorrow": "Завтра",
  "task.done": "Готово",
  "task.undone": "Вернуть",
  "task.archive": "В архив",
  "task.restore": "Вернуть",
  "task.delete": "Удалить",
  "task.mark_done": "Отметить выполненной",
  "task.mark_undone": "Отметить невыполненной",

  // Months / weekdays
  "month.0": "Январь", "month.1": "Февраль", "month.2": "Март",
  "month.3": "Апрель", "month.4": "Май", "month.5": "Июнь",
  "month.6": "Июль", "month.7": "Август", "month.8": "Сентябрь",
  "month.9": "Октябрь", "month.10": "Ноябрь", "month.11": "Декабрь",
  "wd.0": "Пн", "wd.1": "Вт", "wd.2": "Ср", "wd.3": "Чт",
  "wd.4": "Пт", "wd.5": "Сб", "wd.6": "Вс",
};

// ── English ──────────────────────────────────────────────────────────

const en: Record<string, string> = {
  // App / TabBar
  "tab.all": "All",
  "tab.today": "Today",
  "tab.calendar": "Calendar",
  "tab.profile": "Profile",
  "fab.label": "New task",
  "loading": "Loading…",

  // All page
  "all.title": "All",
  "all.subtitle": "Full task feed: overdue, upcoming, and everything awaiting a date.",
  "all.focus": "In focus",
  "all.overdue": "Overdue",
  "all.closed": "Closed",
  "all.filter_all": "All",
  "all.empty_title": "All clear",
  "all.empty_text": "Add your first task with the round button below.",
  "section.overdue": "Overdue",
  "section.today": "Today",
  "section.tomorrow": "Tomorrow",
  "section.week": "Next 7 days",
  "section.later": "Later",
  "section.undated": "No date",
  "section.done": "Done today",

  // Today page
  "today.title": "Today",
  "today.subtitle": "A calm overview of your day: what matters, what's overdue, and what needs attention.",
  "today.focus": "In focus",
  "today.closed": "Closed",
  "today.empty_title": "All clear",
  "today.empty_text": "No tasks yet. Tap the round button below to add your first.",
  "today.section_overdue": "Overdue",
  "today.section_today": "For today",
  "today.section_inbox": "No date",
  "today.section_done": "Done today",
  "today.error": "Error",

  // Focus widget
  "focus.title": "Today's focus",
  "focus.empty": "No tasks for today",

  // Calendar page
  "calendar.title": "Calendar",
  "calendar.subtitle": "Tap a date to see tasks for that day and add new ones.",
  "calendar.prev_month": "Previous month",
  "calendar.next_month": "Next month",
  "calendar.list": "List",
  "calendar.hourly": "Hourly",
  "calendar.new": "New",
  "calendar.empty_title": "Nothing for this day",
  "calendar.empty_text": "Tap «New task» to add something for this day.",
  "calendar.subtasks_label": "subtasks for this day",
  "calendar.all_day": "All day",

  // Date picker
  "dp.today": "Today",
  "dp.tomorrow": "Tomorrow",

  // Profile page
  "profile.title": "Profile",
  "profile.subtitle": "Subscription, theme, support, and privacy — all in one place.",
  "profile.premium_active": "💎 Premium active",
  "profile.premium": "💎 Premium",
  "profile.premium_until": "Until",
  "profile.premium_lifetime": "Lifetime",
  "profile.premium_unlock": "Unlock all features",
  "profile.promo": "Promo code",
  "profile.promo_placeholder": "Enter promo code",
  "profile.promo_activate": "Activate",
  "profile.promo_not_found": "Promo code not found",
  "profile.promo_used": "Promo code already used or expired",
  "profile.theme": "Theme",
  "profile.theme_hint": "By default follows Telegram's theme. You can lock light or dark.",
  "profile.theme_system": "System",
  "profile.theme_system_hint": "as in Telegram",
  "profile.theme_light": "Light",
  "profile.theme_light_hint": "bright, daytime",
  "profile.theme_dark": "Dark",
  "profile.theme_dark_hint": "night mode",
  "profile.settings": "Settings",
  "profile.lang_label": "Language",
  "profile.horizon_label": "Task horizon",
  "profile.horizon_hint": "How many days ahead to show in the \"All\" tab",
  "profile.horizon_all": "All",
  "profile.horizon_days": "d",
  "profile.archive": "Task archive",
  "profile.archive_sub": "Completed and manually archived",
  "profile.support": "Support",
  "profile.support_sub": "Contact the author —",
  "profile.privacy": "Privacy",
  "profile.privacy_sub": "What is stored and who can see it",
  "profile.reset_onboarding": "Restart onboarding tour",
  "profile.admin": "👑 Admin panel",
  "profile.admin_sub": "Stats, promo codes, user management",
  "profile.back": "Profile",

  // Support page
  "support.title": "Support",
  "support.subtitle": "If something is broken or you have an idea — reach out.",
  "support.contact": "Contact the author",
  "support.contact_hint": "Telegram is the fastest way. Describe what happened and attach a screenshot if possible.",
  "support.tap_to_open": "tap to open chat",
  "support.commands": "Bot commands",
  "support.cmd_help": "/help — quick app guide.",
  "support.cmd_privacy": "/privacy — what is stored and who sees it.",
  "support.cmd_support": "/support — how to reach me.",

  // Privacy page
  "privacy.title": "Privacy",
  "privacy.subtitle": "What is stored, who has access, and how it works.",
  "privacy.hero": "Each user — their own task space",
  "privacy.fallback_summary": "Each user has their own tasks, categories, and subtasks. Access is verified via Telegram initData and user id — records are never mixed or shown to others.",
  "privacy.fallback_label": "Support and privacy",
  "privacy.fallback_text": "If something isn't working, contact the bot owner. Data inside the Mini App is stored separately for each Telegram user.",
  "privacy.inside": "What's inside",
  "privacy.p1": "Tasks, categories, and subtasks are separated by Telegram user id.",
  "privacy.p2": "Data is stored in your own database, accessible only by this service.",
  "privacy.p3": "The Mini App authenticates via Telegram initData — no logins or passwords.",
  "privacy.p4": "No public feed, no other people's tasks — only you can see your data.",

  // Archive page
  "archive.title": "Task archive",
  "archive.subtitle": "Completed tasks older than 24 hours and anything you archived manually.",
  "archive.count": "in archive",
  "archive.hint": "Swipe left → «Restore» or «Delete».",
  "archive.empty_title": "Archive is empty",
  "archive.empty_text": "Everything you mark as «Archive» ends up here.",

  // Task form
  "form.new": "New task",
  "form.edit": "Task",
  "form.subtitle": "Title, category, and optionally a date, time, or project link.",
  "form.close": "Close",
  "form.title_label": "What needs to be done",
  "form.title_placeholder": "e.g. Team call",
  "form.desc_label": "Description",
  "form.desc_placeholder": "Short context, if needed",
  "form.category": "Category",
  "form.cat_none": "None",
  "form.cat_new": "New",
  "form.cat_name_placeholder": "Name",
  "form.cat_add": "Add",
  "form.priority": "Priority",
  "form.priority_none": "None",
  "form.priority_low": "Low",
  "form.priority_med": "Medium",
  "form.priority_high": "High",
  "form.when": "When",
  "form.when_none": "No date",
  "form.when_date": "Date",
  "form.add_time": "Add time",
  "form.remind": "Remind",
  "form.remind_off": "Off",
  "form.remind_on_time": "On time",
  "form.remind_before": "Before",
  "form.remind_before_premium": "Before 💎",
  "form.remind_feature": "Early reminder",
  "form.remind_minutes": "minutes before",
  "form.remind_5m": "5 min",
  "form.remind_15m": "15 min",
  "form.remind_30m": "30 min",
  "form.remind_1h": "1 hr",
  "form.remind_3h": "3 hr",
  "form.remind_1d": "1 day",
  "form.recurrence": "Repeat",
  "form.rec_none": "None",
  "form.rec_daily": "Daily",
  "form.rec_weekly": "Weekly",
  "form.rec_monthly": "Monthly",
  "form.project": "Part of project",
  "form.project_standalone": "Standalone",
  "form.project_hint": "You can nest a task in a bigger project — e.g. project «Website» and task «Homepage copy».",
  "form.save": "Save",
  "form.add_task": "Add task",
  "form.delete_task": "Delete task",
  "form.delete_subtask": "Delete subtask",
  "form.subtasks": "Subtasks",
  "form.subtasks_hint": "Break a big task into steps — each can be checked off separately.",
  "form.subtask_placeholder": "Subtask name",
  "form.add_subtask": "Add subtask",
  "form.daily_limit_alert": "Daily task limit reached.",
  "form.remind_unit": "minutes before",

  // Confirm dialogs
  "confirm.delete_task": "Delete task \"{title}\"?",
  "confirm.delete_task_subs": "Delete task? Subtasks will also be deleted.",
  "confirm.delete_subtask": "Delete subtask?",
  "confirm.delete_archive": "Delete task \"{title}\" permanently? This cannot be undone.",
  "confirm.delete_category": "Delete category?",

  // Categories page
  "cat.title": "Categories",
  "cat.subtitle": "Organize your workflow: personal, calls, sports, deadlines — whatever works for you.",
  "cat.name": "Name",
  "cat.name_placeholder": "e.g. Sports",
  "cat.emoji": "Emoji",
  "cat.color": "Color",
  "cat.add": "Add category",
  "cat.empty_title": "No categories yet",
  "cat.empty_text": "Create your first to keep tasks tidy and easy to navigate.",
  "cat.delete": "Delete",

  // Subscription page
  "sub.title": "Premium",
  "sub.back": "Profile",
  "sub.active": "Premium active",
  "sub.active_until": "Active until",
  "sub.lifetime": "Lifetime subscription",
  "sub.unlock": "Unlock everything",
  "sub.unlock_sub": "Unlimited tasks, custom categories, AI text & voice parsing",
  "sub.features_heading": "What's included in Premium",
  "sub.pick_plan": "Choose a plan",
  "sub.best": "Best value",
  "sub.per_month": "⭐/mo",
  "sub.buy": "Pay",
  "sub.buy_loading": "Loading…",
  "sub.buy_hint": "Payment via Telegram Stars — safe and instant",
  "sub.buy_bot": "Or pay in the bot chat →",
  "sub.usage": "📊 Usage today",
  "sub.tasks_today": "Tasks created today",
  "sub.free_plan": "Free plan",
  "sub.error": "Error",
  "sub.1m": "1 month",
  "sub.3m": "3 months",
  "sub.12m": "12 months",

  // Limit modal
  "limit.daily_title": "Daily task limit",
  "limit.premium_title": "Available in Premium",
  "limit.daily_text_before": "You've created",
  "limit.daily_text_of": "of",
  "limit.daily_text_after": "tasks today on the free plan. You can create new tasks tomorrow.",
  "limit.premium_text_after": "is only available with a Premium subscription.",
  "limit.premium_text_default": "This feature",
  "limit.features_title": "With Premium you get:",
  "limit.f1": "Unlimited tasks every day",
  "limit.f2": "Custom categories",
  "limit.f3": "Create tasks from chat messages",
  "limit.f4": "Create tasks via voice messages",
  "limit.f5": "Set early reminders",
  "limit.f6": "Unlimited subtasks",
  "limit.buy": "💎 Buy subscription",
  "limit.close": "Close",

  // TaskRow
  "task.overdue": "Overdue",
  "task.just_now": "just now",
  "task.min": "min",
  "task.hr": "hr",
  "task.day_short": "d",
  "task.by": "by",
  "task.by_1_day": "by 1 day",
  "task.tomorrow": "Tomorrow",
  "task.done": "Done",
  "task.undone": "Undo",
  "task.archive": "Archive",
  "task.restore": "Restore",
  "task.delete": "Delete",
  "task.mark_done": "Mark as done",
  "task.mark_undone": "Mark as not done",

  // Months / weekdays
  "month.0": "January", "month.1": "February", "month.2": "March",
  "month.3": "April", "month.4": "May", "month.5": "June",
  "month.6": "July", "month.7": "August", "month.8": "September",
  "month.9": "October", "month.10": "November", "month.11": "December",
  "wd.0": "Mo", "wd.1": "Tu", "wd.2": "We", "wd.3": "Th",
  "wd.4": "Fr", "wd.5": "Sa", "wd.6": "Su",
};
