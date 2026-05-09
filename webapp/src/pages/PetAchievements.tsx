import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { api, type GameAchievement } from "../api";
import {
  CoinIcon,
  StarBadgeIcon,
  RocketIcon,
  TargetIcon,
  DiamondIcon,
  HeartIcon,
  CrownIcon,
  BoltIcon,
  FireIcon,
  TrophyIcon,
  CheckIcon,
  LockIcon,
} from "../icons";
import { useT } from "../i18n";

const ACHIEVEMENT_ICONS: Record<string, (color: string) => ReactNode> = {
  "\uD83C\uDFAF": (c) => <TargetIcon style={{ width: 24, height: 24, color: c }} />,
  "\uD83D\uDD25": (c) => <FireIcon style={{ width: 24, height: 24, color: c }} />,
  "\u2B50": (c) => <StarBadgeIcon style={{ width: 24, height: 24, color: c }} />,
  "\uD83D\uDE80": (c) => <RocketIcon style={{ width: 24, height: 24, color: c }} />,
  "\uD83D\uDC8E": (c) => <DiamondIcon style={{ width: 24, height: 24, color: c }} />,
  "\u2764\uFE0F": (c) => <HeartIcon style={{ width: 24, height: 24, color: c }} />,
  "\uD83D\uDC51": (c) => <CrownIcon style={{ width: 24, height: 24, color: c }} />,
  "\u26A1": (c) => <BoltIcon style={{ width: 24, height: 24, color: c }} />,
  "\uD83C\uDFC6": (c) => <TrophyIcon style={{ width: 24, height: 24, color: c }} />,
  "\u2705": (c) => <CheckIcon style={{ width: 24, height: 24, color: c }} />,
};

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  diamond: "#B9F2FF",
};

const TIER_LABELS_RU: Record<string, string> = {
  bronze: "Бронза",
  silver: "Серебро",
  gold: "Золото",
  diamond: "Бриллиант",
};

const TIER_LABELS_EN: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

function getAchievementIcon(icon: string, unlocked: boolean): ReactNode {
  const color = unlocked ? "var(--tb-accent-strong)" : "#9CA3AF";
  const factory = ACHIEVEMENT_ICONS[icon];
  if (factory) return factory(color);
  return <StarBadgeIcon style={{ width: 24, height: 24, color }} />;
}

export function PetAchievementsPage() {
  const t = useT();
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

  if (loading) return <div className="spinner">{t("\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026", "Loading\u2026")}</div>;

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked && !a.is_secret);
  const secret = achievements.filter((a) => !a.unlocked && a.is_secret);

  return (
    <div className="page pet-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("\u0414\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u044f", "Achievements")}</h1>
          <p className="page-header__date">
            {unlocked.length}/{achievements.length} {t("\u043e\u0442\u043a\u0440\u044b\u0442\u043e", "unlocked")}
          </p>
        </div>
        <button
          className="pet-back-btn"
          onClick={() => navigate("/pet")}
        >
          {t("\u041d\u0430\u0437\u0430\u0434", "Back")}
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

      {/* Secret */}
      {secret.length > 0 && (
        <>
          <h3 className="pet-achievements__secret-heading">
            {t("\u0421\u0435\u043a\u0440\u0435\u0442\u043d\u044b\u0435", "Secret")}
          </h3>
          <div className="pet-achievements__section pet-achievements__section--secret">
            {secret.map((a) => (
              <SecretAchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SecretAchievementCard({ achievement: a }: { achievement: GameAchievement }) {
  const t = useT();

  return (
    <div className="achievement-card achievement-card--secret">
      <div className="achievement-card__icon">
        <LockIcon style={{ width: 24, height: 24, color: "#9CA3AF" }} />
      </div>
      <div className="achievement-card__info">
        <div className="achievement-card__name">
          {t(a.name_ru, a.name_en)}
        </div>
        <div className="achievement-card__desc">
          {t(a.description_ru, a.description_en)}
        </div>
      </div>
      <div className="achievement-card__reward">
        ??? <CoinIcon style={{ width: 14, height: 14, color: "#9CA3AF", verticalAlign: "middle" }} />
      </div>
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: GameAchievement }) {
  const t = useT();
  const progress = Math.min(100, (a.progress / a.condition_value) * 100);

  return (
    <div className={`achievement-card achievement-card--${a.tier} ${a.unlocked ? "achievement-card--unlocked" : ""}`}>
      <div className="achievement-card__icon">
        {getAchievementIcon(a.icon, a.unlocked)}
      </div>
      <div className="achievement-card__info">
        <div className="achievement-card__name">
          {t(a.name_ru, a.name_en)}
          <span
            className="achievement-card__tier"
            style={{ color: TIER_COLORS[a.tier] || TIER_COLORS.bronze }}
          >
            {t(TIER_LABELS_RU[a.tier] || "Бронза", TIER_LABELS_EN[a.tier] || "Bronze")}
          </span>
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
        +{a.reward_coins} <CoinIcon style={{ width: 14, height: 14, color: "var(--tb-accent-strong)", verticalAlign: "middle" }} />
      </div>
    </div>
  );
}
