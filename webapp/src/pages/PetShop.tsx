import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type GameItem, type GameProfile } from "../api";
import { t } from "../useLocale";
import { haptic } from "../telegram";

export function PetShopPage() {
  const [items, setItems] = useState<GameItem[]>([]);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [shopData, profileData] = await Promise.all([
        api.gameShop(),
        api.gameProfile(),
      ]);
      setItems(shopData);
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

  const handleBuy = useCallback(
    async (item: GameItem) => {
      if (!profile || buying !== null) return;
      if (item.owned && item.type !== "egg") return;
      if (profile.coins < item.price) return;
      setBuying(item.id);
      try {
        if (item.type === "egg") {
          navigate(`/pet/hatch?egg=${item.slug}`);
          return;
        }
        await api.gameBuy(item.id);
        haptic("medium");
        await load();
      } catch {
        // ignore
      } finally {
        setBuying(null);
      }
    },
    [profile, buying, load, navigate]
  );

  if (loading) return <div className="spinner">{t("Загрузка…", "Loading…")}</div>;
  if (!profile) return null;

  const eggs = items.filter((i) => i.type === "egg");
  const accessories = items.filter((i) => i.type === "accessory");
  const backgrounds = items.filter((i) => i.type === "background");

  return (
    <div className="page pet-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("Магазин", "Shop")}</h1>
          <p className="page-header__date">🪙 {profile.coins}</p>
        </div>
        <button className="pet-back-btn" onClick={() => navigate("/pet")}>
          {t("Назад", "Back")}
        </button>
      </div>

      {/* Eggs */}
      <ShopSection title={t("Яйца", "Eggs")} items={eggs} coins={profile.coins} buying={buying} onBuy={handleBuy} />
      {/* Accessories */}
      <ShopSection title={t("Аксессуары", "Accessories")} items={accessories} coins={profile.coins} buying={buying} onBuy={handleBuy} />
      {/* Backgrounds */}
      <ShopSection title={t("Фоны", "Backgrounds")} items={backgrounds} coins={profile.coins} buying={buying} onBuy={handleBuy} />
    </div>
  );
}

function ShopSection({
  title,
  items,
  coins,
  buying,
  onBuy,
}: {
  title: string;
  items: GameItem[];
  coins: number;
  buying: number | null;
  onBuy: (item: GameItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="shop-section">
      <h3 className="shop-section__title">{title}</h3>
      <div className="shop-section__grid">
        {items.map((item) => (
          <ShopCard key={item.id} item={item} coins={coins} buying={buying} onBuy={onBuy} />
        ))}
      </div>
    </div>
  );
}

function ShopCard({
  item,
  coins,
  buying,
  onBuy,
}: {
  item: GameItem;
  coins: number;
  buying: number | null;
  onBuy: (item: GameItem) => void;
}) {
  const canAfford = coins >= item.price;
  const isOwned = item.owned && item.type !== "egg";
  const isBuying = buying === item.id;

  return (
    <button
      className={`shop-card ${isOwned ? "shop-card--owned" : ""} ${!canAfford && !isOwned ? "shop-card--cant-afford" : ""}`}
      onClick={() => onBuy(item)}
      disabled={isBuying || (isOwned && item.type !== "egg")}
    >
      <div className="shop-card__image">
        {item.image_path ? (
          <img
            src={item.image_path}
            alt={t(item.name_ru, item.name_en)}
            className="shop-card__img"
            draggable={false}
          />
        ) : (
          <>
            {item.type === "egg" && "🥚"}
            {item.type === "accessory" && "🎩"}
            {item.type === "background" && "🖼️"}
          </>
        )}
      </div>
      <div className="shop-card__name">{t(item.name_ru, item.name_en)}</div>
      <div className="shop-card__price">
        {isOwned ? t("Куплено", "Owned") : `${item.price} 🪙`}
      </div>
      {item.is_premium && <div className="shop-card__premium">⭐</div>}
    </button>
  );
}
