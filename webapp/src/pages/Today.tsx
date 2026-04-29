import { useEffect, useMemo, useState } from "react";

import { api, type Category, type Task } from "../api";
import { TaskRow } from "../components/TaskRow";
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  InboxIcon,
  SparkIcon,
} from "../icons";
import { todayISO } from "../utils/date";

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

  const today = todayISO();

  const todayTasks = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter(
      (t) =>
        t.parent_task_id === null &&
        !t.is_done &&
        ((t.due_date && t.due_date === today) ||
          (t.has_time && t.due_at && new Date(t.due_at).toDateString() === new Date().toDateString()))
    );
  }, [tasks, today]);

  const overdue = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter((t) => {
      if (t.parent_task_id !== null || t.is_done) return false;
      if (t.has_time && t.due_at) {
        return new Date(t.due_at) < new Date() && new Date(t.due_at).toDateString() !== new Date().toDateString();
      }
      if (t.due_date && t.due_date < today) return true;
      return false;
    });
  }, [tasks, today]);

  const inbox = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter(
      (t) => t.parent_task_id === null && !t.is_done && !t.due_date && !t.has_time
    );
  }, [tasks]);

  const done = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter((t) => {
      if (t.parent_task_id !== null || !t.is_done) return false;
      if (t.due_date) return t.due_date === today;
      const d = new Date(t.created_at);
      return d.toDateString() === new Date().toDateString();
    });
  }, [tasks, today]);

  const childrenByParent = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const t of tasks ?? []) {
      if (t.parent_task_id != null) {
        if (!map.has(t.parent_task_id)) map.set(t.parent_task_id, []);
        map.get(t.parent_task_id)!.push(t);
      }
    }
    return map;
  }, [tasks]);

  async function toggle(task: Task) {
    const updated = await api.updateTask(task.id, {
      title: task.title,
      description: task.description,
      category_id: task.category_id,
      parent_task_id: task.parent_task_id,
      due_date: task.due_date,
      has_time: task.has_time,
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
  const totalOpen = (todayTasks?.length ?? 0) + (overdue?.length ?? 0) + (inbox?.length ?? 0);
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
          Всё важное на одном экране: задачи, время, напоминания и проекты — без визуального шума.
        </div>
        <div className="hero-card__meta">
          <span className="hero-chip">
            <CalendarIcon /> календарь <span className="hero-chip__value">по дням</span>
          </span>
          <span className="hero-chip">
            <BellIcon /> напоминания <span className="hero-chip__value">вовремя</span>
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
              subtasks={childrenByParent.get(t.id)}
              onToggleSub={toggle}
            />
          ))}
        </Section>
      )}

      {todayTasks && todayTasks.length > 0 && (
        <Section title="На сегодня" count={todayTasks.length} icon={ClockIcon}>
          {todayTasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
              onToggle={toggle}
              subtasks={childrenByParent.get(t.id)}
              onToggleSub={toggle}
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
              subtasks={childrenByParent.get(t.id)}
              onToggleSub={toggle}
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
              subtasks={childrenByParent.get(t.id)}
              onToggleSub={toggle}
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
