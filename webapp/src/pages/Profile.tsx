import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";

import { api, type Category, type PrivacyInfo, type Task } from "../api";
import { TaskRow } from "../components/TaskRow";
import {
  ArchiveIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  HelpIcon,
  MonitorIcon,
  MoonIcon,
  RotateCcwIcon,
  ShieldIcon,
  SparkIcon,
  SunIcon,
  UserIcon,
} from "../icons";
import { applyTheme, getStoredMode, setStoredMode, type ThemeMode } from "../theme";

const SUPPORT_TG = "@ficsyk";
const SUPPORT_TG_URL = "https://t.me/ficsyk";

function ProfileHome({ onResetOnboarding }: { onResetOnboarding?: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ThemeMode>(() => getStoredMode());

  function pick(next: ThemeMode) {
    setMode(next);
    setStoredMode(next);
    applyTheme(next);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <span className="page-header__eyebrow">
            <UserIcon /> profile
          </span>
          <div className="page-header__title-row">
            <h1>Профиль</h1>
          </div>
          <div className="page-header__subtitle">
            Тема приложения, поддержка и приватность — всё на одной полке.
          </div>
        </div>
      </div>

      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="surface__heading">
          <SparkIcon /> Тема
        </div>
        <p className="page-header__subtitle" style={{ marginTop: 4, marginBottom: 12 }}>
          По умолчанию следуем за оформлением Telegram. Можно зафиксировать
          светлую или тёмную.
        </p>
        <div className="theme-grid">
          <ThemeOption
            active={mode === "system"}
            label="Системная"
            hint="как в Telegram"
            icon={<MonitorIcon />}
            onClick={() => pick("system")}
          />
          <ThemeOption
            active={mode === "light"}
            label="Светлая"
            hint="белая, дневная"
            icon={<SunIcon />}
            onClick={() => pick("light")}
          />
          <ThemeOption
            active={mode === "dark"}
            label="Тёмная"
            hint="ночной режим"
            icon={<MoonIcon />}
            onClick={() => pick("dark")}
          />
        </div>
      </div>

      <div className="surface" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className="onboarding-reset-btn"
          onClick={async () => {
            try {
              await api.updateMeFields({ onboarding_completed: false });
            } catch {
              // best-effort
            }
            if (onResetOnboarding) onResetOnboarding();
            navigate("/all");
          }}
        >
          <RotateCcwIcon /> Пройти обучение заново
        </button>
      </div>

      <div className="surface" style={{ padding: 0, marginBottom: 14 }}>
        <NavRow
          to="/profile/archive"
          icon={<ArchiveIcon />}
          title="Архив задач"
          subtitle="Выполненные и убранные вручную"
        />
        <div className="nav-row__divider" />
        <NavRow
          to="/profile/support"
          icon={<HelpIcon />}
          title="Поддержка"
          subtitle={`Связаться с автором — ${SUPPORT_TG}`}
        />
        <div className="nav-row__divider" />
        <NavRow
          to="/profile/privacy"
          icon={<ShieldIcon />}
          title="Приватность"
          subtitle="Что хранится и кто это видит"
        />
      </div>
    </div>
  );
}

function ThemeOption(props: {
  active: boolean;
  label: string;
  hint: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`theme-option ${props.active ? "theme-option--active" : ""}`}
    >
      <span className="theme-option__icon">{props.icon}</span>
      <span className="theme-option__label">{props.label}</span>
      <span className="theme-option__hint">{props.hint}</span>
      {props.active && (
        <span className="theme-option__badge" aria-hidden>
          <CheckIcon />
        </span>
      )}
    </button>
  );
}

function NavRow(props: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link to={props.to} className="nav-row">
      <span className="nav-row__icon">{props.icon}</span>
      <span className="nav-row__text">
        <span className="nav-row__title">{props.title}</span>
        <span className="nav-row__subtitle">{props.subtitle}</span>
      </span>
      <span className="nav-row__chevron" aria-hidden>
        <ArrowRightIcon />
      </span>
    </Link>
  );
}

function BackHeader(props: { eyebrow: string; title: string; subtitle: string }) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      <button
        type="button"
        className="page-header__back"
        onClick={() => navigate(-1)}
        aria-label="Назад"
      >
        <ChevronLeftIcon />
        <span>Профиль</span>
      </button>
      <div className="page-header__stack">
        <span className="page-header__eyebrow">{props.eyebrow}</span>
        <div className="page-header__title-row">
          <h1>{props.title}</h1>
        </div>
        <div className="page-header__subtitle">{props.subtitle}</div>
      </div>
    </div>
  );
}

