import { useEffect, useState } from "react";
import { Confetti } from "./Confetti";
import { CoinIcon, SparkIcon } from "../icons";
import { useT } from "../i18n";
import { useToast } from "./Toast";
import type { GameEvent } from "../api";

interface Props {
  gameEvent: GameEvent;
  onClose: () => void;
}

type SlideType =
  | { kind: "achievement"; name_ru: string; name_en: string; icon: string; reward_coins: number }
  | { kind: "stage_up"; stage: number; stage_name_ru: string; stage_name_en: string };

export function AchievementModal({ gameEvent, onClose }: Props) {
  const t = useT();
  const toast = useToast();
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);

  // Show minor events as toasts instead of ugly fullscreen modal
  useEffect(() => {
    if (gameEvent.coins_earned > 0 && gameEvent.achievements_unlocked.length === 0) {
      const coins = gameEvent.coins_earned;
      const msg = t(`+${coins} монет`, `+${coins} coins`);
      toast.show(`💰 ${msg}`, "success", <CoinIcon style={{ width: 16, height: 16 }} />);
    }
    if (gameEvent.streak_lost) {
      const prev = gameEvent.streak_lost_previous;
      const msg = t(`Серия прервана (было ${prev} дн.)`, `Streak lost (was ${prev} days)`);
      toast.show(`🔥 ${msg}`, "error");
    } else if (gameEvent.streak_days > 0) {
      const days = gameEvent.streak_days;
      const msg = t(`${days} дней подряд!`, `${days} days in a row!`);
      toast.show(`🔥 ${msg}`, "success");
    }
    if (gameEvent.perfect_day) {
      toast.show(t("✨ Идеальный день!", "✨ Perfect Day!"), "achievement");
    }
    if (gameEvent.daily_cap_reached) {
      toast.show(t("📅 Дневной лимит монет", "📅 Daily coin cap reached"), "info");
    }
  }, []);

  // Build modal slides only for major events (achievements, stage_up)
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

  if (gameEvent.new_stage !== null && gameEvent.new_stage > 0) {
    slides.push({
      kind: "stage_up",
      stage: gameEvent.new_stage,
      stage_name_ru: gameEvent.stage_name_ru ?? "",
      stage_name_en: gameEvent.stage_name_en ?? "",
    });
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

  }
}
