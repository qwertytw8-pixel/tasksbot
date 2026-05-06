import { useState } from "react";

import { useT } from "../i18n";

interface PetViewProps {
  characterType: string;
  rarity: string;
  stage: number;
  name?: string | null;
  showName?: boolean;
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
  name,
  showName = true,
  size = 160,
  backgroundSlug,
  animate = false,
}: PetViewProps) {
  const t = useT();
  const borderColor = RARITY_COLORS[rarity] ?? RARITY_COLORS.common;
  const glow = RARITY_GLOW[rarity] ?? RARITY_GLOW.common;
  const label = CHARACTER_LABELS[characterType];
  const defaultName = label ? t(label[0], label[1]) : characterType;
  const displayName = name || defaultName;
  const [loaded, setLoaded] = useState(false);

  const imgSrc = getPetImagePath(characterType, rarity, stage);
  const bgName = backgroundSlug?.replace(/^bg_/, "") ?? null;
  const bgSrc = bgName ? `/game/bg/${bgName}.png` : null;

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
          alt={displayName}
          width={size}
          height={size}
          className={`pet-view__img ${loaded ? "pet-view__img--loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
          style={{ objectFit: "contain" }}
        />
      </div>
      {showName && (
        <div className="pet-view__name" style={{ marginTop: 8, fontWeight: 700, fontSize: 16 }}>
          {displayName}
        </div>
      )}
    </div>
  );
}
