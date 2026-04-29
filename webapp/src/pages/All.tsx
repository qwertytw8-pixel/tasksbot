import { useEffect, useMemo, useState } from "react";

import { api, type Category, type Task } from "../api";
import { TaskRow } from "../components/TaskRow";

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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Все задачи</h1>
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
            className={`chip ${filterCat === c.id ? "chip--active" : ""}`}
            onClick={() => setFilterCat(c.id)}
          >
            {c.emoji ? `${c.emoji} ` : ""}
            {c.name}
          </button>
        ))}
      </div>

      {grouped && grouped.length === 0 && (
        <div className="empty">
          <div className="empty__title">Пусто</div>
          <div>Нет задач в этой категории.</div>
        </div>
      )}

      {grouped?.map(([date, items]) => (
        <div key={date} style={{ marginTop: 16 }}>
          <h3
            style={{
              color: "var(--tb-hint)",
              margin: "0 4px 8px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {date.toUpperCase()}
          </h3>
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
