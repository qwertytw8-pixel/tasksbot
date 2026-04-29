import { useEffect, useMemo, useState } from "react";

import { api, type Category, type Task } from "../api";
import { TaskRow } from "../components/TaskRow";

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function TodayPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const [t, c] = await Promise.all([api.listTasks(), api.listCategories()]);
      setTasks(t);
      setCats(c);
    } catch (e) {
      setError(String(e));
    }
  }

  const today = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter((t) => {
      if (t.is_done) return false;
      if (!t.due_at) return false;
      return isToday(new Date(t.due_at));
    });
  }, [tasks]);

  const overdue = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter((t) => {
      if (t.is_done) return false;
      if (!t.due_at) return false;
      const d = new Date(t.due_at);
      return d < new Date() && !isToday(d);
    });
  }, [tasks]);

  const inbox = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter((t) => !t.is_done && !t.due_at);
  }, [tasks]);

  const done = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter((t) => {
      if (!t.is_done) return false;
      // show today's done
      const d = t.due_at ? new Date(t.due_at) : new Date(t.created_at);
      return isToday(d);
    });
  }, [tasks]);

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

  const todayLabel = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

  if (error) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__title">Ошибка</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }
  if (!tasks) {
    return <div className="spinner">Загрузка…</div>;
  }

  const catById = new Map(cats.map((c) => [c.id, c] as const));
  const isEmpty =
    (today?.length ?? 0) +
      (overdue?.length ?? 0) +
      (inbox?.length ?? 0) +
      (done?.length ?? 0) ===
    0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Сегодня</h1>
        <span className="page-header__date">{todayLabel}</span>
      </div>

      {isEmpty && (
        <div className="empty">
          <div className="empty__title">Чисто 🍃</div>
          <div>Нет задач. Жми «+», чтобы добавить.</div>
        </div>
      )}

      {overdue && overdue.length > 0 && (
        <Section title="Просрочено">
          {overdue.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
              onToggle={toggle}
            />
          ))}
        </Section>
      )}

      {today && today.length > 0 && (
        <Section title="На сегодня">
          {today.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
              onToggle={toggle}
            />
          ))}
        </Section>
      )}

      {inbox && inbox.length > 0 && (
        <Section title="Без даты">
          {inbox.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
              onToggle={toggle}
            />
          ))}
        </Section>
      )}

      {done && done.length > 0 && (
        <Section title="Готово сегодня">
          {done.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
              onToggle={toggle}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ color: "var(--tb-hint)", margin: "0 4px 8px", fontSize: 13, fontWeight: 600 }}>
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
}
