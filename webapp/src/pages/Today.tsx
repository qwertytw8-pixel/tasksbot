import { useEffect, useMemo, useState } from "react";

import { api, type Category, type Task } from "../api";
import { TaskRow } from "../components/TaskRow";
import { BellIcon, CheckIcon, ClockIcon, InboxIcon, SparkIcon } from "../icons";

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
      if (t.is_done || !t.due_at) return false;
      return isToday(new Date(t.due_at));
    });
  }, [tasks]);

  const overdue = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter((t) => {
      if (t.is_done || !t.due_at) return false;
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
          <div className="empty__icon">
            <BellIcon />
          </div>
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
  const totalOpen = (today?.length ?? 0) + (overdue?.length ?? 0) + (inbox?.length ?? 0);
  const isEmpty = totalOpen + (done?.length ?? 0) === 0;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <span className="page-header__eyebrow">
            <SparkIcon /> task flow
          </span>
          <div className="page-header__title-row">
            <h1>Сегодня</h1>
            <span className="page-header__date">{todayLabel}</span>
          </div>
          <div className="page-header__subtitle">
            Спокойный обзор дня: главное, просроченное и всё, что ждёт внимания.
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">
            <ClockIcon /> В фокусе
          </div>
          <div className="stat-card__value">{totalOpen}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">
            <CheckIcon /> Закрыто
          </div>
          <div className="stat-card__value">{done?.length ?? 0}</div>
        </div>
      </div>

      <div className="hero-card">
        <h2>Минимализм, который не мешает работать</h2>
        <div className="page-header__subtitle" style={{ marginTop: 8 }}>
          Всё важное на одном экране: задачи, время и напоминания — без визуального шума.
        </div>
        <div className="hero-card__meta">
          <span className="hero-chip">
            <BellIcon /> напоминания <span className="hero-chip__value">вовремя</span>
          </span>
          <span className="hero-chip">
            <InboxIcon /> категории <span className="hero-chip__value">под рукой</span>
          </span>
        </div>
      </div>

      {isEmpty && (
        <div className="empty">
          <div className="empty__icon">
            <SparkIcon />
          </div>
          <div className="empty__title">Чисто и спокойно</div>
          <div>Пока задач нет. Нажми на круглую кнопку внизу и добавь первую.</div>
        </div>
      )}

      {overdue && overdue.length > 0 && (
        <Section title="Просрочено" count={overdue.length} icon={BellIcon}>
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
        <Section title="На сегодня" count={today.length} icon={ClockIcon}>
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
        <Section title="Без даты" count={inbox.length} icon={InboxIcon}>
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
        <Section title="Готово сегодня" count={done.length} icon={CheckIcon}>
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

function Section({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  icon: typeof SparkIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="section-block">
      <div className="section-block__header">
        <div className="section-block__title">
          <Icon />
          {title}
        </div>
        <div className="section-block__count">{count}</div>
      </div>
      {children}
    </div>
  );
}
