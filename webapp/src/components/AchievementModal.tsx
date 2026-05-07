import { useEffect, useState } from "react";
import { Confetti } from "./Confetti";
import { CoinIcon, FireIcon, SparkIcon } from "../icons";
import { useT } from "../i18n";
import type { GameEvent } from "../api";

interface Props {
  gameEvent: GameEvent;
  onClose: () => void;
}

type SlideType =
  | { kind: "achievement"; name_ru: string; name_en: string; icon: string; reward_coins: number }
  | { kind: "stage_up"; stage: number; stage_name_ru: string; stage_name_en: string }
  | { kind: "coins"; coins: number }
  | { kind: "streak"; days: number; lost: boolean; lost_previous: number }
  | { kind: "perfect_day" }
  | { kind: "cap_reached" };

export function AchievementModal({ gameEvent, onClose }: Props) {
  const t = useT();
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);

  // Build slides list
  const slides: SlideType[] = [];

  if (gameEvent.achievements_unlocked.length > 0) {
    for (const a of gameEvent.achievements_unlocked) {
      slides.push({
        kind: "achievement",
        name_ru: a.name_ru,
        name_en: a.name_en,
        icon: a.icon,
        reward_coins: a.reward_coins,
      });
    }
  }

  if (gameEvent.coins_earned > 0 && gameEvent.achievements_unlocked.length === 0) {
    slides.push({ kind: "coins", coins: gameEvent.coins_earned });
  }

  if (gameEvent.new_stage !== null && gameEvent.new_stage > 0) {
    slides.push({
      kind: "stage_up",
      stage: gameEvent.new_stage,
      stage_name_ru: gameEvent.stage_name_ru ?? "",
      stage_name_en: gameEvent.stage_name_en ?? "",
    });
  }

  if (gameEvent.streak_lost) {
    slides.push({
      kind: "streak",
      days: 0,
      lost: true,
      lost_previous: gameEvent.streak_lost_previous,
    });
  } else if (gameEvent.streak_days > 0) {
    slides.push({
      kind: "streak",
      days: gameEvent.streak_days,
      lost: false,
      lost_previous: 0,
    });
  }

  if (gameEvent.perfect_day) {
    slides.push({ kind: "perfect_day" });
  }

  if (gameEvent.daily_cap_reached) {
    slides.push({ kind: "cap_reached" });
  }

  const current = slides[visibleIndex];
  const hasNext = visibleIndex < slides.length - 1;

  useEffect(() => {
    if (slides.length === 0) {
      onClose();
      return;
    }
    setVisibleIndex(0);
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (hasNext) {
      setVisibleIndex((i) => i + 1);
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    } else {
      onClose();
    }
  };

  if (!current) return null;

  return (
    <>
      <Confetti active={showConfetti} duration={3500} />
      <div
        className="achievement-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleNext();
        }}
      >
        <div className="achievement-modal">
          <SlideContent slide={current} t={t} />

          {/* Progress dots */}
          {slides.length > 1 && (
            <div className="achievement-modal__dots">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`achievement-modal__dot ${i === visibleIndex ? "active" : ""}`}
                />
              ))}
            </div>
          )}

          {/* Action button */}
          <button className="achievement-modal__btn" onClick={handleNext}>
            {hasNext
              ? t("Следующее →", "Next →")
              : t("Круто!", "Awesome!")}
          </button>
        </div>
      </div>
    </>
  );
}

