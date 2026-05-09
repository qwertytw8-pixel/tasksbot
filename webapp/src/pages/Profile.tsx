import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";

import { api, type Category, type PrivacyInfo, type SubscriptionStatus, type Task } from "../api";
import { TaskRow } from "../components/TaskRow";
import { useI18n, getStoredHorizon, setStoredHorizon } from "../i18n";
import {
  ArchiveIcon,
  ArrowRightIcon,
  BarChartIcon,
  CheckIcon,
  ChevronLeftIcon,
  HelpIcon,
  MonitorIcon,
  MoonIcon,
  RotateCcwIcon,
  ShieldIcon,
  SparkIcon,
  SunIcon,
  TagIcon,
  UserIcon,
} from "../icons";
import { applyTheme, getStoredMode, setStoredMode, type ThemeMode } from "../theme";

const SUPPORT_TG = "@ficsyk";
const SUPPORT_TG_URL = "https://t.me/ficsyk";

const HORIZON_OPTIONS = [7, 14, 30, 90, 0] as const;

function ProfileHome({ onResetOnboarding }: { onResetOnboarding?: () => void }) {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ThemeMode>(() => getStoredMode());
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [horizon, setHorizonState] = useState(() => getStoredHorizon());

  useEffect(() => {
    void (async () => {
      try {
        const [me, sub] = await Promise.all([api.me(), api.subscriptionStatus()]);
        setSubStatus(sub);
        setIsAdmin(me.is_admin);
      } catch {
        // ignore
      }
    })();
  }, []);

  function pick(next: ThemeMode) {
    setMode(next);
    setStoredMode(next);
    applyTheme(next);
  }

  function pickHorizon(days: number) {
    setHorizonState(days);
    setStoredHorizon(days);
  }

  async function activatePromo() {
    if (!promoCode.trim()) return;
    setPromoBusy(true);
    setPromoMsg(null);
    try {
      const res = await api.activatePromo(promoCode.trim());
      setPromoMsg(res.message);
      setPromoCode("");
      setSubStatus(await api.subscriptionStatus());
    } catch (e) {
      setPromoMsg(String(e).includes("404") ? t("profile.promo_not_found") :
                  String(e).includes("400") ? t("profile.promo_used") :
                  String(e));
    } finally {
      setPromoBusy(false);
    }
  }

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <div className="page-header__title-row">
            <h1>{t("profile.title")}</h1>
          </div>
          <div className="page-header__subtitle">
            {t("profile.subtitle")}
          </div>
        </div>
      </div>

      <div className="surface" style={{ padding: 0, marginBottom: 14 }}>
        <NavRow
          to="/profile/subscription"
          icon={<SparkIcon />}
          title={subStatus?.is_premium ? t("profile.premium_active") : t("profile.premium")}
          subtitle={
            subStatus?.is_premium
              ? subStatus.subscription?.expires_at
                ? `${t("profile.premium_until")} ${new Date(subStatus.subscription.expires_at).toLocaleDateString(locale)}`
                : t("profile.premium_lifetime")
              : t("profile.premium_unlock")
          }
        />
        <div className="nav-row__divider" />
        <NavRow
          to="/referral"
          icon="🎁"
          title={lang === "ru" ? "Пригласи друга" : "Invite a friend"}
          subtitle={lang === "ru" ? "+3 дня Premium за каждого" : "+3 days Premium per friend"}
        />
      </div>


      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="surface__heading">
          <TagIcon /> {t("profile.promo")}
        </div>
        <div className="form">
          <div className="promo-row">
            <input
              className="input"
              placeholder={t("profile.promo_placeholder")}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            />
            <button
              className="btn"
              disabled={promoBusy || !promoCode.trim()}
              onClick={() => void activatePromo()}
            >
              {t("profile.promo_activate")}
            </button>
          </div>
          {promoMsg && (
            <div className="page-header__subtitle" style={{ marginTop: 8 }}>
              {promoMsg}
            </div>
          )}
        </div>
      </div>

      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="surface__heading">
          <SparkIcon /> {t("profile.theme")}
        </div>
        <p className="page-header__subtitle" style={{ marginTop: 4, marginBottom: 12 }}>
          {t("profile.theme_hint")}
        </p>
        <div className="theme-grid">
          <ThemeOption
            active={mode === "system"}
            label={t("profile.theme_system")}
            hint={t("profile.theme_system_hint")}
            icon={<MonitorIcon />}
            onClick={() => pick("system")}
          />
          <ThemeOption
            active={mode === "light"}
            label={t("profile.theme_light")}
            hint={t("profile.theme_light_hint")}
            icon={<SunIcon />}
            onClick={() => pick("light")}
          />
          <ThemeOption
            active={mode === "dark"}
            label={t("profile.theme_dark")}
            hint={t("profile.theme_dark_hint")}
            icon={<MoonIcon />}
            onClick={() => pick("dark")}
          />
        </div>
      </div>

      {/* Settings section */}
      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="surface__heading">
          <MonitorIcon /> {t("profile.settings")}
        </div>

        <div className="settings-row">
          <span className="settings-row__label">{t("profile.lang_label")}</span>
          <div className="segmented segmented--compact">
            <button
              type="button"
              className={`segmented__item ${lang === "ru" ? "segmented__item--active" : ""}`}
              onClick={() => setLang("ru")}
            >
              Русский
            </button>
            <button
              type="button"
              className={`segmented__item ${lang === "en" ? "segmented__item--active" : ""}`}
              onClick={() => setLang("en")}
            >
              English
            </button>
          </div>
        </div>

        <div className="settings-row" style={{ marginTop: 12 }}>
          <span className="settings-row__label">{t("profile.horizon_label")}</span>
          <div className="segmented segmented--compact">
            {HORIZON_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                className={`segmented__item ${horizon === days ? "segmented__item--active" : ""}`}
                onClick={() => pickHorizon(days)}
              >
                {days === 0 ? t("profile.horizon_all") : `${days} ${t("profile.horizon_days")}`}
              </button>
            ))}
          </div>
        </div>
        <p className="page-header__subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
          {t("profile.horizon_hint")}
        </p>
      </div>

      <div className="surface" style={{ padding: 0, marginBottom: 14 }}>
        <NavRow
          to="/profile/report"
          icon={<BarChartIcon />}
          title={t("profile.report")}
          subtitle={t("profile.report_sub")}
        />
        <div className="nav-row__divider" />
        <NavRow
          to="/profile/archive"
          icon={<ArchiveIcon />}
          title={t("profile.archive")}
          subtitle={t("profile.archive_sub")}
        />
        <div className="nav-row__divider" />
        <NavRow
          to="/profile/support"
          icon={<HelpIcon />}
          title={t("profile.support")}
          subtitle={`${t("profile.support_sub")} ${SUPPORT_TG}`}
        />
        <div className="nav-row__divider" />
        <NavRow
          to="/profile/privacy"
          icon={<ShieldIcon />}
          title={t("profile.privacy")}
          subtitle={t("profile.privacy_sub")}
        />
      </div>

      <div className="surface" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className="btn btn--outline"
          style={{ width: "100%" }}
          onClick={() => {
            void api.resetOnboarding().then(() => {
              if (onResetOnboarding) onResetOnboarding();
              navigate("/all");
            });
          }}
        >
          <RotateCcwIcon style={{ width: 16, height: 16, marginRight: 8, verticalAlign: "-3px" }} />
          {t("profile.reset_onboarding")}
        </button>
      </div>

      {isAdmin && (
        <div className="surface" style={{ padding: 0, marginBottom: 14 }}>
          <NavRow
            to="/admin"
            icon={<ShieldIcon />}
            title={t("profile.admin")}
            subtitle={t("profile.admin_sub")}
          />
        </div>
      )}
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
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="page-header">
      <button
        type="button"
        className="page-header__back"
        onClick={() => navigate(-1)}
        aria-label="Back"
      >
        <ChevronLeftIcon />
        <span>{t("profile.back")}</span>
      </button>
      <div className="page-header__stack">
        <div className="page-header__title-row">
          <h1>{props.title}</h1>
        </div>
        <div className="page-header__subtitle">{props.subtitle}</div>
      </div>
    </div>
  );
}

