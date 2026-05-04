import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type PlansOut, type SubscriptionStatus } from "../api";
import { useI18n } from "../i18n";
import {
  CheckIcon,
  ChevronLeftIcon,
} from "../icons";

function PremiumIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7d774" />
          <stop offset="1" stopColor="#c9952a" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="28" fill="url(#pg)" opacity="0.15" />
      <path
        d="M28 12l4.5 9.5L43 23l-7.5 7 2 10.5L28 35.5 18.5 40.5l2-10.5L13 23l10.5-1.5z"
        fill="url(#pg)"
      />
    </svg>
  );
}

export function SubscriptionPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<PlansOut | null>(null);
  const [botUsername, setBotUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("12m");
  const [buying, setBuying] = useState(false);

  const PLANS = [
    { key: "1m", label: t("sub.1m"), stars: 99, perMonth: 99 },
    {
      key: "3m", label: t("sub.3m"), stars: 249,
      perMonth: 83, save: "16%",
    },
    {
      key: "12m", label: t("sub.12m"), stars: 799,
      perMonth: 67, save: "33%", best: true,
    },
  ];

  useEffect(() => {
    void (async () => {
      try {
        const [s, p, bi] = await Promise.all([
          api.subscriptionStatus(),
          api.subscriptionPlans(),
          api.botInfo(),
        ]);
        setStatus(s);
        setPlans(p);
        setBotUsername(bi.bot_username);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  const handleBuy = async () => {
    const tgWebApp = window.Telegram?.WebApp;
    setBuying(true);
    try {
      const { invoice_url } = await api.createInvoice(selectedPlan);
      if (tgWebApp?.openInvoice) {
        tgWebApp.openInvoice(invoice_url, (invoiceStatus) => {
          if (invoiceStatus === "paid") {
            void api.subscriptionStatus().then(setStatus);
          }
          setBuying(false);
        });
      } else {
        window.open(invoice_url, "_blank");
        setBuying(false);
      }
    } catch (e) {
      setError(String(e));
      setBuying(false);
    }
  };

  if (error) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__title">{t("sub.error")}</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!status || !plans) {
    return <div className="spinner">{t("loading")}</div>;
  }

  const currentPlan = PLANS.find((p) => p.key === selectedPlan) ?? PLANS[0];
  const locale = lang === "ru" ? "ru-RU" : "en-US";

  const premiumLink = botUsername
    ? `https://t.me/${botUsername}?start=premium`
    : "#";

  return (
    <div className="page">
      <div className="page-header">
        <button
          type="button"
          className="page-header__back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ChevronLeftIcon />
          <span>{t("sub.back")}</span>
        </button>
        <div className="page-header__stack">
          <div className="page-header__title-row">
            <h1>{t("sub.title")}</h1>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="premium-hero">
        <PremiumIcon size={64} />
        {status.is_premium && status.subscription ? (
          <>
            <h2 className="premium-hero__title">{t("sub.active")}</h2>
            <p className="premium-hero__sub">
              {status.subscription.expires_at
                ? `${t("sub.active_until")} ${new Date(status.subscription.expires_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}`
                : t("sub.lifetime")}
            </p>
          </>
        ) : (
          <>
            <h2 className="premium-hero__title">{t("sub.unlock")}</h2>
            <p className="premium-hero__sub">
              {t("sub.unlock_sub")}
            </p>
          </>
        )}
      </div>

      {/* Features */}
      <div className="surface premium-features" style={{ marginBottom: 14 }}>
        <div className="surface__heading">{t("sub.features_heading")}</div>
        <ul className="premium-features__list">
          {plans.premium.features.map((f, i) => (
            <li key={i}>
              <span className="premium-features__check"><CheckIcon /></span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing tiers */}
      {!status.is_premium && (
        <div style={{ marginBottom: 14 }}>
          <div className="surface__heading" style={{ padding: "0 16px", marginBottom: 8 }}>
            {t("sub.pick_plan")}
          </div>
          <div className="premium-tiers">
            {PLANS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={
                  `premium-tier` +
                  (p.best ? " premium-tier--best" : "") +
                  (selectedPlan === p.key ? " premium-tier--selected" : "")
                }
                onClick={() => setSelectedPlan(p.key)}
              >
                {p.best && <span className="premium-tier__badge">{t("sub.best")}</span>}
                {p.save && !p.best && (
                  <span className="premium-tier__badge premium-tier__badge--save">
                    −{p.save}
                  </span>
                )}
                <div className="premium-tier__label">{p.label}</div>
                <div className="premium-tier__price">
                  <span className="premium-tier__stars">{p.stars}</span>
                  <span className="premium-tier__currency"> ⭐</span>
                </div>
                <div className="premium-tier__per-month">
                  {p.perMonth} {t("sub.per_month")}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="premium-buy-btn"
            disabled={buying}
            onClick={() => void handleBuy()}
          >
            {buying
              ? t("sub.buy_loading")
              : `💎 ${t("sub.buy")} ${currentPlan.stars} ⭐`}
          </button>
          <p className="premium-buy-hint">
            {t("sub.buy_hint")}
          </p>
          <a
            className="premium-bot-link"
            href={premiumLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("sub.buy_bot")}
          </a>
        </div>
      )}

      {/* Usage */}
      {!status.is_premium && (
        <div className="surface" style={{ marginBottom: 14 }}>
          <div className="surface__heading">{t("sub.usage")}</div>
          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>{t("sub.tasks_today")}</span>
              <span><b>{status.daily_tasks_count}</b> / {status.max_daily_tasks}</span>
            </div>
            <div className="premium-bar">
              <div
                className="premium-bar__fill"
                style={{
                  width: `${Math.min(100, (status.daily_tasks_count / status.max_daily_tasks) * 100)}%`,
                  background: status.daily_tasks_count >= status.max_daily_tasks
                    ? "var(--tb-danger)"
                    : "var(--tb-accent-strong)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Free plan comparison */}
      <div className="surface" style={{ marginBottom: 14, opacity: status.is_premium ? 0.5 : 0.7 }}>
        <div className="surface__heading">{t("sub.free_plan")}</div>
        <ul className="premium-features__list">
          {plans.free.features.map((f, i) => (
            <li key={i} style={{ opacity: 0.7 }}>
              <span className="premium-features__check" style={{ opacity: 0.4 }}><CheckIcon /></span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
