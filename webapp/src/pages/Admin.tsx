import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  api,
  type AdminStatsOut,
  type AdminUserOut,
  type PromoCodeOut,
} from "../api";
import {
  ChevronLeftIcon,
  PlusIcon,
  SparkIcon,
  TagIcon,
  UserIcon,
} from "../icons";

export function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"stats" | "promos" | "users" | "grant" | "coins">("stats");
  const [stats, setStats] = useState<AdminStatsOut | null>(null);
  const [promos, setPromos] = useState<PromoCodeOut[] | null>(null);
  const [users, setUsers] = useState<AdminUserOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newDays, setNewDays] = useState(14);
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  const [grantUserId, setGrantUserId] = useState("");
  const [grantDays, setGrantDays] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantMsg, setGrantMsg] = useState<string | null>(null);

  const [coinsUserId, setCoinsUserId] = useState("");
  const [coinsAmount, setCoinsAmount] = useState("");
  const [coinsBusy, setCoinsBusy] = useState(false);
  const [coinsMsg, setCoinsMsg] = useState<string | null>(null);

  useEffect(() => {
    void loadStats();
  }, []);

  async function loadStats() {
    try {
      setStats(await api.adminStats());
    } catch (e) {
      setError(String(e));
    }
  }

  async function loadPromos() {
    try {
      setPromos(await api.adminPromos());
    } catch (e) {
      setError(String(e));
    }
  }

  async function loadUsers() {
    try {
      setUsers(await api.adminUsers());
    } catch (e) {
      setError(String(e));
    }
  }

  async function createPromo() {
    if (!newCode.trim()) return;
    setPromoBusy(true);
    setPromoMsg(null);
    try {
      await api.adminCreatePromo(newCode.trim(), newDays, newMaxUses);
      setNewCode("");
      setPromoMsg("Промокод создан!");
      await loadPromos();
    } catch (e) {
      setPromoMsg(String(e));
    } finally {
      setPromoBusy(false);
    }
  }

  async function deletePromo(id: number) {
    if (!confirm("Деактивировать промокод?")) return;
    await api.adminDeletePromo(id);
    await loadPromos();
  }

  async function grantSub() {
    const uid = parseInt(grantUserId, 10);
    if (isNaN(uid)) {
      setGrantMsg("Введи числовой Telegram ID");
      return;
    }
    setGrantBusy(true);
    setGrantMsg(null);
    try {
      const days = grantDays.trim() ? parseInt(grantDays, 10) : null;
      const res = await api.adminGrant(uid, days);
      setGrantMsg(res.message);
      setGrantUserId("");
      setGrantDays("");
    } catch (e) {
      setGrantMsg(String(e));
    } finally {
      setGrantBusy(false);
    }
  }

  async function grantCoins() {
    const uid = parseInt(coinsUserId, 10);
    if (isNaN(uid)) {
      setCoinsMsg("Введи числовой Telegram ID");
      return;
    }
    const amount = parseInt(coinsAmount, 10);
    if (isNaN(amount) || amount < 1) {
      setCoinsMsg("Введи количество монет (от 1)");
      return;
    }
    setCoinsBusy(true);
    setCoinsMsg(null);
    try {
      const res = await api.adminGrantCoins(uid, amount);
      setCoinsMsg(`${res.message} (баланс: ${res.new_balance})`);
      setCoinsUserId("");
      setCoinsAmount("");
    } catch (e) {
      setCoinsMsg(String(e));
    } finally {
      setCoinsBusy(false);
    }
  }

  function switchTab(t: typeof tab) {
    setTab(t);
    if (t === "promos" && !promos) void loadPromos();
    if (t === "users" && !users) void loadUsers();
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__title">Нет доступа</div>
          <div>{error}</div>
        </div>
      </div>
    );
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
          <div className="page-header__title-row">
            <h1>Админ-панель</h1>
          </div>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        {(["stats", "promos", "users", "grant", "coins"] as const).map((t) => (
          <button
            key={t}
            className={`chip ${tab === t ? "chip--soft-active" : ""}`}
            onClick={() => switchTab(t)}
            type="button"
          >
            {t === "stats" && "📊 Статистика"}
            {t === "promos" && "🏷 Промокоды"}
            {t === "users" && "👤 Пользователи"}
            {t === "grant" && "🎁 Выдать подписку"}
            {t === "coins" && "🪙 Выдать монеты"}
          </button>
        ))}
      </div>

      {tab === "stats" && (
        <div className="surface">
          <div className="surface__heading">
            <SparkIcon /> Статистика
          </div>
          {stats ? (
            <div className="admin-stats">
              <StatRow label="Всего пользователей" value={stats.total_users} />
              <StatRow label="Premium пользователей" value={stats.premium_users} />
              <StatRow label="Всего задач" value={stats.total_tasks} />
              <StatRow label="Промокодов создано" value={stats.total_promo_codes} />
              <StatRow label="Промокодов активировано" value={stats.total_promo_activations} />
            </div>
          ) : (
            <div className="spinner">Загрузка…</div>
          )}
        </div>
      )}

      {tab === "promos" && (
        <>
          <div className="surface" style={{ marginBottom: 14 }}>
            <div className="surface__heading">
              <TagIcon /> Создать промокод
            </div>
            <div className="form">
              <div className="field">
                <span className="field__label">Код</span>
                <input
                  className="input"
                  placeholder="WELCOME2025"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <span className="field__label">Дней</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={365}
                    value={newDays}
                    onChange={(e) => setNewDays(Number(e.target.value))}
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <span className="field__label">Макс. активаций</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={100000}
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(Number(e.target.value))}
                  />
                </div>
              </div>
              <button
                className="btn"
                disabled={promoBusy || !newCode.trim()}
                onClick={() => void createPromo()}
              >
                <PlusIcon style={{ width: 16, height: 16, marginRight: 8, verticalAlign: "-3px" }} />
                Создать
              </button>
              {promoMsg && (
                <div className="page-header__subtitle" style={{ marginTop: 8 }}>
                  {promoMsg}
                </div>
              )}
            </div>
          </div>

          <div className="surface">
            <div className="surface__heading">
              <TagIcon /> Активные промокоды
            </div>
            {promos ? (
              promos.length === 0 ? (
                <div className="page-header__subtitle">Промокодов пока нет</div>
              ) : (
                <div className="form">
                  {promos.map((p) => (
                    <div className="category-card" key={p.id}>
                      <div className="category-card__header">
                        <div className="category-card__title">
                          <div>
                            <div className="category-card__name">
                              <code>{p.code}</code>
                            </div>
                            <div className="page-header__subtitle" style={{ fontSize: 12 }}>
                              {p.duration_days}д · {p.current_uses}/{p.max_uses} активаций
                              {!p.is_active && " · деактивирован"}
                            </div>
                          </div>
                        </div>
                        {p.is_active && (
                          <button
                            className="chip"
                            onClick={() => void deletePromo(p.id)}
                          >
                            Деактивировать
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="spinner">Загрузка…</div>
            )}
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="surface">
          <div className="surface__heading">
            <UserIcon /> Пользователи
          </div>
          {users ? (
            users.length === 0 ? (
              <div className="page-header__subtitle">Пользователей пока нет</div>
            ) : (
              <div className="form">
                {users.map((u) => (
                  <div className="category-card" key={u.id}>
                    <div className="category-card__header">
                      <div className="category-card__title">
                        <div>
                          <div className="category-card__name">
                            ID: {u.id}
                            {u.is_admin && " 👑"}
                            {u.is_premium && " ⭐"}
                          </div>
                          <div className="page-header__subtitle" style={{ fontSize: 12 }}>
                            {u.is_premium
                              ? u.subscription_expires
                                ? `Premium до ${new Date(u.subscription_expires).toLocaleDateString("ru-RU")}`
                                : "Premium ∞"
                              : "Free"}
                            {" · "}
                            {new Date(u.created_at).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="spinner">Загрузка…</div>
          )}
        </div>
      )}

      {tab === "grant" && (
        <div className="surface">
          <div className="surface__heading">
            <SparkIcon /> Выдать Premium
          </div>
          <div className="form">
            <div className="field">
              <span className="field__label">Telegram User ID</span>
              <input
                className="input"
                placeholder="123456789"
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
              />
            </div>
            <div className="field">
              <span className="field__label">Дней (пусто = навсегда)</span>
              <input
                className="input"
                type="number"
                placeholder="∞"
                min={1}
                value={grantDays}
                onChange={(e) => setGrantDays(e.target.value)}
              />
            </div>
            <button
              className="btn"
              disabled={grantBusy || !grantUserId.trim()}
              onClick={() => void grantSub()}
            >
              Выдать подписку
            </button>
            {grantMsg && (
              <div className="page-header__subtitle" style={{ marginTop: 8 }}>
                {grantMsg}
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "coins" && (
        <div className="surface">
          <div className="surface__heading">
            <SparkIcon /> Выдать монеты
          </div>
          <div className="form">
            <div className="field">
              <span className="field__label">Telegram User ID</span>
              <input
                className="input"
                placeholder="123456789"
                value={coinsUserId}
                onChange={(e) => setCoinsUserId(e.target.value)}
              />
            </div>
            <div className="field">
              <span className="field__label">Количество монет</span>
              <input
                className="input"
                type="number"
                placeholder="100"
                min={1}
                max={100000}
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(e.target.value)}
              />
            </div>
            <button
              className="btn"
              disabled={coinsBusy || !coinsUserId.trim() || !coinsAmount.trim()}
              onClick={() => void grantCoins()}
            >
              Выдать монеты
            </button>
            {coinsMsg && (
              <div className="page-header__subtitle" style={{ marginTop: 8 }}>
                {coinsMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow(props: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--tb-separator)",
      }}
    >
      <span>{props.label}</span>
      <b>{props.value}</b>
    </div>
  );
}
