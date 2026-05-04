import { useState } from "react";

import { t } from "../useLocale";

interface PetViewProps {
  characterType: string;
  rarity: string;
  stage: number;
  accessorySlug?: string | null;
  size?: number;
  backgroundSlug?: string | null;
  animate?: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  rare: "#818CF8",
  epic: "#F59E0B",
};

const RARITY_GLOW: Record<string, string> = {
  common: "none",
  rare: "0 0 18px 4px rgba(129,140,248,0.35)",
  epic: "0 0 18px 4px rgba(245,158,11,0.35)",
};

const CHARACTER_LABELS: Record<string, [string, string]> = {
  cat: ["Котёнок", "Kitty"],
  fox: ["Лисёнок", "Foxy"],
  dragon: ["Дракончик", "Draco"],
};

function getPetImagePath(characterType: string, rarity: string, stage: number): string {
  return `/game/pets/${characterType}/${rarity}/stage${stage}.png`;
}

export function PetView({
  characterType,
  rarity,
  stage,
  size = 160,
  backgroundSlug,
  animate = false,
}: PetViewProps) {
  const borderColor = RARITY_COLORS[rarity] ?? RARITY_COLORS.common;
  const glow = RARITY_GLOW[rarity] ?? RARITY_GLOW.common;
  const label = CHARACTER_LABELS[characterType];
  const name = label ? t(label[0], label[1]) : characterType;
  const [loaded, setLoaded] = useState(false);

  const imgSrc = getPetImagePath(characterType, rarity, stage);
  const bgSrc = backgroundSlug ? `/game/bg/${backgroundSlug}.png` : null;

  return (
    <div className={`pet-view ${animate ? "pet-view--evolving" : ""}`} style={{ textAlign: "center" }}>
      <div
        className="pet-view__frame"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size + 20,
          height: size + 20,
          borderRadius: "50%",
          border: `3px solid ${borderColor}`,
          background: bgSrc ? `url(${bgSrc}) center/cover` : "var(--tb-glass)",
          boxShadow: glow,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={imgSrc}
          alt={name}
          width={size}
          height={size}
          className={`pet-view__img ${loaded ? "pet-view__img--loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
          style={{ objectFit: "contain" }}
        />
      </div>
      <div className="pet-view__name" style={{ marginTop: 8, fontWeight: 700, fontSize: 16 }}>
        {name}
      </div>
    </div>
  );
}
