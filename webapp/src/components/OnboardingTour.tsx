import { useCallback, useEffect, useState } from "react";

import { api } from "../api";

interface TourStep {
  target: string | null;
  title: string;
  text: string;
  emoji: string;
  position: "top" | "bottom" | "center";
}

const STEPS: TourStep[] = [
  {
    target: null,
    title: "Добро пожаловать в Task Blo!",
    text: "Твой удобный планировщик задач прямо в Telegram. Давай быстро покажем, как всё устроено.",
    emoji: "👋",
    position: "center",
  },
  {
    target: ".tabbar",
    title: "Навигация",
    text: "Внизу — основные разделы: все задачи, сегодняшние, календарь и профиль. Переключайся между ними одним нажатием.",
    emoji: "📱",
    position: "top",
  },
  {
    target: ".fab",
    title: "Создание задачи",
    text: "Нажми «+» чтобы создать задачу. Можно указать дату, время, приоритет, категорию и напоминание.",
    emoji: "➕",
    position: "top",
  },
  {
    target: '.tab[href="/today"]',
    title: "Сегодня",
    text: "Все задачи на сегодня в одном месте: просроченные, текущие и уже выполненные.",
    emoji: "⭐",
    position: "top",
  },
  {
    target: '.tab[href="/calendar"]',
    title: "Календарь",
    text: "Планируй по дням — выбери дату и увидишь задачи по часам.",
    emoji: "📅",
    position: "top",
  },
  {
    target: '.tab[href="/profile"]',
    title: "Профиль",
    text: "Настройки, подписка Premium, темы оформления и поддержка.",
    emoji: "👤",
    position: "top",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = STEPS[step];

  const updateRect = useCallback(() => {
    if (!current.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(current.target);
    if (el) {
      setRect(el.getBoundingClientRect());
    }
  }, [current.target]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [updateRect]);

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  function finish() {
    void api.completeOnboarding();
    onComplete();
  }

  const pad = 10;

  const spotStyle = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : undefined;

  const tooltipStyle: React.CSSProperties =
    current.position === "center"
      ? { top: "50%", left: 24, right: 24, transform: "translateY(-50%)" }
      : rect
        ? current.position === "top"
          ? { bottom: window.innerHeight - rect.top + pad + 16, left: 16, right: 16 }
          : { top: rect.bottom + pad + 16, left: 16, right: 16 }
        : {};

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="onboarding-overlay" onClick={(e) => { if (e.target === e.currentTarget) next(); }}>
      {rect && <div className="onboarding-spot" style={spotStyle} />}
      <div className="onboarding-tooltip" style={tooltipStyle}>
        <div className="onboarding-tooltip__progress">
          <div
            className="onboarding-tooltip__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="onboarding-tooltip__emoji">{current.emoji}</div>
        <div className="onboarding-tooltip__step">
          {step + 1} / {STEPS.length}
        </div>
        <div className="onboarding-tooltip__title">{current.title}</div>
        <div className="onboarding-tooltip__text">{current.text}</div>
        <div className="onboarding-tooltip__actions">
          <button
            type="button"
            className="onboarding-tooltip__skip"
            onClick={finish}
          >
            Пропустить
          </button>
          <button
            type="button"
            className="onboarding-tooltip__next"
            onClick={next}
          >
            {step < STEPS.length - 1 ? "Далее →" : "Начать!"}
          </button>
        </div>
      </div>
    </div>
  );
}
