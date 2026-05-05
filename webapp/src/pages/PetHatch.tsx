import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api, type HatchResponse } from "../api";
import { PetView } from "../components/PetView";
import { useToast } from "../components/Toast";
import { t } from "../useLocale";
import { haptic } from "../telegram";

const EGG_IMAGES: Record<string, string> = {
  egg_common: "/game/eggs/common.png",
  egg_rare: "/game/eggs/rare.png",
  egg_epic: "/game/eggs/epic.png",
};

export function PetHatchPage() {
  const [searchParams] = useSearchParams();
  const eggSlug = searchParams.get("egg") ?? "egg_common";
  const isFirst = searchParams.get("first") === "1";
  const navigate = useNavigate();
  const { show: showToast } = useToast();

  const [phase, setPhase] = useState<"egg" | "hatching" | "cracking" | "reveal" | "naming">("egg");
  const [result, setResult] = useState<HatchResponse | null>(null);
  const [error, setError] = useState("");
  const [petName, setPetName] = useState("");
  const [saving, setSaving] = useState(false);

  const doHatch = useCallback(async () => {
    setPhase("hatching");
    haptic("medium");
    try {
      const res = await api.gameHatch(eggSlug);
      setResult(res);
      setTimeout(() => {
        setPhase("cracking");
        haptic("heavy");
      }, 1800);
      setTimeout(() => {
        setPhase("reveal");
        haptic("heavy");
      }, 2800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      if (msg.includes("429") || msg.includes("free egg limit")) {
        showToast(t("Лимит бесплатных яиц исчерпан (3/нед)!", "Free egg limit reached (3/week)!"), "error");
      }
      setError(msg);
      setPhase("egg");
    }
  }, [eggSlug, showToast]);

  const handleName = useCallback(async () => {
    if (!result) return;
    const name = petName.trim();
    if (name.length > 0 && name.length <= 64) {
      setSaving(true);
      try {
        await api.gameRenamePet(result.pet.id, name);
        showToast(t(`${name} — отличное имя!`, `${name} — great name!`), "success");
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    }
    navigate("/pet");
  }, [result, petName, navigate, showToast]);

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

  if (phase === "naming" && result) {
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
            size={140}
          />
          <div
            className="pet-hatch-reveal__rarity"
            style={{ color: rarityColor, fontWeight: 800, fontSize: 16, marginTop: 10 }}
          >
            {t(result.rarity_name_ru, result.rarity_name_en).toUpperCase()}
          </div>
          <div className="pet-hatch-naming">
            <h3>{t("Как назовёшь?", "Name your pet!")}</h3>
            <input
              className="pet-hatch-naming__input"
              type="text"
              placeholder={t("Введи имя…", "Enter name…")}
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              maxLength={64}
              autoFocus
            />
            <div className="pet-hatch-naming__actions">
              <button
                className="pet-first-egg__btn"
                onClick={handleName}
                disabled={saving}
              >
                {petName.trim() ? t("Готово!", "Done!") : t("Пропустить", "Skip")}
              </button>
            </div>
          </div>
        </div>
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
          <div className="pet-hatch-reveal__sparkles">
            <div className="sparkle sparkle--1" />
            <div className="sparkle sparkle--2" />
            <div className="sparkle sparkle--3" />
            <div className="sparkle sparkle--4" />
            <div className="sparkle sparkle--5" />
            <div className="sparkle sparkle--6" />
          </div>
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
            onClick={() => setPhase("naming")}
          >
            {t("Дать имя!", "Name it!")}
          </button>
        </div>
      </div>
    );
  }

  const eggSrc = EGG_IMAGES[eggSlug] ?? EGG_IMAGES.egg_common;

  return (
    <div className="page pet-page pet-hatch">
      <div className="pet-hatch__content">
        <div
          className={`pet-hatch__egg ${
            phase === "hatching" ? "pet-hatch__egg--shaking" : ""
          } ${phase === "cracking" ? "pet-hatch__egg--cracking" : ""}`}
        >
          <img
            src={eggSrc}
            alt={eggSlug}
            width={140}
            height={140}
            className="pet-hatch__egg-img"
            draggable={false}
          />
          {phase === "hatching" && (
            <div className="pet-hatch__particles">
              <span className="hatch-particle hatch-particle--1" />
              <span className="hatch-particle hatch-particle--2" />
              <span className="hatch-particle hatch-particle--3" />
            </div>
          )}
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
              {t("Открыть!", "Open!")}
            </button>
          </>
        )}

        {phase === "hatching" && (
          <p style={{ marginTop: 20, fontWeight: 600 }}>
            {t("Вылупляется…", "Hatching…")}
          </p>
        )}

        {phase === "cracking" && (
          <p style={{ marginTop: 20, fontWeight: 600 }}>
            {t("Вот-вот…", "Almost…")}
          </p>
        )}
      </div>
    </div>
  );
}