function SlideContent({ slide, t }: { slide: SlideType; t: (ru: string, en: string) => string }) {
  switch (slide.kind) {
    case "achievement":
      return (
        <>
          <div className="achievement-modal__badge">
            <div className="achievement-modal__icon-ring">
              <span className="achievement-modal__icon">{slide.icon}</span>
            </div>
            <div className="achievement-modal__sparkle" />
            <div className="achievement-modal__sparkle" />
            <div className="achievement-modal__sparkle" />
          </div>
          <h2 className="achievement-modal__title">
            {t("🏆 Достижение разблокировано!", "🏆 Achievement Unlocked!")}
          </h2>
          <div className="achievement-modal__name">{t(slide.name_ru, slide.name_en)}</div>
          <div className="achievement-modal__reward">
            <CoinIcon style={{ width: 18, height: 18, color: "var(--tb-accent-strong)" }} />
            <span>+{slide.reward_coins}</span>
          </div>
        </>
      );

    case "stage_up":
      return (
        <>
          <div className="achievement-modal__badge">
            <div className="achievement-modal__icon-ring">
              <SparkIcon style={{ width: 40, height: 40, color: "var(--tb-accent-strong)" }} />
            </div>
            <div className="achievement-modal__sparkle" />
            <div className="achievement-modal__sparkle" />
            <div className="achievement-modal__sparkle" />
          </div>
          <h2 className="achievement-modal__title">
            {t("🎉 Питомец эволюционировал!", "🎉 Pet Evolved!")}
          </h2>
          <div className="achievement-modal__name">
            {t(`Стадия ${slide.stage}: ${slide.stage_name_ru}`, `Stage ${slide.stage}: ${slide.stage_name_en}`)}
          </div>
        </>
      );

    case "coins":
      return (
        <>
          <div className="achievement-modal__badge">
            <div className="achievement-modal__icon-ring">
              <CoinIcon style={{ width: 40, height: 40, color: "var(--tb-accent-strong)" }} />
            </div>
          </div>
          <h2 className="achievement-modal__title">
            {t("💰 Монетки!", "💰 Coins!")}
          </h2>
          <div className="achievement-modal__name">
            {t("+{n} монет", "+{n} coins").replace("{n}", String(slide.coins))}
          </div>
        </>
      );

    case "streak":
      if (slide.lost) {
        return (
          <>
            <div className="achievement-modal__badge" style={{ filter: "grayscale(0.8)" }}>
              <div className="achievement-modal__icon-ring" style={{ borderColor: "var(--tb-danger)" }}>
                <FireIcon style={{ width: 40, height: 40, color: "var(--tb-danger)" }} />
              </div>
            </div>
            <h2 className="achievement-modal__title" style={{ color: "var(--tb-danger)" }}>
              {t("🔥 Серия прервана", "🔥 Streak Lost")}
            </h2>
            <div className="achievement-modal__name">
              {t(`Было: {n} дней`, `Previous: {n} days`).replace("{n}", String(slide.lost_previous))}
            </div>
          </>
        );
      }
      return (
        <>
          <div className="achievement-modal__badge">
            <div className="achievement-modal__icon-ring" style={{ borderColor: "#ff6b35" }}>
              <FireIcon style={{ width: 40, height: 40, color: "#ff6b35" }} />
            </div>
          </div>
          <h2 className="achievement-modal__title" style={{ color: "#ff6b35" }}>
            {t("🔥 Серия продолжается!", "🔥 Streak Continues!")}
          </h2>
          <div className="achievement-modal__name">
            {t(`{n} дней подряд`, `{n} days in a row`).replace("{n}", String(slide.days))}
          </div>
        </>
      );

    case "perfect_day":
      return (
        <>
          <div className="achievement-modal__badge">
            <div className="achievement-modal__icon-ring" style={{ borderColor: "#ffd700" }}>
              <SparkIcon style={{ width: 40, height: 40, color: "#ffd700" }} />
            </div>
          </div>
          <h2 className="achievement-modal__title" style={{ color: "#ffd700" }}>
            {t("✨ Идеальный день!", "✨ Perfect Day!")}
          </h2>
          <div className="achievement-modal__name">
            {t("Все задачи выполнены!", "All tasks completed!")}
          </div>
        </>
      );

    case "cap_reached":
      return (
        <>
          <div className="achievement-modal__badge">
            <div className="achievement-modal__icon-ring" style={{ borderColor: "#8b5cf6" }}>
              <CoinIcon style={{ width: 40, height: 40, color: "#8b5cf6" }} />
            </div>
          </div>
          <h2 className="achievement-modal__title">
            {t("📅 Дневной лимит", "📅 Daily Cap")}
          </h2>
          <div className="achievement-modal__name">
            {t("Вы получили все монеты на сегодня!", "You earned all coins for today!")}
          </div>
        </>
      );
  }
}
