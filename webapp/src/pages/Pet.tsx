import { useCallback, useEffect, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { useNavigate } from "react-router-dom";

import { api, type GameProfile } from "../api";
import { PetView } from "../components/PetView";
import { CoinIcon, FireIcon, ShopBagIcon, TrophyIcon, GridIcon, EditIcon } from "../icons";
import { useT } from "../i18n";
import { haptic } from "../telegram";

interface TapParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const TAP_EMOJIS = ["\u2728", "\u2764\uFE0F", "\u2B50", "\uD83D\uDCAB", "\uD83C\uDF1F"];
let tapId = 0;

interface MoodLevel {
  emoji: string;
  labelRu: string;
  labelEn: string;
  className: string;
}

const MOOD_LEVELS: MoodLevel[] = [
  { emoji: "\uD83D\uDCA4", labelRu: "\u041F\u0438\u0442\u043E\u043C\u0435\u0446 \u0441\u043A\u0443\u0447\u0430\u0435\u0442\u2026", labelEn: "Your pet is bored\u2026", className: "pet-mood--idle" },
  { emoji: "\uD83D\uDE10", labelRu: "\u041C\u043E\u0436\u043D\u043E \u043B\u0443\u0447\u0448\u0435", labelEn: "Could be better", className: "pet-mood--low" },
  { emoji: "\uD83D\uDE0A", labelRu: "\u0425\u043E\u0440\u043E\u0448\u0438\u0439 \u0434\u0435\u043D\u044C", labelEn: "Good day", className: "pet-mood--good" },
  { emoji: "\uD83D\uDD25", labelRu: "\u0412 \u0443\u0434\u0430\u0440\u0435!", labelEn: "On fire!", className: "pet-mood--fire" },
];

function getMood(tasksDone: number, streakActive: boolean): MoodLevel {
  if (tasksDone >= 5 && streakActive) return MOOD_LEVELS[3];
  if (tasksDone >= 3) return MOOD_LEVELS[2];
  if (tasksDone >= 1) return MOOD_LEVELS[1];
  return MOOD_LEVELS[0];
}

interface PetPhrase {
  ru: string;
  en: string;
}

const PET_PHRASES_IDLE: PetPhrase[] = [
  { ru: "\u041F\u043E\u0433\u043B\u0430\u0434\u044C \u043C\u0435\u043D\u044F!", en: "Pet me!" },
  { ru: "\u0414\u0430\u0432\u0430\u0439 \u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C \u0441\u0434\u0435\u043B\u0430\u0435\u043C!", en: "Let's do something!" },
  { ru: "\u0421\u043A\u0443\u0447\u0430\u044E\u2026", en: "Bored\u2026" },
];

const PET_PHRASES_LOW: PetPhrase[] = [
  { ru: "\u0425\u043E\u0440\u043E\u0448\u0435\u0435 \u043D\u0430\u0447\u0430\u043B\u043E!", en: "Good start!" },
  { ru: "\u0414\u0430\u0432\u0430\u0439 \u0435\u0449\u0451!", en: "Keep going!" },
  { ru: "\u0422\u044B \u043C\u043E\u043B\u043E\u0434\u0435\u0446!", en: "You're doing great!" },
];

const PET_PHRASES_GOOD: PetPhrase[] = [
  { ru: "\u041A\u0440\u0443\u0442\u043E \u0441\u0435\u0433\u043E\u0434\u043D\u044F!", en: "Awesome today!" },
  { ru: "\u041C\u043D\u0435 \u043D\u0440\u0430\u0432\u0438\u0442\u0441\u044F!", en: "I like it!" },
  { ru: "\u041C\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u0430!", en: "We're a team!" },
];

const PET_PHRASES_FIRE: PetPhrase[] = [
  { ru: "\u0422\u044B \u043B\u0435\u0433\u0435\u043D\u0434\u0430! \uD83D\uDD25", en: "You're a legend! \uD83D\uDD25" },
  { ru: "\u041D\u0435\u0440\u0435\u0430\u043B\u044C\u043D\u043E!", en: "Unreal!" },
  { ru: "\u0413\u043E\u0440\u0438\u043C!", en: "We're on fire!" },
];

function getPetPhrase(tasksDone: number, streakActive: boolean): PetPhrase {
  let phrases: PetPhrase[];
  if (tasksDone >= 5 && streakActive) phrases = PET_PHRASES_FIRE;
  else if (tasksDone >= 3) phrases = PET_PHRASES_GOOD;
  else if (tasksDone >= 1) phrases = PET_PHRASES_LOW;
  else phrases = PET_PHRASES_IDLE;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function PetPage() {
  const t = useT();
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tapping, setTapping] = useState(false);
  const [particles, setParticles] = useState<TapParticle[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [phrase, setPhrase] = useState<PetPhrase | null>(null);
  const petAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const p = await api.gameProfile();
      setProfile(p);
      setPhrase(getPetPhrase(p.today_tasks_done, p.streak_days > 0));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveName = useCallback(async () => {
    const activePet = profile?.active_pet;
    if (!activePet || !newName.trim()) return;
    setRenaming(true);
    try {
      await api.gameRenamePet(activePet.id, newName.trim());
      setProfile((prev: GameProfile | null) =>
        prev && prev.active_pet
          ? { ...prev, active_pet: { ...prev.active_pet, name: newName.trim() } as typeof prev.active_pet }
          : prev
      );
      setEditingName(false);
      haptic("light");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRenaming(false);
    }
  }, [profile, newName]);

  const handlePetTap = useCallback((e: MouseEvent | TouchEvent) => {
    haptic("light");
    setTapping(true);
    setTimeout(() => setTapping(false), 300);

    const rect = petAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const emoji = TAP_EMOJIS[Math.floor(Math.random() * TAP_EMOJIS.length)];
    const id = tapId++;

    setParticles((prev: TapParticle[]) => [...prev, { id, x, y, emoji }]);
    setTimeout(() => {
      setParticles((prev: TapParticle[]) => prev.filter((p: TapParticle) => p.id !== id));
    }, 800);
  }, []);

  if (loading) return <div className="spinner">{t("\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026", "Loading\u2026")}</div>;
  if (error) return <div className="page"><p style={{ color: "var(--tb-danger)" }}>{error}</p></div>;
  if (!profile) return null;

  if (!profile.has_pet) {
    return <PetFirstEgg />;
  }

  const pet = profile.active_pet;
  const xpProgress = pet
    ? Math.min(
        100,
        pet.xp_for_next > pet.xp_current_stage
          ? ((pet.xp - pet.xp_current_stage) / (pet.xp_for_next - pet.xp_current_stage)) * 100
          : 100
      )
    : 0;

  const dailyProgress = profile.daily_cap > 0
    ? Math.min(100, (profile.daily_coins_earned / profile.daily_cap) * 100)
    : 0;

  const taskProgress = profile.today_tasks_total > 0
    ? Math.min(100, (profile.today_tasks_done / profile.today_tasks_total) * 100)
    : 0;

  const mood = getMood(profile.today_tasks_done, profile.streak_days > 0);

  return (
    <div className="page pet-page">
      {/* Glass header pills */}
      <div className="pet-header">
        <div className="pet-header__pill">
          <CoinIcon style={{ width: 16, height: 16, color: "#facc15" }} />
          <span className="pet-header__pill-value">{profile.coins}</span>
        </div>
        <div className="pet-header__pill">
          <FireIcon style={{ width: 16, height: 16, color: "#f97316" }} />
          <span className="pet-header__pill-value">
            {profile.streak_days} {t("\u0434\u043d.", "d")}
          </span>
        </div>
      </div>

      {/* Pet display with breathing animation */}
      {pet && (
        <div
          className={`pet-display pet-display--tappable ${tapping ? "pet-display--tapping" : ""}`}
          ref={petAreaRef}
          onClick={handlePetTap}
          style={{ position: "relative", cursor: "pointer" }}
        >
          <div className={`pet-display__breathing pet-display__breathing--${pet.rarity}`}>
            <PetView
              characterType={pet.character_type}
              rarity={pet.rarity}
              stage={pet.stage}
              name={pet.name}
              showName={false}
              accessorySlug={pet.accessory_slug}
              backgroundSlug={profile.active_background_slug}
              size={160}
            />
          </div>

          {/* Floating rarity particles */}
          {pet.rarity !== "common" && (
            <div className={`pet-display__rarity-particles pet-display__rarity-particles--${pet.rarity}`}>
              <span className="rarity-dot rarity-dot--1" />
              <span className="rarity-dot rarity-dot--2" />
              <span className="rarity-dot rarity-dot--3" />
            </div>
          )}

          {/* Tap particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="pet-tap-particle"
              style={{ left: p.x, top: p.y }}
            >
              {p.emoji}
            </span>
          ))}

          {/* Pet phrase bubble */}
          {phrase && (
            <div className="pet-phrase">
              <span className="pet-phrase__text">{t(phrase.ru, phrase.en)}</span>
            </div>
          )}

          {/* Pet name + edit */}
          {editingName ? (
            <div className="pet-name-edit">
              <input
                className="pet-name-edit__input"
                type="text"
                maxLength={16}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("\u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440, \u041f\u0443\u0448\u043e\u043a", "e.g. Fluffy")}
                autoFocus
              />
              <button
                className="pet-name-edit__btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveName();
                }}
                disabled={renaming || !newName.trim()}
              >
                {t("\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c", "Save")}
              </button>
            </div>
          ) : (
            <div className="pet-display__name-row">
              <div className="pet-display__name">{pet.name}</div>
              <button
                className="pet-display__edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewName(pet.name || "");
                  setEditingName(true);
                }}
                title={t("\u041f\u0435\u0440\u0435\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u0442\u044c", "Rename")}
              >
                <EditIcon style={{ width: 14, height: 14, color: "var(--tb-accent-strong)" }} />
              </button>
            </div>
          )}

          {/* XP progress bar with shimmer */}
          <div className="pet-xp">
            <div className="pet-xp__bar">
              <div className="pet-xp__fill" style={{ width: `${xpProgress}%` }}>
                <div className="pet-xp__shimmer" />
              </div>
            </div>
            <div className="pet-xp__text">
              {pet.xp}/{pet.xp_for_next} XP
              <span className="pet-xp__stage">
                {" "}
                {t(pet.stage_name_ru, pet.stage_name_en)}
                {pet.stage < 5 && ` \u2192 ${t(
                  ["\u041c\u0430\u043b\u044b\u0448", "\u041f\u043e\u0434\u0440\u043e\u0441\u0442\u043e\u043a", "\u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0439", "\u041c\u0430\u0441\u0442\u0435\u0440", "\u041b\u0435\u0433\u0435\u043d\u0434\u0430"][pet.stage] ?? "?",
                  ["Baby", "Teen", "Adult", "Master", "Legend"][pet.stage] ?? "?"
                )}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mood Widget */}
      <div className={`pet-mood ${mood.className}`}>
        <span className="pet-mood__emoji">{mood.emoji}</span>
        <span className="pet-mood__label">{t(mood.labelRu, mood.labelEn)}</span>
        <span className="pet-mood__tasks">
          {profile.today_tasks_done}/{profile.today_tasks_total || "0"}
        </span>
      </div>

      {/* Combo indicator */}
      {profile.combo_count > 0 && (
        <div className={`pet-combo ${profile.combo_multiplier > 1 ? "pet-combo--active" : ""}`}>
          <span className="pet-combo__icon">{"\u26A1"}</span>
          <span className="pet-combo__label">
            {t("Комбо", "Combo")} x{profile.combo_count}
          </span>
          {profile.combo_multiplier > 1 && (
            <span className="pet-combo__mult">
              {"\u00D7"}{profile.combo_multiplier}
            </span>
          )}
        </div>
      )}

      {/* Glass stats cards */}
      <div className="pet-stats-grid">
        <div className="pet-stat-card">
          <div className="pet-stat-card__header">
            <CoinIcon style={{ width: 14, height: 14, color: "#facc15" }} />
            <span>{t("\u0421\u0435\u0433\u043e\u0434\u043d\u044f", "Today")}</span>
          </div>
          <div className="pet-stat-card__value">+{profile.daily_coins_earned}</div>
          <div className="pet-stat-card__bar">
            <div className="pet-stat-card__fill" style={{ width: `${dailyProgress}%` }} />
          </div>
          <div className="pet-stat-card__sub">{profile.daily_coins_earned}/{profile.daily_cap}</div>
        </div>

        {profile.today_tasks_total > 0 && (
          <div className="pet-stat-card">
            <div className="pet-stat-card__header">
              <span style={{ fontSize: 14 }}>{"\u2705"}</span>
              <span>{t("\u0417\u0430\u0434\u0430\u0447\u0438", "Tasks")}</span>
            </div>
            <div className="pet-stat-card__value">{profile.today_tasks_done}/{profile.today_tasks_total}</div>
            <div className="pet-stat-card__bar">
              <div className="pet-stat-card__fill pet-stat-card__fill--tasks" style={{ width: `${taskProgress}%` }} />
            </div>
            <div className="pet-stat-card__sub">{Math.round(taskProgress)}%</div>
          </div>
        )}
      </div>

      {/* Glass pill navigation */}
      <div className="pet-nav">
        <button className="pet-nav__btn" onClick={() => navigate("/pet/shop")}>
          <ShopBagIcon style={{ width: 20, height: 20 }} />
          <span>{t("\u041c\u0430\u0433\u0430\u0437\u0438\u043d", "Shop")}</span>
        </button>
        <button className="pet-nav__btn" onClick={() => navigate("/pet/achievements")}>
          <TrophyIcon style={{ width: 20, height: 20 }} />
          <span>{t("\u0414\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u044f", "Achievements")}</span>
        </button>
        <button className="pet-nav__btn" onClick={() => navigate("/pet/collection")}>
          <GridIcon style={{ width: 20, height: 20 }} />
          <span>{t("\u041a\u043e\u043b\u043b\u0435\u043a\u0446\u0438\u044f", "Collection")}</span>
        </button>
      </div>
    </div>
  );
}

function PetFirstEgg() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="page pet-page pet-first-egg">
      <div className="pet-first-egg__content">
        <div className="pet-first-egg__egg-img">
          <img src="/game/eggs/common.png" alt="egg" width={120} height={120} draggable={false} />
        </div>
        <h2>{t("\u0422\u0432\u043e\u0451 \u043f\u0435\u0440\u0432\u043e\u0435 \u044f\u0439\u0446\u043e!", "Your first egg!")}</h2>
        <p>{t("\u041d\u0430\u0436\u043c\u0438, \u0447\u0442\u043e\u0431\u044b \u0443\u0437\u043d\u0430\u0442\u044c, \u043a\u0442\u043e \u0432\u043d\u0443\u0442\u0440\u0438!", "Tap to find out who's inside!")}</p>
        <button
          className="pet-first-egg__btn"
          onClick={() => navigate("/pet/hatch?egg=egg_common&first=1")}
        >
          {t("\u041e\u0442\u043a\u0440\u044b\u0442\u044c!", "Open!")}
        </button>
      </div>
    </div>
  );
}
