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
  const petAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const p = await api.gameProfile();
      setProfile(p);
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

  return (
    <div className="page pet-page">
      {/* Header with coins and streak */}
      <div className="pet-header">
        <div className="pet-header__coins">
          <CoinIcon className="pet-header__coin-icon" style={{ width: 18, height: 18, color: "var(--tb-accent-strong)" }} />
          <span className="pet-header__coin-value">{profile.coins}</span>
        </div>
        <div className="pet-header__streak">
          <FireIcon className="pet-header__streak-icon" style={{ width: 18, height: 18, color: "var(--tb-accent-strong)" }} />
          <span className="pet-header__streak-value">
            {profile.streak_days} {t("\u0434\u043d.", "d")}
          </span>
        </div>
      </div>

      {/* Pet display */}
      {pet && (
        <div
          className={`pet-display pet-display--tappable ${tapping ? "pet-display--tapping" : ""}`}
          ref={petAreaRef}
          onClick={handlePetTap}
          style={{ position: "relative", cursor: "pointer" }}
        >
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

          {/* XP progress bar */}
          <div className="pet-xp">
            <div className="pet-xp__bar">
              <div className="pet-xp__fill" style={{ width: `${xpProgress}%` }} />
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

      {/* Today stats */}
      <div className="pet-stats">
        <div className="pet-stats__row">
          <span>
            {t("\u0421\u0435\u0433\u043e\u0434\u043d\u044f", "Today")}: +{profile.daily_coins_earned} <CoinIcon style={{ width: 14, height: 14, color: "#facc15", verticalAlign: "middle" }} />
          </span>
          <span className="pet-stats__cap">
            ({profile.daily_coins_earned}/{profile.daily_cap})
          </span>
        </div>
        <div className="pet-stats__bar">
          <div className="pet-stats__fill" style={{ width: `${dailyProgress}%` }} />
        </div>

        {profile.today_tasks_total > 0 && (
          <>
            <div className="pet-stats__row" style={{ marginTop: 8 }}>
              <span>
                {t("\u0417\u0430\u0434\u0430\u0447\u0438 \u0434\u043d\u044f", "Today's tasks")}
              </span>
              <span>
                {profile.today_tasks_done}/{profile.today_tasks_total}
              </span>
            </div>
            <div className="pet-stats__bar">
              <div className="pet-stats__fill pet-stats__fill--tasks" style={{ width: `${taskProgress}%` }} />
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="pet-nav">
        <button className="pet-nav__btn" onClick={() => navigate("/pet/shop")}>
          <ShopBagIcon style={{ width: 18, height: 18 }} />
          {t("\u041c\u0430\u0433\u0430\u0437\u0438\u043d", "Shop")}
        </button>
        <button className="pet-nav__btn" onClick={() => navigate("/pet/achievements")}>
          <TrophyIcon style={{ width: 18, height: 18 }} />
          {t("\u0414\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u044f", "Achievements")}
        </button>
        <button className="pet-nav__btn" onClick={() => navigate("/pet/collection")}>
          <GridIcon style={{ width: 18, height: 18 }} />
          {t("\u041a\u043e\u043b\u043b\u0435\u043a\u0446\u0438\u044f", "Collection")}
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
