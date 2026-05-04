import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type GameAchievement } from "../api";
import { t } from "../useLocale";

export function PetAchievementsPage() {
  const [achievements, setAchievements] = useState<GameAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const data = await api.gameAchievements();
      setAchievements(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="spinner">{t("Загрузка…", "Loading…")}</div>;

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="page pet-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("Достижения", "Achievements")}</h1>
          <p className="page-header__date">
            {unlocked.length}/{achievements.length} {t("открыто", "unlocked")}
          </p>
        </div>
        <button
          className="pet-back-btn"
          onClick={() => navigate("/pet")}
        >
          {t("Назад", "Back")}
        </button>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div className="pet-achievements__section">
          {unlocked.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div className="pet-achievements__section pet-achievements__section--locked">
          {locked.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: GameAchievement }) {
  const progress = Math.min(100, (a.progress / a.condition_value) * 100);

  return (
    <div className={`achievement-card ${a.unlocked ? "achievement-card--unlocked" : ""}`}>
      <div className="achievement-card__icon">{a.icon}</div>
      <div className="achievement-card__info">
        <div className="achievement-card__name">
          {t(a.name_ru, a.name_en)}
        </div>
        <div className="achievement-card__desc">
          {t(a.description_ru, a.description_en)}
        </div>
        {!a.unlocked && (
          <div className="achievement-card__progress">
            <div className="achievement-card__progress-bar">
              <div
                className="achievement-card__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="achievement-card__progress-text">
              {a.progress}/{a.condition_value}
            </span>
          </div>
        )}
      </div>
      <div className="achievement-card__reward">
        +{a.reward_coins} 🪙
      </div>
    </div>
  );
}