function SupportPage() {
  const { t } = useI18n();
  return (
    <div className="page">
      <BackHeader
        eyebrow="support"
        title={t("support.title")}
        subtitle={t("support.subtitle")}
      />

      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="surface__heading">
          <UserIcon /> {t("support.contact")}
        </div>
        <p className="page-header__subtitle" style={{ marginTop: 4, marginBottom: 12 }}>
          {t("support.contact_hint")}
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
            <span className="contact-pill__hint">{t("support.tap_to_open")}</span>
          </span>
          <span className="contact-pill__chevron" aria-hidden>
            <ArrowRightIcon />
          </span>
        </a>
      </div>

      <div className="surface">
        <div className="surface__heading">
          <HelpIcon /> {t("support.commands")}
        </div>
        <ul className="bullet">
          <li>
            <CheckIcon /> <code>{t("support.cmd_help")}</code>
          </li>
          <li>
            <CheckIcon /> <code>{t("support.cmd_privacy")}</code>
          </li>
          <li>
            <CheckIcon /> <code>{t("support.cmd_support")}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}

function PrivacyPage() {
  const { t } = useI18n();
  const [info, setInfo] = useState<PrivacyInfo | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setInfo(await api.privacy());
      } catch {
        setInfo({
          support_label: t("privacy.fallback_label"),
          support_text: t("privacy.fallback_text"),
          privacy_summary: t("privacy.fallback_summary"),
        });
      }
    })();
  }, []);

  return (
    <div className="page">
      <BackHeader
        eyebrow="privacy"
        title={t("privacy.title")}
        subtitle={t("privacy.subtitle")}
      />

      <div className="hero-card">
        <h2>{t("privacy.hero")}</h2>
        <div className="page-header__subtitle" style={{ marginTop: 8 }}>
          {info?.privacy_summary ?? t("loading")}
        </div>
      </div>

      <div className="surface">
        <div className="surface__heading">
          <SparkIcon /> {t("privacy.inside")}
        </div>
        <ul className="bullet">
          <li><CheckIcon /> {t("privacy.p1")}</li>
          <li><CheckIcon /> {t("privacy.p2")}</li>
          <li><CheckIcon /> {t("privacy.p3")}</li>
          <li><CheckIcon /> {t("privacy.p4")}</li>
        </ul>
      </div>
    </div>
  );
}

