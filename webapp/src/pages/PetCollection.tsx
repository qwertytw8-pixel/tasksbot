import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type GamePet, type GameProfile } from "../api";
import { PetView } from "../components/PetView";
import { TrashXIcon } from "../icons";
import { t } from "../useLocale";
import { haptic } from "../telegram";

export function PetCollectionPage() {
  const [pets, setPets] = useState<GamePet[]>([]);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [petsData, profileData] = await Promise.all([
        api.gamePets(),
        api.gameProfile(),
      ]);
      setPets(petsData);
      setProfile(profileData);
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
        await load();
      } catch {
        // ignore
      } finally {
        setDeleting(null);
      }
    },
    [load]
  );

  if (loading) return <div className="spinner">{t("Загрузка…", "Loading…")}</div>;

  const activePetId = profile?.active_pet?.id;

  return (
    <div className="page pet-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("Коллекция", "Collection")}</h1>
          <p className="page-header__date">
            {pets.length} {t("питомцев", "pets")}
          </p>
        </div>
        <button className="pet-back-btn" onClick={() => navigate("/pet")}>
          {t("Назад", "Back")}
        </button>
      </div>

      {pets.length === 0 && (
        <div className="pet-empty">
          <p>{t("Пока нет питомцев. Купи яйцо в магазине!", "No pets yet. Buy an egg from the shop!")}</p>
        </div>
      )}

      <div className="pet-collection__grid">
        {pets.map((pet) => {
          const isActive = pet.id === activePetId;
          const isDeleting = deleting === pet.id;
          return (
            <div key={pet.id} className={`pet-collection__card ${isActive ? "pet-collection__card--active" : ""}`}>
              <PetView
                characterType={pet.character_type}
                rarity={pet.rarity}
                stage={pet.stage}
                size={100}
              />
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
    </div>
  );
}
