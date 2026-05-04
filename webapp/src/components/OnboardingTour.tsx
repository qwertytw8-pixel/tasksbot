import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { api } from "../api";
import { t } from "../useLocale";

interface Step {
  emoji: string;
  title: string;
  description: string;
  selector: string | null;
}

const STEPS: Step[] = [
  {
    emoji: "👋",
    title: t("Добро пожаловать!", "Welcome!"),
    description: t(
      "Task Blo поможет тебе управлять задачами прямо в Telegram. Давай быстро покажем, что тут есть.",
      "Task Blo helps you manage tasks right in Telegram. Let us show you around.",
    ),
    selector: null,
  },
  {
    emoji: "📋",
    title: t("Навигация", "Navigation"),
    description: t(
      "Внизу — основные вкладки. Переключайся между задачами, календарём и профилем.",
      "The main tabs are at the bottom. Switch between tasks, calendar and profile.",
    ),
    selector: ".tabbar",
  },
  {
    emoji: "➕",
    title: t("Создай задачу", "Create a task"),
    description: t(
      "Нажми плюс, чтобы добавить новую задачу. Укажи дату, время и приоритет.",
      "Tap plus to add a new task. Set the date, time and priority.",
    ),
    selector: ".fab",
  },
  {
    emoji: "🐾",
    title: t("Питомец", "Pet"),
    description: t(
      "Выполняй задачи — получай монеты и опыт. Выращивай питомца, открывай достижения и покупай аксессуары!",
      "Complete tasks to earn coins and XP. Raise your pet, unlock achievements and buy accessories!",
    ),
    selector: ".tab[href='/pet']",
  },
  {
    emoji: "☀️",
    title: t("Сегодня", "Today"),
    description: t(
      "Здесь собраны задачи на текущий день. Фокусируйся на главном.",
      "Today's tasks are gathered here. Focus on what matters.",
    ),
    selector: ".tab[href='/today']",
  },
  {
    emoji: "📅",
    title: t("Календарь", "Calendar"),
    description: t(
      "Просматривай задачи по дням. Есть режим списка и таймлайна по часам.",
      "Browse tasks by day. List view and hourly timeline are available.",
    ),
    selector: ".tab[href='/calendar']",
  },
  {
    emoji: "⚙️",
    title: t("Профиль", "Profile"),
    description: t(
      "Настрой тему, посмотри архив, управляй подпиской.",
      "Set your theme, view archive, manage subscription.",
    ),
    selector: ".tab[href='/profile']",
  },
];

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

export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const updateRect = useCallback(() => {
    if (current.selector) {
      setTargetRect(getElementRect(current.selector));
    } else {
      setTargetRect(null);
    }
  }, [current.selector]);

  useLayoutEffect(() => {
    updateRect();
  }, [updateRect]);

  useEffect(() => {
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [updateRect]);

  async function finish() {
    try {
      await api.updateMeFields({ onboarding_completed: true });
    } catch {
      // best-effort
    }
    onComplete();
  }

  function next() {
    if (isLast) {
      void finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  function skip() {
    void finish();
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  const padding = 8;
  const borderRadius = 16;

  const maskStyle: React.CSSProperties | undefined =
    targetRect
      ? {
          maskImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='${window.innerWidth}' height='${window.innerHeight}'>`
            + `<rect width='100%' height='100%' fill='white'/>`
            + `<rect x='${targetRect.left - padding}' y='${targetRect.top - padding}' `
            + `width='${targetRect.width + padding * 2}' height='${targetRect.height + padding * 2}' `
            + `rx='${borderRadius}' ry='${borderRadius}' fill='black'/>`
            + `</svg>`,
          )}")`,
          WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='${window.innerWidth}' height='${window.innerHeight}'>`
            + `<rect width='100%' height='100%' fill='white'/>`
            + `<rect x='${targetRect.left - padding}' y='${targetRect.top - padding}' `
            + `width='${targetRect.width + padding * 2}' height='${targetRect.height + padding * 2}' `
            + `rx='${borderRadius}' ry='${borderRadius}' fill='black'/>`
            + `</svg>`,
          )}")`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }
      : undefined;

  const spotlightStyle: React.CSSProperties | undefined =
    targetRect
      ? {
          position: "absolute",
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          borderRadius,
          boxShadow: "0 0 0 4px rgba(109, 93, 252, 0.5), 0 0 24px 8px rgba(109, 93, 252, 0.3)",
          pointerEvents: "none" as const,
        }
      : undefined;

  const tooltipTop = targetRect
    ? targetRect.top > window.innerHeight / 2
      ? targetRect.top - padding - 16
      : targetRect.top + targetRect.height + padding + 16
    : undefined;
  const tooltipAbove = targetRect
    ? targetRect.top > window.innerHeight / 2
    : false;

  return (
    <div className="onboarding-tour">
      <div className="onboarding-tour__overlay" style={maskStyle} onClick={skip} />
      {targetRect && <div className="onboarding-tour__spotlight" style={spotlightStyle} />}

      <div
        ref={tooltipRef}
        className={`onboarding-tour__tooltip ${isFirst ? "onboarding-tour__tooltip--center" : ""} ${tooltipAbove ? "onboarding-tour__tooltip--above" : ""}`}
        style={
          isFirst
            ? undefined
            : { top: tooltipAbove ? undefined : tooltipTop, bottom: tooltipAbove ? `${window.innerHeight - (tooltipTop ?? 0)}px` : undefined }
        }
      >
        <div className="onboarding-tour__progress">
          <div
            className="onboarding-tour__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="onboarding-tour__emoji">{current.emoji}</div>
        <div className="onboarding-tour__title">{current.title}</div>
        <div className="onboarding-tour__desc">{current.description}</div>

        <div className="onboarding-tour__buttons">
          <button type="button" className="onboarding-tour__btn onboarding-tour__btn--skip" onClick={skip}>
            {t("Пропустить", "Skip")}
          </button>
          <button type="button" className="onboarding-tour__btn onboarding-tour__btn--next" onClick={next}>
            {isLast ? t("Начать!", "Start!") : t("Далее →", "Next →")}
          </button>
        </div>
      </div>
    </div>
  );
}
