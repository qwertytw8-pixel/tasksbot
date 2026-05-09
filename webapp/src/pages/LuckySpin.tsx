import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type SpinResponse } from "../api";
import { CoinIcon, GiftIcon } from "../icons";
import { useT } from "../i18n";
import { haptic } from "../telegram";

const WHEEL_SEGMENTS = [
  { label: "5", color: "#6366f1" },
  { label: "10", color: "#f59e0b" },
  { label: "15", color: "#10b981" },
  { label: "20", color: "#ef4444" },
  { label: "25", color: "#8b5cf6" },
  { label: "50", color: "#ec4899" },
  { label: "5 XP", color: "#06b6d4" },
  { label: "10 XP", color: "#f97316" },
];

export function LuckySpinPage() {
  const t = useT();
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResponse | null>(null);
  const [error, setError] = useState("");
  const [rotation, setRotation] = useState(0);
  const [alreadySpun, setAlreadySpun] = useState(false);

  const handleSpin = useCallback(async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setError("");

    try {
      const res = await api.luckySpin();
      haptic("medium");

      const extraSpins = 4 + Math.random() * 3;
      const segmentAngle = 360 / WHEEL_SEGMENTS.length;
      const targetSegment = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
      const targetRotation = rotation + extraSpins * 360 + targetSegment * segmentAngle;
      setRotation(targetRotation);

      setTimeout(() => {
        haptic("heavy");
        setResult(res);
        setSpinning(false);
        if (!res.can_spin_again) {
          setAlreadySpun(true);
        }
      }, 3500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      if (msg.includes("already spun") || msg.includes("422") || msg.includes("400")) {
        setAlreadySpun(true);
        setError(t("\u0422\u044b \u0443\u0436\u0435 \u043a\u0440\u0443\u0442\u0438\u043b \u0441\u0435\u0433\u043e\u0434\u043d\u044f!", "You already spun today!"));
      } else {
        setError(msg);
      }
      setSpinning(false);
    }
  }, [spinning, rotation, t]);

  return (
    <div className="page pet-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("\u041a\u043e\u043b\u0435\u0441\u043e \u0443\u0434\u0430\u0447\u0438", "Lucky Spin")}</h1>
          <p className="page-header__date">
            {t("\u041e\u0434\u0438\u043d \u0440\u0430\u0437 \u0432 \u0434\u0435\u043d\u044c", "Once per day")}
          </p>
        </div>
        <button
          className="pet-back-btn"
          onClick={() => navigate("/pet")}
        >
          {t("\u041d\u0430\u0437\u0430\u0434", "Back")}
        </button>
      </div>

      <div className="spin-container">
        <div className="spin-wheel-wrapper">
          <div className="spin-pointer" />
          <div
            className="spin-wheel"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
          >
            {WHEEL_SEGMENTS.map((seg, i) => {
              const angle = (i * 360) / WHEEL_SEGMENTS.length;
              return (
                <div
                  key={i}
                  className="spin-segment"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    background: seg.color,
                  }}
                >
                  <span className="spin-segment__label">{seg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {result && (
          <div className="spin-result">
            <GiftIcon style={{ width: 28, height: 28, color: "var(--tb-accent-strong)" }} />
            <span className="spin-result__text">
              {t(result.reward.label_ru, result.reward.label_en)}
            </span>
            {result.reward.reward_type === "coins" && (
              <span className="spin-result__amount">
                +{result.reward.amount} <CoinIcon style={{ width: 16, height: 16, color: "#facc15", verticalAlign: "middle" }} />
              </span>
            )}
            {result.reward.reward_type === "xp" && (
              <span className="spin-result__amount">
                +{result.reward.amount} XP
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="spin-result spin-result--error">
            <span className="spin-result__text">{error}</span>
          </div>
        )}

        <button
          className="spin-btn"
          onClick={handleSpin}
          disabled={spinning || alreadySpun}
        >
          {spinning
            ? t("\u041a\u0440\u0443\u0442\u0438\u043c\u2026", "Spinning\u2026")
            : alreadySpun
              ? t("\u0417\u0430\u0432\u0442\u0440\u0430!", "Tomorrow!")
              : t("\u041a\u0440\u0443\u0442\u0438\u0442\u044c!", "Spin!")}
        </button>
      </div>
    </div>
  );
}
