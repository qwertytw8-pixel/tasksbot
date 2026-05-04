import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api, type HatchResponse } from "../api";
import { PetView } from "../components/PetView";
import { t } from "../useLocale";
import { haptic } from "../telegram";

export function PetHatchPage() {
  const [searchParams] = useSearchParams();
  const eggSlug = searchParams.get("egg") ?? "egg_common";
  const isFirst = searchParams.get("first") === "1";
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"egg" | "hatching" | "reveal">("egg");
  const [result, setResult] = useState<HatchResponse | null>(null);
  const [error, setError] = useState("");

  const doHatch = useCallback(async () => {
    setPhase("hatching");
    haptic("medium");
    try {
      const res = await api.gameHatch(eggSlug);
      setResult(res);
      setTimeout(() => {
        setPhase("reveal");
        haptic("heavy");
      }, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setPhase("egg");
    }
  }, [eggSlug]);

  if (error) {
    return (
      <div className="page pet-page">
        <p style={{ color: "var(--tb-danger)" }}>{error}</p>
        <button className="pet-nav__btn" onClick={() => navigate("/pet")}>
          {t("Назад", "Back")}
        </button>
      </div>
    );
  }

  if (phase === "reveal" && result) {
    const rarityColor =
      result.pet.rarity === "epic"
        ? "#F59E0B"
        : result.pet.rarity === "rare"
          ? "#818CF8"
          : "#9CA3AF";

    return (
      <div className="page pet-page pet-hatch-reveal">
        <div className="pet-hatch-reveal__content">
          <PetView
            characterType={result.pet.character_type}
            rarity={result.pet.rarity}
            stage={1}
            size={180}
          />
          <div
            className="pet-hatch-reveal__rarity"
            style={{ color: rarityColor, fontWeight: 800, fontSize: 18, marginTop: 12 }}
          >
            {t(result.rarity_name_ru, result.rarity_name_en).toUpperCase()}
          </div>
          <div className="pet-hatch-reveal__name" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
            {t(result.character_name_ru, result.character_name_en)}
          </div>
          <button
            className="pet-first-egg__btn"
            style={{ marginTop: 24 }}
            onClick={() => navigate("/pet")}
          >
            {t("Отлично!", "Awesome!")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page pet-page pet-hatch">
      <div className="pet-hatch__content">
        <div className={`pet-hatch__egg ${phase === "hatching" ? "pet-hatch__egg--shaking" : ""}`}>
          <svg width="120" height="150" viewBox="0 0 120 150">
            <ellipse cx="60" cy="85" rx="45" ry="55" fill="#F3E8D0" stroke="#D4C5A9" strokeWidth="3" />
            <ellipse cx="60" cy="85" rx="45" ry="55" fill="url(#eggGrad)" />
            {eggSlug === "egg_rare" && (
              <ellipse cx="60" cy="85" rx="45" ry="55" fill="none" stroke="#818CF8" strokeWidth="3" />
            )}
            {eggSlug === "egg_epic" && (
              <ellipse cx="60" cy="85" rx="45" ry="55" fill="none" stroke="#F59E0B" strokeWidth="3" />
            )}
            <ellipse cx="50" cy="65" rx="8" ry="12" fill="rgba(255,255,255,0.3)" />
            <defs>
              <radialGradient id="eggGrad" cx="40%" cy="30%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {phase === "egg" && (
          <>
            <h2 style={{ marginTop: 20 }}>
              {isFirst
                ? t("Твоё первое яйцо!", "Your first egg!")
                : t("Новое яйцо!", "New egg!")}
            </h2>
            <p>{t("Нажми, чтобы открыть!", "Tap to open!")}</p>
            <button className="pet-first-egg__btn" onClick={doHatch}>
              {t("Открыть! 🎉", "Open! 🎉")}
            </button>
          </>
        )}

        {phase === "hatching" && (
          <p style={{ marginTop: 20, fontWeight: 600 }}>
            {t("Вылупляется…", "Hatching…")}
          </p>
        )}
      </div>
    </div>
  );
}
