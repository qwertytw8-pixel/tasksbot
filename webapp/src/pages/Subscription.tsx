import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type PlansOut, type SubscriptionStatus } from "../api";
import {
  CheckIcon,
  ChevronLeftIcon,
  SparkIcon,
} from "../icons";

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<PlansOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [s, p] = await Promise.all([
          api.subscriptionStatus(),
          api.subscriptionPlans(),
        ]);
        setStatus(s);
        setPlans(p);
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
          <span className="page-header__eyebrow">
            <SparkIcon /> subscription
          </span>
          <div className="page-header__title-row">
            <h1>Подписка</h1>
          </div>
          <div className="page-header__subtitle">
            Разблокируй все возможности Task Blo
          </div>
        </div>
      </div>

      {status.is_premium && status.subscription && (
        <div className="hero-card" style={{ marginBottom: 14 }}>
          <h2>⭐ Premium активен</h2>
          <div className="page-header__subtitle" style={{ marginTop: 8 }}>
            {status.subscription.expires_at
              ? `Действует до ${new Date(status.subscription.expires_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`
              : "Бессрочная подписка"}
          </div>
        </div>
      )}

      {!status.is_premium && (
        <div className="surface" style={{ marginBottom: 14, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
          <h2 style={{ marginBottom: 8 }}>Перейди на Premium</h2>
          <p className="page-header__subtitle" style={{ marginBottom: 16 }}>
            {plans.premium.price_stars} Stars / месяц
          </p>
          <p className="page-header__subtitle" style={{ marginBottom: 16, fontSize: 13 }}>
            Используй команду <b>/premium</b> в чате с ботом для покупки через Telegram Stars
          </p>
        </div>
      )}

      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="surface__heading">
          <SparkIcon /> Premium — {plans.premium.price_stars} ⭐/мес
        </div>
        <ul className="bullet">
          {plans.premium.features.map((f, i) => (
            <li key={i}>
              <CheckIcon /> {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="surface" style={{ marginBottom: 14, opacity: status.is_premium ? 0.6 : 1 }}>
        <div className="surface__heading">Free</div>
        <ul className="bullet">
          {plans.free.features.map((f, i) => (
            <li key={i}>
              <CheckIcon /> {f}
            </li>
          ))}
        </ul>
      </div>

      {!status.is_premium && (
        <div className="surface" style={{ marginBottom: 14 }}>
          <div className="surface__heading">📊 Использование</div>
          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>Активных задач</span>
              <span><b>{status.active_tasks_count}</b> / {status.max_tasks}</span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: "var(--tb-cell-bg)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, (status.active_tasks_count / status.max_tasks) * 100)}%`,
                  background: status.active_tasks_count >= status.max_tasks
                    ? "var(--tb-danger)"
                    : "var(--tb-accent-strong)",
                  borderRadius: 3,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
