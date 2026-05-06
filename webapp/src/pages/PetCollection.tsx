import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type GameItem, type GamePet, type GameProfile } from "../api";
import { PetView } from "../components/PetView";
import { TrashXIcon } from "../icons";
import { useToast } from "../components/Toast";
import { useT } from "../i18n";
import { haptic } from "../telegram";

type Tab = "pets" | "backgrounds";

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
          onClick={() => setTab("pets")}
        >
          {t("Питомцы", "Pets")}
        </button>
        <button
          className={`collection-tabs__btn ${tab === "backgrounds" ? "collection-tabs__btn--active" : ""}`}
          onClick={() => setTab("backgrounds")}
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
