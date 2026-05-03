import { useNavigate } from "react-router-dom";

import { useI18n } from "../i18n";
import { CheckIcon } from "../icons";

interface LimitModalProps {
  variant: "daily_limit" | "premium_feature";
  dailyCount?: number;
  maxDaily?: number;
  featureTitle?: string;
  onClose: () => void;
}

function LimitIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="28" fill="url(#lg)" opacity="0.15" />
      <path
        d="M28 16 L42 40 H14 Z"
        fill="none"
        stroke="url(#lg)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line
        x1="28" y1="25" x2="28" y2="32"
        stroke="url(#lg)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="28" cy="36" r="1.5" fill="url(#lg)" />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7a74e" />
          <stop offset="1" stopColor="#e85d3a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PremiumIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id="pg2" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7d774" />
          <stop offset="1" stopColor="#c9952a" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="28" fill="url(#pg2)" opacity="0.15" />
      <path
        d="M28 12l4.5 9.5L43 23l-7.5 7 2 10.5L28 35.5 18.5 40.5l2-10.5L13 23l10.5-1.5z"
        fill="url(#pg2)"
      />
    </svg>
  );
}

export function LimitModal({
  variant,
  dailyCount,
  maxDaily,
  featureTitle,
  onClose,
}: LimitModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const isDailyLimit = variant === "daily_limit";

  const features = [
    t("limit.f1"), t("limit.f2"), t("limit.f3"),
    t("limit.f4"), t("limit.f5"), t("limit.f6"),
  ];

  return (
    <div className="limit-modal__backdrop" onClick={onClose}>
      <div className="limit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="limit-modal__icon">
          {isDailyLimit ? <LimitIcon /> : <PremiumIcon />}
        </div>
        <h2 className="limit-modal__title">
          {isDailyLimit ? t("limit.daily_title") : t("limit.premium_title")}
        </h2>
        <p className="limit-modal__text">
          {isDailyLimit ? (
            <>
              {t("limit.daily_text_before")} <b>{dailyCount}</b> {t("limit.daily_text_of")} <b>{maxDaily}</b> {t("limit.daily_text_after")}
            </>
          ) : (
            <>
              {featureTitle ?? t("limit.premium_text_default")} {t("limit.premium_text_after")}
            </>
          )}
        </p>

        <div className="limit-modal__features">
          <div className="limit-modal__features-title">
            {t("limit.features_title")}
          </div>
          <ul>
            {features.map((f) => (
              <li key={f}>
                <span className="limit-modal__check">
                  <CheckIcon />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="limit-modal__buy"
          onClick={() => {
            onClose();
            navigate("/profile/subscription");
          }}
        >
          {t("limit.buy")}
        </button>
        <button type="button" className="limit-modal__close" onClick={onClose}>
          {t("limit.close")}
        </button>
      </div>
    </div>
  );
}
