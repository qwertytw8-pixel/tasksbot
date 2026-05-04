import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type GameProfile } from "../api";
import { PetView } from "../components/PetView";
import { CoinIcon, FireIcon, ShopBagIcon, TrophyIcon, GridIcon } from "../icons";
import { t } from "../useLocale";

export function PetPage() {
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const p = await api.gameProfile();
      setProfile(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="spinner">{t("Загрузка…", "Loading…")}</div>;
  if (error) return <div className="page"><p style={{ color: "var(--tb-danger)" }}>{error}</p></div>;
  if (!profile) return null;

  // If user has no pet yet, redirect to hatch
  if (!profile.has_pet) {
    return <PetFirstEgg />;
  }

  const pet = profile.active_pet;
  const xpProgress = pet
    ? Math.min(
        100,
        pet.xp_for_next > pet.xp_current_stage
          ? ((pet.xp - pet.xp_current_stage) / (pet.xp_for_next - pet.xp_current_stage)) * 100
          : 100
      )
    : 0;

  const dailyProgress = profile.daily_cap > 0
    ? Math.min(100, (profile.daily_coins_earned / profile.daily_cap) * 100)
    : 0;

  const taskProgress = profile.today_tasks_total > 0
    ? Math.min(100, (profile.today_tasks_done / profile.today_tasks_total) * 100)
    : 0;

  return (
    <div className="page pet-page">
      {/* Header with coins and streak */}
      <div className="pet-header">
        <div className="pet-header__coins">
          <CoinIcon className="pet-header__coin-icon" style={{ width: 18, height: 18, color: "#facc15" }} />
          <span className="pet-header__coin-value">{profile.coins}</span>
        </div>
        <div className="pet-header__streak">
          <FireIcon className="pet-header__streak-icon" style={{ width: 18, height: 18, color: "#f97316" }} />
          <span className="pet-header__streak-value">
            {profile.streak_days} {t("дн.", "d")}
          </span>
        </div>
      </div>

      {/* Pet display */}
      {pet && (
        <div className="pet-display">
          <PetView
            characterType={pet.character_type}
            rarity={pet.rarity}
            stage={pet.stage}
            accessorySlug={pet.accessory_slug}
            size={160}
          />

          {/* XP progress bar */}
          <div className="pet-xp">
            <div className="pet-xp__bar">
              <div className="pet-xp__fill" style={{ width: `${xpProgress}%` }} />
            </div>
            <div className="pet-xp__text">
              {pet.xp}/{pet.xp_for_next} XP
              <span className="pet-xp__stage">
                {" "}
                {t(pet.stage_name_ru, pet.stage_name_en)}
                {pet.stage < 5 && ` → ${t(
                  ["Малыш", "Подросток", "Взрослый", "Мастер", "Легенда"][pet.stage] ?? "?",
                  ["Baby", "Teen", "Adult", "Master", "Legend"][pet.stage] ?? "?"
                )}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Today stats */}
      <div className="pet-stats">
        <div className="pet-stats__row">
          <span>
            {t("Сегодня", "Today")}: +{profile.daily_coins_earned} <CoinIcon style={{ width: 14, height: 14, color: "#facc15", verticalAlign: "middle" }} />
          </span>
          <span className="pet-stats__cap">
            ({profile.daily_coins_earned}/{profile.daily_cap})
          </span>
        </div>
        <div className="pet-stats__bar">
          <div className="pet-stats__fill" style={{ width: `${dailyProgress}%` }} />
        </div>

        {profile.today_tasks_total > 0 && (
          <>
            <div className="pet-stats__row" style={{ marginTop: 8 }}>
              <span>
                {t("Задачи дня", "Today's tasks")}
              </span>
              <span>
                {profile.today_tasks_done}/{profile.today_tasks_total}
              </span>
            </div>
            <div className="pet-stats__bar">
              <div className="pet-stats__fill pet-stats__fill--tasks" style={{ width: `${taskProgress}%` }} />
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="pet-nav">
        <button className="pet-nav__btn" onClick={() => navigate("/pet/shop")}>
          <ShopBagIcon style={{ width: 18, height: 18 }} />
          {t("Магазин", "Shop")}
        </button>
        <button className="pet-nav__btn" onClick={() => navigate("/pet/achievements")}>
          <TrophyIcon style={{ width: 18, height: 18 }} />
          {t("Достижения", "Achievements")}
        </button>
        <button className="pet-nav__btn" onClick={() => navigate("/pet/collection")}>
          <GridIcon style={{ width: 18, height: 18 }} />
          {t("Коллекция", "Collection")}
        </button>
      </div>
    </div>
  );
}

function PetFirstEgg() {
  const navigate = useNavigate();

  return (
    <div className="page pet-page pet-first-egg">
      <div className="pet-first-egg__content">
        <div className="pet-first-egg__egg-img">
          <img src="/game/eggs/common.png" alt="egg" width={120} height={120} draggable={false} />
        </div>
        <h2>{t("Твоё первое яйцо!", "Your first egg!")}</h2>
        <p>{t("Нажми, чтобы узнать, кто внутри!", "Tap to find out who's inside!")}</p>
        <button
          className="pet-first-egg__btn"
          onClick={() => navigate("/pet/hatch?egg=egg_common&first=1")}
        >
          {t("Открыть! 🎉", "Open! 🎉")}
        </button>
      </div>
    </div>
  );
}
