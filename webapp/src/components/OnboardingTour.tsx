import { useCallback, useEffect, useState } from "react";

import { api } from "../api";

interface TourStep {
  target: string;
  title: string;
  text: string;
  position: "top" | "bottom";
}

const STEPS: TourStep[] = [
  {
    target: ".fab",
    title: "Новая задача",
    text: "Нажми сюда, чтобы создать новую задачу. Укажи дату, время, приоритет и напоминание.",
    position: "top",
  },
  {
    target: '.tab[href="/today"]',
    title: "Сегодня",
    text: "Здесь собраны задачи на сегодня: просроченные, текущие и выполненные.",
    position: "top",
  },
  {
    target: '.tab[href="/calendar"]',
    title: "Календарь",
    text: "Планируй по дням — выбери дату и посмотри задачи по часам.",
    position: "top",
  },
  {
    target: '.tab[href="/categories"]',
    title: "Категории",
    text: "Группируй задачи по проектам и темам с помощью категорий.",
    position: "top",
  },
  {
    target: '.tab[href="/profile"]',
    title: "Профиль",
    text: "Настройки, подписка Premium и темы оформления — всё здесь.",
    position: "top",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const el = document.querySelector(STEPS[step].target);
    if (el) {
      setRect(el.getBoundingClientRect());
    }
  }, [step]);

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

  const current = STEPS[step];
  const pad = 8;

  const spotStyle = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : undefined;

  const tooltipStyle = rect
    ? current.position === "top"
      ? { bottom: window.innerHeight - rect.top + pad + 12, left: 16, right: 16 }
      : { top: rect.bottom + pad + 12, left: 16, right: 16 }
    : undefined;

  return (
    <div className="onboarding-overlay">
      {rect && <div className="onboarding-spot" style={spotStyle} />}
      <div className="onboarding-tooltip" style={tooltipStyle}>
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
            {step < STEPS.length - 1 ? "Далее" : "Готово"}
          </button>
        </div>
      </div>
    </div>
  );
}
