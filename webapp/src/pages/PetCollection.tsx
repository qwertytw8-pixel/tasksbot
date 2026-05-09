import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type FuseResponse, type GameItem, type GamePet, type GameProfile } from "../api";
import { PetView } from "../components/PetView";
import { TrashXIcon } from "../icons";
import { useToast } from "../components/Toast";
import { useT } from "../i18n";
import { haptic } from "../telegram";

type Tab = "pets" | "fusion" | "backgrounds";

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  rare: "#818CF8",
  epic: "#F59E0B",
};

const RARITY_LABELS: Record<string, [string, string]> = {
  common: ["Обычный", "Common"],
  rare: ["Редкий", "Rare"],
  epic: ["Эпический", "Epic"],
};

export function PetCollectionPage() {
  const t = useT();
  const [pets, setPets] = useState<GamePet[]>([]);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [ownedItems, setOwnedItems] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("pets");
  const [fuseSelected, setFuseSelected] = useState<number[]>([]);
  const [fusing, setFusing] = useState(false);
  const [fuseResult, setFuseResult] = useState<FuseResponse | null>(null);
  const navigate = useNavigate();
  const { show: showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const [petsData, profileData, shopData] = await Promise.all([
        api.gamePets(),
        api.gameProfile(),
        api.gameShop(),
      ]);
      setPets(petsData);
      setProfile(profileData);
      setOwnedItems(shopData.filter((i) => i.owned));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleActivate = useCallback(
    async (petId: number) => {
      try {
        await api.gameActivatePet(petId);
        haptic("medium");
        await load();
      } catch {
        // ignore
      }
    },
    [load]
  );

  const handleDelete = useCallback(
    async (petId: number) => {
      const confirmed = window.confirm(
        t(
          "Удалить этого питомца? Это действие нельзя отменить.",
          "Delete this pet? This action cannot be undone."
        )
      );
      if (!confirmed) return;
      setDeleting(petId);
      try {
        await api.gameDeletePet(petId);
        haptic("heavy");
        showToast(t("Питомец удалён", "Pet deleted"), "info");
        await load();
      } catch {
        // ignore
      } finally {
        setDeleting(null);
      }
    },
    [load, showToast]
  );

  const handleEquipBackground = useCallback(
    async (itemId: number) => {
      try {
        await api.gameSetBackground(itemId);
        haptic("medium");
        showToast(t("Фон установлен!", "Background equipped!"), "success");
        await load();
      } catch {
        // ignore
      }
    },
    [load, showToast]
  );

  const handleRemoveBackground = useCallback(async () => {
    try {
      await api.gameSetBackground(null);
      haptic("medium");
      showToast(t("Фон убран", "Background removed"), "info");
      await load();
    } catch {
      // ignore
    }
  }, [load, showToast]);

  const handleFuseToggle = useCallback((petId: number) => {
    setFuseSelected((prev) => {
      if (prev.includes(petId)) return prev.filter((id) => id !== petId);
      if (prev.length >= 3) return prev;
      return [...prev, petId];
    });
  }, []);

  const handleFuse = useCallback(async () => {
    if (fuseSelected.length !== 3) return;
    setFusing(true);
    try {
      const result = await api.gameFuse(fuseSelected);
      setFuseResult(result);
      haptic("heavy");
      setFuseSelected([]);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Fusion failed", "error");
    } finally {
      setFusing(false);
    }
  }, [fuseSelected, load, showToast]);

  if (loading) return <div className="spinner">{t("Загрузка…", "Loading…")}</div>;

  const activePetId = profile?.active_pet?.id;
  const activeBackgroundSlug = profile?.active_background_slug;
  const ownedBackgrounds = ownedItems.filter((i) => i.type === "background");

  return (
    <div className="page pet-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("Коллекция", "Collection")}</h1>
          <p className="page-header__date">
            {tab === "pets"
              ? `${pets.length} ${t("питомцев", "pets")}`
              : `${ownedBackgrounds.length} ${t("фонов", "backgrounds")}`}
          </p>
        </div>
        <button className="pet-back-btn" onClick={() => navigate("/pet")}>
          {t("Назад", "Back")}
        </button>
      </div>

      {/* Tabs */}
      <div className="collection-tabs">
        <button
          className={`collection-tabs__btn ${tab === "pets" ? "collection-tabs__btn--active" : ""}`}
          onClick={() => { setTab("pets"); setFuseResult(null); }}
        >
          {t("Питомцы", "Pets")}
        </button>
        <button
          className={`collection-tabs__btn ${tab === "fusion" ? "collection-tabs__btn--active" : ""}`}
          onClick={() => { setTab("fusion"); setFuseSelected([]); setFuseResult(null); }}
        >
          {t("Слияние", "Fusion")}
        </button>
        <button
          className={`collection-tabs__btn ${tab === "backgrounds" ? "collection-tabs__btn--active" : ""}`}
          onClick={() => { setTab("backgrounds"); setFuseResult(null); }}
        >
          {t("Фоны", "Backgrounds")}
        </button>
      </div>

      {/* Pets tab */}
      {tab === "pets" && (
        <>
          {pets.length === 0 && (
            <div className="pet-empty">
              <p>{t("Пока нет питомцев. Купи яйцо в магазине!", "No pets yet. Buy an egg from the shop!")}</p>
            </div>
          )}

          <div className="pet-collection__grid">
            {pets.map((pet) => {
              const isActive = pet.id === activePetId;
              const isDeleting = deleting === pet.id;
              const rarityColor = RARITY_COLORS[pet.rarity] ?? "#9CA3AF";
              const [rarityRu, rarityEn] = RARITY_LABELS[pet.rarity] ?? ["?", "?"];
              return (
                <div key={pet.id} className={`pet-collection__card ${isActive ? "pet-collection__card--active" : ""}`}>
                  <div className="pet-collection__rarity-badge" style={{ color: rarityColor }}>
                    {t(rarityRu, rarityEn)}
                  </div>
                  <PetView
                    characterType={pet.character_type}
                    rarity={pet.rarity}
                    stage={pet.stage}
                    size={100}
                  />
                  <div className="pet-collection__name">
                    {pet.name ?? t("Без имени", "Unnamed")}
                  </div>
                  <div className="pet-collection__info">
                    <span className="pet-collection__stage">
                      {t(pet.stage_name_ru, pet.stage_name_en)}
                    </span>
                    <span className="pet-collection__xp">{pet.xp} XP</span>
                  </div>
                  <div className="pet-collection__actions">
                    {isActive ? (
                      <div className="pet-collection__active-badge">
                        {t("Активный", "Active")}
                      </div>
                    ) : (
                      <button
                        className="pet-collection__activate-btn"
                        onClick={() => handleActivate(pet.id)}
                      >
                        {t("Выбрать", "Select")}
                      </button>
                    )}
                    <button
                      className="pet-collection__delete-btn"
                      onClick={() => handleDelete(pet.id)}
                      disabled={isDeleting}
                      title={t("Удалить", "Delete")}
                    >
                      <TrashXIcon style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Fusion tab */}
      {tab === "fusion" && (
        <>
          <div className="fusion-info">
            <p>{t(
              "Объедини 3 питомцев одной редкости, чтобы получить питомца следующей редкости!",
              "Combine 3 pets of the same rarity to get a pet of the next rarity!"
            )}</p>
            <p className="fusion-info__rules">
              {t("3 обычных → 1 редкий • 3 редких → 1 эпический", "3 Common → 1 Rare • 3 Rare → 1 Epic")}
            </p>
          </div>

          {fuseResult && (
            <div className="fusion-result">
              <div className="fusion-result__glow">
                <PetView
                  characterType={fuseResult.pet.character_type}
                  rarity={fuseResult.pet.rarity}
                  stage={fuseResult.pet.stage}
                  size={120}
                />
              </div>
              <div className="fusion-result__text">
                <span className="fusion-result__rarity" style={{ color: RARITY_COLORS[fuseResult.pet.rarity] }}>
                  {t(fuseResult.rarity_name_ru, fuseResult.rarity_name_en)}
                </span>
                <span className="fusion-result__name">
                  {t(fuseResult.character_name_ru, fuseResult.character_name_en)}
                </span>
              </div>
              <button className="fusion-result__close" onClick={() => setFuseResult(null)}>
                {t("Отлично!", "Awesome!")}
              </button>
            </div>
          )}

          {!fuseResult && (
            <>
              <div className="fusion-slots">
                {[0, 1, 2].map((i) => {
                  const selectedPet = fuseSelected[i] ? pets.find((p) => p.id === fuseSelected[i]) : null;
                  return (
                    <div key={i} className={`fusion-slot ${selectedPet ? "fusion-slot--filled" : ""}`}>
                      {selectedPet ? (
                        <PetView
                          characterType={selectedPet.character_type}
                          rarity={selectedPet.rarity}
                          stage={selectedPet.stage}
                          size={56}
                        />
                      ) : (
                        <span className="fusion-slot__placeholder">?</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {fuseSelected.length === 3 && (
                <button
                  className="fusion-btn"
                  onClick={handleFuse}
                  disabled={fusing}
                >
                  {fusing ? t("Слияние…", "Fusing…") : t("Объединить!", "Fuse!")}
                </button>
              )}

              {(() => {
                const fusable = pets.filter((p) => p.rarity === "common" || p.rarity === "rare");
                const selectedRarity = fuseSelected.length > 0
                  ? pets.find((p) => p.id === fuseSelected[0])?.rarity
                  : null;
                const filtered = selectedRarity
                  ? fusable.filter((p) => p.rarity === selectedRarity)
                  : fusable;
                return (
                  <div className="pet-collection__grid">
                    {filtered.map((pet) => {
                      const isSelected = fuseSelected.includes(pet.id);
                      const rarityColor = RARITY_COLORS[pet.rarity] ?? "#9CA3AF";
                      const [rarityRu, rarityEn] = RARITY_LABELS[pet.rarity] ?? ["?", "?"];
                      return (
                        <div
                          key={pet.id}
                          className={`pet-collection__card ${isSelected ? "pet-collection__card--fuse-selected" : ""}`}
                          onClick={() => handleFuseToggle(pet.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="pet-collection__rarity-badge" style={{ color: rarityColor }}>
                            {t(rarityRu, rarityEn)}
                          </div>
                          <PetView
                            characterType={pet.character_type}
                            rarity={pet.rarity}
                            stage={pet.stage}
                            size={80}
                          />
                          <div className="pet-collection__name">
                            {pet.name ?? t("Без имени", "Unnamed")}
                          </div>
                          {isSelected && (
                            <div className="fusion-check">✓</div>
                          )}
                        </div>
                      );
                    })}
                    {filtered.length === 0 && (
                      <div className="pet-empty">
                        <p>{t("Нет питомцев для слияния", "No pets available for fusion")}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}

      {/* Backgrounds tab */}
      {tab === "backgrounds" && (
        <>
          {ownedBackgrounds.length === 0 && (
            <div className="pet-empty">
              <p>{t("Нет фонов. Купи фон в магазине!", "No backgrounds. Buy one from the shop!")}</p>
            </div>
          )}

          <div className="pet-collection__grid">
            {ownedBackgrounds.map((bg) => {
              const isEquipped = bg.slug === activeBackgroundSlug;
              return (
                <div key={bg.id} className={`pet-collection__card ${isEquipped ? "pet-collection__card--active" : ""}`}>
                  {bg.image_path && (
                    <img
                      src={bg.image_path}
                      alt={t(bg.name_ru, bg.name_en)}
                      className="pet-collection__bg-img"
                      draggable={false}
                    />
                  )}
                  <div className="pet-collection__name" style={{ fontWeight: 600 }}>
                    {t(bg.name_ru, bg.name_en)}
                  </div>
                  <div className="pet-collection__actions">
                    {isEquipped ? (
                      <button
                        className="pet-collection__delete-btn"
                        onClick={handleRemoveBackground}
                        title={t("Убрать фон", "Remove background")}
                        style={{ fontSize: 11, padding: "4px 10px" }}
                      >
                        {t("Убрать", "Remove")}
                      </button>
                    ) : (
                      <button
                        className="pet-collection__activate-btn"
                        onClick={() => handleEquipBackground(bg.id)}
                      >
                        {t("Установить", "Equip")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