function ArchivePage() {
  const { t } = useI18n();
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
    setTasks((prev) => (prev ?? []).filter((item) => item.id !== task.id));
  }

  async function remove(task: Task) {
    if (
      !window.confirm(
        t("confirm.delete_archive").replace("{title}", task.title),
      )
    )
      return;
    await api.deleteTask(task.id);
    setTasks((prev) => (prev ?? []).filter((item) => item.id !== task.id));
  }

  const catById = new Map(cats.map((c) => [c.id, c] as const));

  return (
    <div className="page">
      <BackHeader
        eyebrow="archive"
        title={t("archive.title")}
        subtitle={t("archive.subtitle")}
      />

      <div className="archive-hero">
        <span className="archive-hero__icon">
          <ArchiveIcon />
        </span>
        <div>
          <div className="archive-hero__title">
            {tasks ? `${tasks.length} ${t("archive.count")}` : t("loading")}
          </div>
          <div className="archive-hero__hint">
            {t("archive.hint")}
          </div>
        </div>
      </div>

      {tasks && tasks.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <ArchiveIcon />
          </div>
          <div className="empty__title">{t("archive.empty_title")}</div>
          <div>{t("archive.empty_text")}</div>
        </div>
      )}

      {tasks?.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          category={task.category_id ? catById.get(task.category_id) : null}
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
      <Route path="report" element={<ReportPageLazy />} />
      <Route path="archive" element={<ArchivePage />} />
      <Route path="support" element={<SupportPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="subscription" element={<SubscriptionPageLazy />} />
    </Routes>
  );
}

function ReportPageLazy() {
  const { t } = useI18n();
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    void import("./Report").then((m) => setComp(() => m.ReportPage));
  }, []);
  if (!Comp) return <div className="spinner">{t("loading")}</div>;
  return <Comp />;
}

function SubscriptionPageLazy() {
  const { t } = useI18n();
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    void import("./Subscription").then((m) => setComp(() => m.SubscriptionPage));
  }, []);
  if (!Comp) return <div className="spinner">{t("loading")}</div>;
  return <Comp />;
}
