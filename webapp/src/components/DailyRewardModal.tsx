import { useCallback, useEffect, useState } from "react";

import { api, type DailyRewardStatus } from "../api";
import { CoinIcon } from "../icons";
import { useI18n } from "../i18n";

interface Props {
  onClose: () => void;
}

export function DailyRewardModal({ onClose }: Props) {
  const { t, lang } = useI18n();
  const locale = lang;
  const [status, setStatus] = useState<DailyRewardStatus | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [earned, setEarned] = useState<number | null>(null);

  useEffect(() => {
    api.dailyRewardStatus().then(setStatus).catch(() => onClose());
  }, [onClose]);

  const claim = useCallback(async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await api.claimDailyReward();
      setEarned(result.coins_earned);
      setStatus((prev) =>
        prev
          ? { ...prev, current_day: result.current_day, claimed_today: true }
          : prev,
      );
    } catch {
      // already claimed or error
    } finally {
      setClaiming(false);
    }
  }, [claiming]);

  if (!status) return null;

  const dayLabels = t("dr.days").split(",");
  const rewards = status.rewards;
  const currentDay = status.current_day;
  const alreadyClaimed = status.claimed_today;

  return (
    <div className="daily-reward-overlay" onClick={onClose}>
      <div
        className="daily-reward-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="daily-reward-close" onClick={onClose}>
          ✕
        </button>

        <h2 className="daily-reward-title">{t("dr.title")}</h2>
        <p className="daily-reward-subtitle">{t("dr.subtitle")}</p>

        <div className="daily-reward-grid">
          {rewards.map((reward, i) => {
            const dayNum = i + 1;
            const isCollected = dayNum <= currentDay;
            const isCurrent = dayNum === currentDay + 1 && !alreadyClaimed;
            return (
              <div
                key={i}
                className={`daily-reward-day${isCollected ? " collected" : ""}${isCurrent ? " current" : ""}`}
              >
                <span className="daily-reward-day-label">
                  {dayLabels[i]}
                </span>
                <span className="daily-reward-coins">
                  <CoinIcon style={{ width: 14, height: 14, verticalAlign: "-2px", marginRight: 2 }} />
                  {reward}
                </span>
                {isCollected && <span className="daily-reward-check">✓</span>}
              </div>
            );
          })}
        </div>

        {earned !== null ? (
          <div className="daily-reward-earned">
            {t("dr.earned").replace("{coins}", String(earned))}
          </div>
        ) : alreadyClaimed ? (
          <div className="daily-reward-earned">{t("dr.claimed")}</div>
        ) : (
          <button
            className="daily-reward-btn"
            disabled={claiming}
            onClick={claim}
          >
            {t("dr.claim")}
          </button>
        )}
      </div>
    </div>
  );
}
