import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, type Category, type Task } from "../api";
import { ArrowRightIcon, BellIcon, ClockIcon, PlusIcon, TagIcon } from "../icons";
import { haptic } from "../telegram";

const REMIND_PRESETS: { label: string; value: number | null }[] = [
  { label: "Без", value: null },
  { label: "Вовремя", value: 0 },
  { label: "−5 мин", value: 5 },
  { label: "−15 мин", value: 15 },
  { label: "−30 мин", value: 30 },
  { label: "−1 ч", value: 60 },
  { label: "−1 день", value: 60 * 24 },
];

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToISO(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}

export function TaskFormPage() {
  const { id } = useParams<{ id?: string }>();
  const editing = id !== undefined;
  const navigate = useNavigate();

  const [cats, setCats] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [dueLocal, setDueLocal] = useState("");
  const [remind, setRemind] = useState<number | null>(15);
  const [busy, setBusy] = useState(false);
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    void (async () => {
      const c = await api.listCategories();
      setCats(c);
      if (editing && id) {
        const all = await api.listTasks();
        const t = all.find((x) => x.id === Number(id));
        if (t) {
          setTask(t);
          setTitle(t.title);
          setDescription(t.description ?? "");
          setCategoryId(t.category_id);
          setDueLocal(toLocalInputValue(t.due_at));
          setRemind(t.remind_minutes_before);
        }
      }
    })();
  }, [editing, id]);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        due_at: localInputToISO(dueLocal),
        remind_minutes_before: remind,
        is_done: task?.is_done ?? false,
      };
      if (editing && task) {
        await api.updateTask(task.id, payload);
      } else {
        await api.createTask(payload);
      }
      haptic("medium");
      navigate(-1);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!task) return;
    if (!confirm("Удалить задачу?")) return;
    await api.deleteTask(task.id);
    navigate(-1);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <span className="page-header__eyebrow">
            {editing ? <ArrowRightIcon /> : <PlusIcon />} {editing ? "edit" : "create"}
          </span>
          <div className="page-header__title-row">
            <h1>{editing ? "Задача" : "Новая задача"}</h1>
          </div>
          <div className="page-header__subtitle">
            Короткая форма без лишнего: название, категория, время и напоминание.
          </div>
        </div>
        <button className="inline-action" onClick={() => navigate(-1)}>
          Закрыть
        </button>
      </div>

      <div className="surface">
        <div className="form">
          <div className="field">
            <span className="field__label">Что нужно сделать</span>
            <input
              className="input"
              placeholder="Например: Созвон с командой"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!editing}
            />
          </div>

          <div className="field">
            <span className="field__label">Описание</span>
            <textarea
              className="textarea"
              placeholder="Короткий контекст, если нужен"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <span className="field__label">Категория</span>
            <div className="chips">
              <button
                type="button"
                className={`chip ${categoryId === null ? "chip--active" : ""}`}
                onClick={() => setCategoryId(null)}
              >
                <TagIcon style={{ width: 14, height: 14 }} />
                Без
              </button>
              {cats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${categoryId === c.id ? "chip--soft-active" : ""}`}
                  onClick={() => setCategoryId(c.id)}
                  style={categoryId === c.id && c.color ? { color: c.color, borderColor: c.color } : undefined}
                >
                  {c.emoji ? `${c.emoji} ` : ""}
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Когда</span>
            <div style={{ position: "relative" }}>
              <ClockIcon
                style={{
                  position: "absolute",
                  left: 14,
                  top: 14,
                  width: 18,
                  height: 18,
                  color: "var(--tb-accent-strong)",
                }}
              />
              <input
                className="input"
                type="datetime-local"
                value={dueLocal}
                onChange={(e) => setDueLocal(e.target.value)}
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          <div className="field">
            <span className="field__label">Напомнить</span>
            <div className="chips">
              {REMIND_PRESETS.map((p) => (
                <button
                  key={String(p.value)}
                  type="button"
                  className={`chip ${remind === p.value ? "chip--active" : ""}`}
                  onClick={() => setRemind(p.value)}
                >
                  <BellIcon style={{ width: 14, height: 14 }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn" disabled={busy || !title.trim()} onClick={() => void save()}>
            {editing ? "Сохранить" : "Добавить задачу"}
          </button>

          {editing && (
            <button className="btn btn--danger" onClick={() => void remove()}>
              Удалить задачу
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
