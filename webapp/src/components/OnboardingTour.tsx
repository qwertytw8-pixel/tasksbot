import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { api } from "../api";
import { getUserLanguage } from "../telegram";

interface TourStep {
  target: string | null;
  title: string;
  titleEn: string;
  text: string;
  textEn: string;
  emoji: string;
  position: "top" | "bottom" | "center";
}

const STEPS: TourStep[] = [
  {
    target: null,
    title: "Добро пожаловать в Task Blo!",
    titleEn: "Welcome to Task Blo!",
    text: "Твой удобный планировщик задач прямо в Telegram. Давай быстро покажем, как всё устроено.",
    textEn: "Your handy task planner right inside Telegram. Let us show you around.",
    emoji: "👋",
    position: "center",
  },
  {
    target: ".tabbar",
    title: "Навигация",
    titleEn: "Navigation",
    text: "Внизу — основные разделы: все задачи, сегодняшние, календарь и профиль. Переключайся между ними одним нажатием.",
    textEn: "The main sections are at the bottom: all tasks, today, calendar, and profile. Switch between them with one tap.",
    emoji: "📱",
    position: "top",
  },
  {
    target: ".fab",
    title: "Создание задачи",
    titleEn: "Create a task",
    text: "Нажми «+» чтобы создать задачу. Можно указать дату, время, приоритет, категорию и напоминание.",
    textEn: "Tap «+» to create a task. You can set a date, time, priority, category, and reminder.",
    emoji: "➕",
    position: "top",
  },
  {
    target: '.tab[href="/today"]',
    title: "Сегодня",
    titleEn: "Today",
    text: "Все задачи на сегодня в одном месте: просроченные, текущие и уже выполненные.",
    textEn: "All tasks for today in one place: overdue, current, and completed.",
    emoji: "⭐",
    position: "top",
  },
  {
    target: '.tab[href="/calendar"]',
    title: "Календарь",
    titleEn: "Calendar",
    text: "Планируй по дням — выбери дату и увидишь задачи по часам.",
    textEn: "Plan by day — pick a date and see tasks by the hour.",
    emoji: "📅",
    position: "top",
  },
  {
    target: '.tab[href="/profile"]',
    title: "Профиль",
    titleEn: "Profile",
    text: "Настройки, подписка Premium, темы оформления и поддержка.",
    textEn: "Settings, Premium subscription, themes, and support.",
    emoji: "👤",
    position: "top",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getElementRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function buildMaskImage(rect: Rect, pad: number): string {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
    `<rect width='100%' height='100%' fill='white'/>` +
    `<rect x='${rect.left - pad}' y='${rect.top - pad}' ` +
    `width='${rect.width + pad * 2}' height='${rect.height + pad * 2}' ` +
    `rx='14' ry='14' fill='black'/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const lang = getUserLanguage();
  const isRu = lang === "ru";

  const current = STEPS[step];

  const updateRect = useCallback(() => {
    if (!current.target) {
      setRect(null);
      return;
    }
    setRect(getElementRect(current.target));
  }, [current.target]);

  useLayoutEffect(() => {
    updateRect();
  }, [updateRect]);

  useEffect(() => {
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

  const overlayMask: React.CSSProperties = rect
    ? {
        maskImage: buildMaskImage(rect, pad),
        WebkitMaskImage: buildMaskImage(rect, pad),
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
      }
    : {};

  const spotStyle: React.CSSProperties | undefined = rect
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
          : { top: rect.top + rect.height + pad + 16, left: 16, right: 16 }
        : {};

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="onboarding-wrap">
      <div
        className="onboarding-overlay"
        style={overlayMask}
        onClick={(e) => { if (e.target === e.currentTarget) next(); }}
      />
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
        <div className="onboarding-tooltip__title">
          {isRu ? current.title : current.titleEn}
        </div>
        <div className="onboarding-tooltip__text">
          {isRu ? current.text : current.textEn}
        </div>
        <div className="onboarding-tooltip__actions">
          <button
            type="button"
            className="onboarding-tooltip__skip"
            onClick={finish}
          >
            {isRu ? "Пропустить" : "Skip"}
          </button>
          <button
            type="button"
            className="onboarding-tooltip__next"
            onClick={next}
          >
            {step < STEPS.length - 1
              ? (isRu ? "Далее →" : "Next →")
              : (isRu ? "Начать!" : "Start!")}
          </button>
        </div>
      </div>
    </div>
  );
}
