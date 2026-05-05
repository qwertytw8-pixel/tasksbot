import { useCallback, useEffect, useState } from "react";

import { api, type DailyRewardStatus } from "../api";
import { useLocale } from "../useLocale";

interface Props {
  onClose: () => void;
}

const DAY_LABELS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DailyRewardModal({ onClose }: Props) {
  const locale = useLocale();
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

  const dayLabels = locale === "ru" ? DAY_LABELS_RU : DAY_LABELS_EN;
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

        <h2 className="daily-reward-title">
          {locale === "ru" ? "Ежедневный бонус" : "Daily Reward"}
        </h2>
        <p className="daily-reward-subtitle">
          {locale === "ru"
            ? "Заходи каждый день и получай монетки!"
            : "Visit every day and earn coins!"}
        </p>

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
                <span className="daily-reward-coins">🪙 {reward}</span>
                {isCollected && <span className="daily-reward-check">✓</span>}
              </div>
            );
          })}
        </div>

        {earned !== null ? (
          <div className="daily-reward-earned">
            {locale === "ru"
              ? `+${earned} монет получено!`
              : `+${earned} coins earned!`}
          </div>
        ) : alreadyClaimed ? (
          <div className="daily-reward-earned">
            {locale === "ru"
              ? "Сегодня уже получено!"
              : "Already claimed today!"}
          </div>
        ) : (
          <button
            className="daily-reward-btn"
            disabled={claiming}
            onClick={claim}
          >
            {locale === "ru" ? "Забрать награду" : "Claim Reward"}
          </button>
        )}
      </div>
    </div>
  );
}
