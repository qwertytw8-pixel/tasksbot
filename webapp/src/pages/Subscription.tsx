import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type PlansOut, type SubscriptionStatus } from "../api";
import {
  CheckIcon,
  ChevronLeftIcon,
} from "../icons";

const PLANS = [
  { key: "1m", label: "1 месяц", stars: 99, perMonth: 99 },
  { key: "3m", label: "3 месяца", stars: 249, perMonth: 83, save: "16%" },
  { key: "12m", label: "12 месяцев", stars: 799, perMonth: 67, save: "33%", best: true },
];

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
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<PlansOut | null>(null);
  const [botUsername, setBotUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__title">Ошибка</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!status || !plans) {
    return <div className="spinner">Загрузка…</div>;
  }

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
          aria-label="Назад"
        >
          <ChevronLeftIcon />
          <span>Профиль</span>
        </button>
        <div className="page-header__stack">
          <div className="page-header__title-row">
            <h1>Premium</h1>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="premium-hero">
        <PremiumIcon size={64} />
        {status.is_premium && status.subscription ? (
          <>
            <h2 className="premium-hero__title">Premium активен</h2>
            <p className="premium-hero__sub">
              {status.subscription.expires_at
                ? `Действует до ${new Date(status.subscription.expires_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`
                : "Бессрочная подписка"}
            </p>
          </>
        ) : (
          <>
            <h2 className="premium-hero__title">Разблокируй всё</h2>
            <p className="premium-hero__sub">
              Безлимитные задачи, свои категории, AI-парсинг текста и голоса
            </p>
          </>
        )}
      </div>

      {/* Features */}
      <div className="surface premium-features" style={{ marginBottom: 14 }}>
        <div className="surface__heading">Что входит в Premium</div>
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
            Выбери тариф
          </div>
          <div className="premium-tiers">
            {PLANS.map((p) => (
              <div
                key={p.key}
                className={`premium-tier${p.best ? " premium-tier--best" : ""}`}
              >
                {p.best && <span className="premium-tier__badge">Выгодно</span>}
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
                  {p.perMonth} ⭐/мес
                </div>
              </div>
            ))}
          </div>

          <a
            className="premium-buy-btn"
            href={premiumLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            💎 Оплатить в боте
          </a>
          <p className="premium-buy-hint">
            Оплата через Telegram Stars — безопасно и мгновенно
          </p>
        </div>
      )}

      {/* Usage */}
      {!status.is_premium && (
        <div className="surface" style={{ marginBottom: 14 }}>
          <div className="surface__heading">📊 Использование</div>
          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>Активных задач</span>
              <span><b>{status.active_tasks_count}</b> / {status.max_tasks}</span>
            </div>
            <div className="premium-bar">
              <div
                className="premium-bar__fill"
                style={{
                  width: `${Math.min(100, (status.active_tasks_count / status.max_tasks) * 100)}%`,
                  background: status.active_tasks_count >= status.max_tasks
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
        <div className="surface__heading">Free план</div>
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
