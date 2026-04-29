import { useEffect, useState } from "react";

import { api, type Category } from "../api";

const PALETTE = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#14B8A6",
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
        <h1>Категории</h1>
      </div>

      <div className="section" style={{ padding: 14 }}>
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
                  className={`chip ${color === c ? "chip--active" : ""}`}
                  style={{ background: color === c ? c : undefined, borderColor: c }}
                  onClick={() => setColor(c)}
                  type="button"
                >
                  <span className="swatch" style={{ ["--c" as never]: c }} />
                </button>
              ))}
            </div>
          </div>
          <button className="btn" disabled={busy || !name.trim()} onClick={() => void add()}>
            Добавить
          </button>
        </div>
      </div>

      <div className="section" style={{ marginTop: 16 }}>
        {cats.length === 0 && <div className="empty">Категорий нет</div>}
        {cats.map((c) => (
          <div className="row" key={c.id}>
            <span className="swatch" style={{ ["--c" as never]: c.color ?? "#888" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {c.emoji ? `${c.emoji} ` : ""}
                {c.name}
              </div>
            </div>
            <button className="chip" onClick={() => void remove(c.id)}>
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
