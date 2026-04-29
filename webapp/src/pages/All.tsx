import { useEffect, useMemo, useState } from "react";

import { api, type Category, type Task } from "../api";
import { TaskRow } from "../components/TaskRow";
import { FolderIcon, ListIcon, SparkIcon } from "../icons";

export function AllPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const [t, c] = await Promise.all([api.listTasks(), api.listCategories()]);
      setTasks(t);
      setCats(c);
    })();
  }, []);

  const grouped = useMemo(() => {
    if (!tasks) return null;
    const filtered = filterCat === null ? tasks : tasks.filter((t) => t.category_id === filterCat);
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      const key = t.due_at ? new Date(t.due_at).toLocaleDateString("ru-RU") : "Без даты";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries());
  }, [tasks, filterCat]);

  async function toggle(task: Task) {
    const updated = await api.updateTask(task.id, {
      title: task.title,
      description: task.description,
      category_id: task.category_id,
      due_at: task.due_at,
      remind_minutes_before: task.remind_minutes_before,
      is_done: !task.is_done,
    });
    setTasks((prev) => (prev ?? []).map((t) => (t.id === task.id ? updated : t)));
  }

  if (!tasks) return <div className="spinner">Загрузка…</div>;

  const catById = new Map(cats.map((c) => [c.id, c] as const));
  const completed = tasks.filter((t) => t.is_done).length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <span className="page-header__eyebrow">
            <ListIcon /> library
          </span>
          <div className="page-header__title-row">
            <h1>Все задачи</h1>
          </div>
          <div className="page-header__subtitle">
            Полная лента задач с фильтром по категориям и понятной группировкой по датам.
          </div>
        </div>
      </div>

      <div className="hero-card">
        <h2>Один список — вся картина</h2>
        <div className="hero-card__meta">
          <span className="hero-chip">
            <FolderIcon /> всего <span className="hero-chip__value">{tasks.length}</span>
          </span>
          <span className="hero-chip">
            <SparkIcon /> готово <span className="hero-chip__value">{completed}</span>
          </span>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 12 }}>
        <button
          className={`chip ${filterCat === null ? "chip--active" : ""}`}
          onClick={() => setFilterCat(null)}
        >
          Все
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            className={`chip ${filterCat === c.id ? "chip--soft-active" : ""}`}
            onClick={() => setFilterCat(c.id)}
            style={filterCat === c.id && c.color ? { color: c.color } : undefined}
          >
            {c.emoji ? `${c.emoji} ` : ""}
            {c.name}
          </button>
        ))}
      </div>

      {grouped && grouped.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <FolderIcon />
          </div>
          <div className="empty__title">Пусто</div>
          <div>В этой категории пока нет задач.</div>
        </div>
      )}

      {grouped?.map(([date, items]) => (
        <div key={date} className="section-block">
          <div className="section-block__header">
            <div className="section-block__title">
              <FolderIcon />
              {date}
            </div>
            <div className="section-block__count">{items.length}</div>
          </div>
          {items.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
              onToggle={toggle}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