function SupportPage() {
  return (
    <div className="page">
      <BackHeader
        eyebrow="поддержка"
        title="Поддержка"
        subtitle="Если что-то сломалось или есть идея — напиши автору."
      />

      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="surface__heading">
          <UserIcon /> Связь с автором
        </div>
        <p className="page-header__subtitle" style={{ marginTop: 4, marginBottom: 12 }}>
          Telegram — самый быстрый способ. Опиши, что именно произошло, и
          приложи скриншот, если можно.
        </p>
        <a
          href={SUPPORT_TG_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="contact-pill"
        >
          <span className="contact-pill__avatar">
            <UserIcon />
          </span>
          <span className="contact-pill__text">
            <span className="contact-pill__handle">{SUPPORT_TG}</span>
            <span className="contact-pill__hint">тапни, чтобы открыть чат</span>
          </span>
          <span className="contact-pill__chevron" aria-hidden>
            <ArrowRightIcon />
          </span>
        </a>
      </div>

      <div className="surface">
        <div className="surface__heading">
          <HelpIcon /> Команды бота
        </div>
        <ul className="bullet">
          <li>
            <CheckIcon /> <code>/help</code> — короткая справка по приложению.
          </li>
          <li>
            <CheckIcon /> <code>/privacy</code> — что хранится и кто это видит.
          </li>
          <li>
            <CheckIcon /> <code>/support</code> — как со мной связаться.
          </li>
        </ul>
      </div>
    </div>
  );
}

function PrivacyPage() {
  const [info, setInfo] = useState<PrivacyInfo | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setInfo(await api.privacy());
      } catch {
        setInfo({
          support_label: "Поддержка и приватность",
          support_text:
            "Если что-то не работает, напиши владельцу бота. Данные внутри Mini App " +
            "хранятся отдельно для каждого Telegram-пользователя.",
          privacy_summary:
            "У каждого пользователя свои задачи, категории и подзадачи. Доступ к данным " +
            "проверяется по Telegram initData и user id — чужие записи не смешиваются и не " +
            "показываются другим.",
        });
      }
    })();
  }, []);

  return (
    <div className="page">
      <BackHeader
        eyebrow="приватность"
        title="Приватность"
        subtitle="Что хранится, у кого есть доступ и как это устроено."
      />

      <div className="hero-card">
        <h2>Каждому — свой task space</h2>
        <div className="page-header__subtitle" style={{ marginTop: 8 }}>
          {info?.privacy_summary ?? "Загружаем…"}
        </div>
      </div>

      <div className="surface">
        <div className="surface__heading">
          <SparkIcon /> Что внутри
        </div>
        <ul className="bullet">
          <li>
            <CheckIcon /> Задачи, категории и подзадачи разделены по Telegram user id.
          </li>
          <li>
            <CheckIcon /> Данные хранятся в твоей собственной БД, к которой имеет доступ
            только этот сервис.
          </li>
          <li>
            <CheckIcon /> Mini App авторизуется через Telegram <b>initData</b> — без
            логинов и паролей.
          </li>
          <li>
            <CheckIcon /> Никакой публичной ленты, никаких чужих задач — всё видишь
            только ты.
          </li>
        </ul>
      </div>
    </div>
  );
}

function ArchivePage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    void (async () => {
      const [t, c] = await Promise.all([
        api.listTasks({ archived: true }),
        api.listCategories(),
      ]);
      setTasks(t);
      setCats(c);
    })();
  }, []);

  async function unarchive(task: Task) {
    await api.unarchiveTask(task.id);
    setTasks((prev) => (prev ?? []).filter((t) => t.id !== task.id));
  }

  async function remove(task: Task) {
    if (
      !window.confirm(
        `Удалить задачу «${task.title}» навсегда? Это действие нельзя отменить.`,
      )
    )
      return;
    await api.deleteTask(task.id);
    setTasks((prev) => (prev ?? []).filter((t) => t.id !== task.id));
  }

  const catById = new Map(cats.map((c) => [c.id, c] as const));

  return (
    <div className="page">
      <BackHeader
        eyebrow="архив"
        title="Архив задач"
        subtitle="Сюда попадают выполненные задачи старше 24 часов и всё, что ты убрал вручную."
      />

      <div className="archive-hero">
        <span className="archive-hero__icon">
          <ArchiveIcon />
        </span>
        <div>
          <div className="archive-hero__title">
            {tasks ? `${tasks.length} в архиве` : "Загружаем…"}
          </div>
          <div className="archive-hero__hint">
            Свайпни влево → «Вернуть» или «Удалить».
          </div>
        </div>
      </div>

      {tasks && tasks.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <ArchiveIcon />
          </div>
          <div className="empty__title">Архив пуст</div>
          <div>Сюда уходит всё, что ты пометишь как «В архив».</div>
        </div>
      )}

      {tasks?.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          category={t.category_id ? catById.get(t.category_id) : null}
          onToggle={() => {
            /* no-op in archive */
          }}
          onUnarchive={unarchive}
          onDelete={remove}
          hideArrow
        />
      ))}
    </div>
  );
}

export function ProfileRoutes({ onResetOnboarding }: { onResetOnboarding?: () => void }) {
  return (
    <Routes>
      <Route index element={<ProfileHome onResetOnboarding={onResetOnboarding} />} />
      <Route path="archive" element={<ArchivePage />} />
      <Route path="support" element={<SupportPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
    </Routes>
  );
}
