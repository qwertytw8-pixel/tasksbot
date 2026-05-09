import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type ReferralInfo } from "../api";
import { useT } from "../i18n";
import { haptic } from "../telegram";

export function ReferralPage() {
  const t = useT();
  const navigate = useNavigate();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.referralInfo();
      setInfo(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = useCallback(() => {
    if (!info) return;
    navigator.clipboard.writeText(info.referral_link).then(() => {
      setCopied(true);
      haptic("medium");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [info]);

  const handleShare = useCallback(() => {
    if (!info) return;
    const text = t(
      "Попробуй Task Blo — крутой планировщик задач в Telegram с питомцами! Переходи по моей ссылке и получи бонус:",
      "Try Task Blo — a cool task planner in Telegram with pets! Use my link for a bonus:"
    );
    const url = `https://t.me/share/url?url=${encodeURIComponent(info.referral_link)}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    haptic("medium");
  }, [info, t]);

  if (loading) return <div className="spinner">{t("Загрузка…", "Loading…")}</div>;
  if (!info) return null;

  return (
    <div className="page referral-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("Пригласи друга", "Invite a friend")}</h1>
          <p className="page-header__date">
            {t("Получи Premium бесплатно!", "Get Premium for free!")}
          </p>
        </div>
        <button className="pet-back-btn" onClick={() => navigate(-1)}>
          {t("Назад", "Back")}
        </button>
      </div>

      <div className="referral-card">
        <div className="referral-card__icon">🎁</div>
        <h2 className="referral-card__title">
          {t(
            `+${info.bonus_days_per_invite} дня Premium за каждого друга`,
            `+${info.bonus_days_per_invite} days Premium per friend`
          )}
        </h2>
        <p className="referral-card__desc">
          {t(
            "Отправь другу свою ссылку. Когда он создаст первую задачу, ты получишь бонус!",
            "Send your link to a friend. When they create their first task, you'll get the bonus!"
          )}
        </p>
      </div>

      <div className="referral-link-box">
        <input
          className="referral-link-box__input"
          type="text"
          readOnly
          value={info.referral_link}
          onClick={handleCopy}
        />
        <button className="referral-link-box__copy" onClick={handleCopy}>
          {copied ? t("Скопировано!", "Copied!") : t("Копировать", "Copy")}
        </button>
      </div>

      <button className="referral-share-btn" onClick={handleShare}>
        {t("📤 Поделиться ссылкой", "📤 Share link")}
      </button>

      <div className="referral-stats">
        <div className="referral-stat">
          <span className="referral-stat__value">{info.total_invited}</span>
          <span className="referral-stat__label">
            {t("Приглашено", "Invited")}
          </span>
        </div>
        <div className="referral-stat">
          <span className="referral-stat__value">{info.rewarded_count}</span>
          <span className="referral-stat__label">
            {t("Активных", "Active")}
          </span>
        </div>
        <div className="referral-stat">
          <span className="referral-stat__value">+{info.total_days_earned}</span>
          <span className="referral-stat__label">
            {t("Дней Premium", "Days Premium")}
          </span>
        </div>
      </div>
    </div>
  );
}
