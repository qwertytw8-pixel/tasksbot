import { t } from "../useLocale";

interface PetViewProps {
  characterType: string;
  rarity: string;
  stage: number;
  accessorySlug?: string | null;
  size?: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  rare: "#818CF8",
  epic: "#F59E0B",
};

const CHARACTER_LABELS: Record<string, [string, string]> = {
  cat: ["Котёнок", "Kitty"],
  fox: ["Лисёнок", "Foxy"],
  dragon: ["Дракончик", "Draco"],
};

function CatSVG({ stage, size }: { stage: number; size: number }) {
  const scale = 0.6 + stage * 0.1;
  const s = size * scale;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      {/* Ears */}
      <polygon points="25,35 35,10 45,35" fill="#FFB366" stroke="#E59550" strokeWidth="2" />
      <polygon points="55,35 65,10 75,35" fill="#FFB366" stroke="#E59550" strokeWidth="2" />
      {/* Head */}
      <circle cx="50" cy="50" r={25 + stage * 2} fill="#FFB366" stroke="#E59550" strokeWidth="2" />
      {/* Eyes */}
      <circle cx="40" cy="45" r="4" fill="#333" />
      <circle cx="60" cy="45" r="4" fill="#333" />
      <circle cx="41" cy="44" r="1.5" fill="white" />
      <circle cx="61" cy="44" r="1.5" fill="white" />
      {/* Nose */}
      <ellipse cx="50" cy="55" rx="3" ry="2" fill="#E8847A" />
      {/* Mouth */}
      <path d="M47,58 Q50,62 53,58" fill="none" stroke="#E59550" strokeWidth="1.5" />
      {/* Whiskers */}
      <line x1="25" y1="52" x2="38" y2="54" stroke="#E59550" strokeWidth="1" />
      <line x1="25" y1="56" x2="38" y2="56" stroke="#E59550" strokeWidth="1" />
      <line x1="62" y1="54" x2="75" y2="52" stroke="#E59550" strokeWidth="1" />
      <line x1="62" y1="56" x2="75" y2="56" stroke="#E59550" strokeWidth="1" />
      {stage >= 3 && <circle cx="50" cy="50" r={30 + stage * 2} fill="none" stroke="#FFD70044" strokeWidth="3" />}
      {stage >= 4 && <circle cx="50" cy="50" r={35 + stage * 2} fill="none" stroke="#FFD70022" strokeWidth="2" />}
    </svg>
  );
}

function FoxSVG({ stage, size }: { stage: number; size: number }) {
  const scale = 0.6 + stage * 0.1;
  const s = size * scale;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      {/* Ears */}
      <polygon points="22,35 32,5 42,35" fill="#FF8C42" stroke="#E5753A" strokeWidth="2" />
      <polygon points="58,35 68,5 78,35" fill="#FF8C42" stroke="#E5753A" strokeWidth="2" />
      <polygon points="29,30 32,15 38,30" fill="white" />
      <polygon points="62,30 68,15 72,30" fill="white" />
      {/* Head */}
      <circle cx="50" cy="50" r={25 + stage * 2} fill="#FF8C42" stroke="#E5753A" strokeWidth="2" />
      {/* White face */}
      <ellipse cx="50" cy="58" rx="15" ry="12" fill="white" />
      {/* Eyes */}
      <ellipse cx="38" cy="44" rx="3" ry="4" fill="#333" />
      <ellipse cx="62" cy="44" rx="3" ry="4" fill="#333" />
      <circle cx="39" cy="43" r="1.3" fill="white" />
      <circle cx="63" cy="43" r="1.3" fill="white" />
      {/* Nose */}
      <ellipse cx="50" cy="52" rx="4" ry="3" fill="#333" />
      {stage >= 3 && <circle cx="50" cy="50" r={30 + stage * 2} fill="none" stroke="#818CF844" strokeWidth="3" />}
      {stage >= 4 && <circle cx="50" cy="50" r={35 + stage * 2} fill="none" stroke="#818CF822" strokeWidth="2" />}
    </svg>
  );
}

function DragonSVG({ stage, size }: { stage: number; size: number }) {
  const scale = 0.6 + stage * 0.1;
  const s = size * scale;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      {/* Horns */}
      <polygon points="30,30 25,5 40,25" fill="#7C3AED" stroke="#6D28D9" strokeWidth="1.5" />
      <polygon points="70,30 75,5 60,25" fill="#7C3AED" stroke="#6D28D9" strokeWidth="1.5" />
      {/* Head */}
      <circle cx="50" cy="50" r={26 + stage * 2} fill="#8B5CF6" stroke="#7C3AED" strokeWidth="2" />
      {/* Belly */}
      <ellipse cx="50" cy="58" rx="14" ry="10" fill="#C4B5FD" />
      {/* Eyes */}
      <ellipse cx="38" cy="44" rx="5" ry="4" fill="#FDE68A" />
      <ellipse cx="62" cy="44" rx="5" ry="4" fill="#FDE68A" />
      <ellipse cx="39" cy="44" rx="2.5" ry="3.5" fill="#333" />
      <ellipse cx="63" cy="44" rx="2.5" ry="3.5" fill="#333" />
      {/* Nostrils */}
      <circle cx="45" cy="54" r="2" fill="#7C3AED" />
      <circle cx="55" cy="54" r="2" fill="#7C3AED" />
      {/* Fire breath for high stages */}
      {stage >= 3 && (
        <path d="M44,62 Q40,72 50,80 Q60,72 56,62" fill="#FDE68A" opacity="0.6" />
      )}
      {stage >= 4 && <circle cx="50" cy="50" r={33 + stage * 2} fill="none" stroke="#F59E0B44" strokeWidth="3" />}
      {stage >= 5 && <circle cx="50" cy="50" r={38 + stage * 2} fill="none" stroke="#F59E0B22" strokeWidth="2" />}
    </svg>
  );
}

export function PetView({ characterType, rarity, stage, size = 160 }: PetViewProps) {
  const borderColor = RARITY_COLORS[rarity] ?? RARITY_COLORS.common;
  const label = CHARACTER_LABELS[characterType];
  const name = label ? t(label[0], label[1]) : characterType;

  return (
    <div className="pet-view" style={{ textAlign: "center" }}>
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
          background: "var(--tb-glass)",
        }}
      >
        {characterType === "cat" && <CatSVG stage={stage} size={size} />}
        {characterType === "fox" && <FoxSVG stage={stage} size={size} />}
        {characterType === "dragon" && <DragonSVG stage={stage} size={size} />}
      </div>
      <div className="pet-view__name" style={{ marginTop: 8, fontWeight: 700, fontSize: 16 }}>
        {name}
      </div>
    </div>
  );
}
