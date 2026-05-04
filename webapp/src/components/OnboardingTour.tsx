import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { api } from "../api";
import { useI18n } from "../i18n";

interface TourStep {
  target: string | null;
  titleKey: string;
  textKey: string;
  icon: React.ReactNode;
  position: "top" | "bottom" | "center";
}

function RocketIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ob-rocket" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#7c5cfc" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ob-rocket)" opacity="0.15" />
      <path d="M24 12c-3 4-5 9-5 14h10c0-5-2-10-5-14Z" fill="url(#ob-rocket)" />
      <path d="M21 26c-2 1-4 3-5 5l4 1 1-6Z" fill="#c084fc" opacity="0.7" />
      <path d="M27 26c2 1 4 3 5 5l-4 1-1-6Z" fill="#c084fc" opacity="0.7" />
      <circle cx="24" cy="21" r="2.5" fill="white" />
      <path d="M22 32c0 2 1 4 2 5 1-1 2-3 2-5h-4Z" fill="#f97316" />
    </svg>
  );
}

function NavIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ob-nav" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ob-nav)" opacity="0.15" />
      <rect x="10" y="30" width="28" height="8" rx="4" fill="url(#ob-nav)" />
      <circle cx="16" cy="34" r="2" fill="white" />
      <circle cx="24" cy="34" r="2" fill="white" />
      <circle cx="32" cy="34" r="2" fill="white" />
      <rect x="14" y="12" width="20" height="14" rx="3" fill="url(#ob-nav)" opacity="0.4" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ob-plus" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ob-plus)" opacity="0.15" />
      <circle cx="24" cy="24" r="14" fill="url(#ob-plus)" />
      <path d="M24 17v14M17 24h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ob-sun" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ob-sun)" opacity="0.15" />
      <circle cx="24" cy="24" r="8" fill="url(#ob-sun)" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1={24 + 12 * Math.cos((a * Math.PI) / 180)}
          y1={24 + 12 * Math.sin((a * Math.PI) / 180)}
          x2={24 + 15 * Math.cos((a * Math.PI) / 180)}
          y2={24 + 15 * Math.sin((a * Math.PI) / 180)}
          stroke="url(#ob-sun)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function PetIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ob-pet" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ob-pet)" opacity="0.15" />
      {/* main pad — centered */}
      <ellipse cx="24" cy="29" rx="8" ry="7" fill="url(#ob-pet)" />
      {/* four symmetric toe pads */}
      <circle cx="13.5" cy="17" r="4" fill="url(#ob-pet)" />
      <circle cx="21" cy="12" r="4" fill="url(#ob-pet)" />
      <circle cx="27" cy="12" r="4" fill="url(#ob-pet)" />
      <circle cx="34.5" cy="17" r="4" fill="url(#ob-pet)" />
    </svg>
  );
}

function CalIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ob-cal" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ob-cal)" opacity="0.15" />
      <rect x="12" y="14" width="24" height="22" rx="4" fill="url(#ob-cal)" />
      <rect x="12" y="14" width="24" height="8" rx="4" fill="url(#ob-cal)" />
      <path d="M18 11v6M30 11v6" stroke="url(#ob-cal)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="19" cy="28" r="1.5" fill="white" />
      <circle cx="24" cy="28" r="1.5" fill="white" />
      <circle cx="29" cy="28" r="1.5" fill="white" />
      <circle cx="19" cy="33" r="1.5" fill="white" />
      <circle cx="24" cy="33" r="1.5" fill="white" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ob-user" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ob-user)" opacity="0.15" />
      <circle cx="24" cy="19" r="6" fill="url(#ob-user)" />
      <path d="M14 36c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="url(#ob-user)" />
    </svg>
  );
}

const STEPS: TourStep[] = [
  {
    target: null,
    titleKey: "onboarding.welcome_title",
    textKey: "onboarding.welcome_text",
    icon: <RocketIcon />,
    position: "center",
  },
  {
    target: ".tabbar",
    titleKey: "onboarding.nav_title",
    textKey: "onboarding.nav_text",
    icon: <NavIcon />,
    position: "top",
  },
  {
    target: ".fab",
    titleKey: "onboarding.create_title",
    textKey: "onboarding.create_text",
    icon: <PlusCircleIcon />,
    position: "top",
  },
  {
    target: '.tab[href="/pet"]',
    titleKey: "onboarding.pet_title",
    textKey: "onboarding.pet_text",
    icon: <PetIcon />,
    position: "top",
  },
  {
    target: '.tab[href="/today"]',
    titleKey: "onboarding.today_title",
    textKey: "onboarding.today_text",
    icon: <SunIcon />,
    position: "top",
  },
  {
    target: '.tab[href="/calendar"]',
    titleKey: "onboarding.calendar_title",
    textKey: "onboarding.calendar_text",
    icon: <CalIcon />,
    position: "top",
  },
  {
    target: '.tab[href="/profile"]',
    titleKey: "onboarding.profile_title",
    textKey: "onboarding.profile_text",
    icon: <UserIcon />,
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

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const { t } = useI18n();

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
      {rect ? (
        <div
          className="onboarding-spotlight"
          style={spotStyle}
          onClick={(e) => { if (e.target === e.currentTarget) next(); }}
        />
      ) : (
        <div
          className="onboarding-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) next(); }}
        />
      )}
      {rect && <div className="onboarding-spot" style={spotStyle} />}
      <div className="onboarding-tooltip" style={tooltipStyle}>
        <div className="onboarding-tooltip__progress">
          <div
            className="onboarding-tooltip__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="onboarding-tooltip__icon">{current.icon}</div>
        <div className="onboarding-tooltip__step">
          {step + 1} / {STEPS.length}
        </div>
        <div className="onboarding-tooltip__title">
          {t(current.titleKey)}
        </div>
        <div className="onboarding-tooltip__text">
          {t(current.textKey)}
        </div>
        <div className="onboarding-tooltip__actions">
          <button
            type="button"
            className="onboarding-tooltip__skip"
            onClick={finish}
          >
            {t("onboarding.skip")}
          </button>
          <button
            type="button"
            className="onboarding-tooltip__next"
            onClick={next}
          >
            {step < STEPS.length - 1 ? t("onboarding.next") : t("onboarding.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
