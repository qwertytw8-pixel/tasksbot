import { useEffect, useState } from "react";

import { api, type Category } from "../api";
import { FolderIcon, PlusIcon } from "../icons";

const PALETTE = [
  "#6D5DFC",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
];

export function CategoriesPage() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷");
  const [color, setColor] = useState(PALETTE[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setCats(await api.listCategories());
  }

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createCategory({ name: name.trim(), emoji, color });
      setName("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить категорию?")) return;
    await api.deleteCategory(id);
    await load();
  }

  if (!cats) return <div className="spinner">Загрузка…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <div className="page-header__title-row">
            <h1>Категории</h1>
          </div>
          <div className="page-header__subtitle">
            Собери свой рабочий ритм: личное, созвоны, спорт, дедлайны — как удобно тебе.
          </div>
        </div>
      </div>

      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="form">
          <div className="field">
            <span className="field__label">Название</span>
            <input
              className="input"
              placeholder="Напр. Спорт"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <span className="field__label">Эмодзи</span>
            <input
              className="input"
              maxLength={4}
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            />
          </div>
          <div className="field">
            <span className="field__label">Цвет</span>
            <div className="chips">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  className={`chip ${color === c ? "chip--soft-active" : ""}`}
                  style={color === c ? { borderColor: c, color: c } : undefined}
                  onClick={() => setColor(c)}
                  type="button"
                >
                  <span className="swatch" style={{ ["--c" as never]: c }} />
                </button>
              ))}
            </div>
          </div>
          <button className="btn" disabled={busy || !name.trim()} onClick={() => void add()}>
            <PlusIcon style={{ width: 16, height: 16, marginRight: 8, verticalAlign: "-3px" }} />
            Добавить категорию
          </button>
        </div>
      </div>

      {cats.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <FolderIcon />
          </div>
          <div className="empty__title">Категорий пока нет</div>
          <div>Создай первую, чтобы задачи выглядели аккуратнее и были легче для навигации.</div>
        </div>
      )}

      <div className="form">
        {cats.map((c) => (
          <div className="category-card" key={c.id}>
            <div className="category-card__header">
              <div className="category-card__title">
                <span className="swatch" style={{ ["--c" as never]: c.color ?? "#888" }} />
                <div>
                  <div className="category-card__name" style={c.color ? { color: c.color } : undefined}>
                    {c.emoji ? `${c.emoji} ` : ""}
                    {c.name}
                  </div>
                </div>
              </div>
              <button className="chip" onClick={() => void remove(c.id)}>
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
