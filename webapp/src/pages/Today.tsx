import { useEffect, useMemo, useState } from "react";

import { api, type Category, type Task } from "../api";
import { FocusWidget } from "../components/FocusWidget";
import { TaskRow, isTaskOverdue } from "../components/TaskRow";
import {
  AlertTriangleIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  InboxIcon,
  SparkIcon,
} from "../icons";
import { todayISO, tomorrowISO } from "../utils/date";

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
    const now = new Date();
    return tasks.filter((t) => {
      if (t.parent_task_id !== null || t.is_done) return false;
      if (isTaskOverdue(t, now)) return false;
      if (t.due_date && t.due_date === today) return true;
      if (t.has_time && t.due_at && new Date(t.due_at).toDateString() === now.toDateString())
        return true;
      return false;
    });
  }, [tasks, today]);

  const overdue = useMemo(() => {
    if (!tasks) return null;
    const now = new Date();
    return tasks.filter(
      (t) => t.parent_task_id === null && isTaskOverdue(t, now),
    );
  }, [tasks]);

  const inbox = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter(
      (t) => t.parent_task_id === null && !t.is_done && !t.due_date && !t.has_time
    );
  }, [tasks]);

  const done = useMemo(() => {
    if (!tasks) return null;
    const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return tasks.filter((t) => {
      if (t.parent_task_id !== null || !t.is_done) return false;
      const d = t.done_at ? new Date(t.done_at) : new Date(t.created_at);
      return d >= last24;
    });
  }, [tasks]);

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
      recurrence: task.recurrence,
      is_done: !task.is_done,
    });
    setTasks((prev) => {
      const list = prev ?? [];
      if (updated.archived_at) {
        return list.filter((t) => t.id !== task.id);
      }
      return list.map((t) => (t.id === task.id ? updated : t));
    });
  }

  async function postpone(task: Task) {
    const nextDate = tomorrowISO();
    // If the task had a time (has_time), keep the time-of-day and move to tomorrow.
    let due_at: string | null = null;
    let has_time = task.has_time;
    if (has_time && task.due_at) {
      const prev = new Date(task.due_at);
      const [y, m, d] = nextDate.split("-").map(Number);
      const next = new Date(y, m - 1, d, prev.getHours(), prev.getMinutes(), 0, 0);
      due_at = next.toISOString();
    }
    const updated = await api.updateTask(task.id, {
      title: task.title,
      description: task.description,
      category_id: task.category_id,
      parent_task_id: task.parent_task_id,
      due_date: nextDate,
      has_time,
      due_at,
      remind_minutes_before: task.remind_minutes_before,
      is_done: task.is_done,
    });
    setTasks((prev) => (prev ?? []).map((t) => (t.id === task.id ? updated : t)));
  }

  async function remove(task: Task) {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;
    await api.deleteTask(task.id);
    setTasks((prev) => (prev ?? []).filter((t) => t.id !== task.id && t.parent_task_id !== task.id));
  }

  async function archive(task: Task) {
    await api.archiveTask(task.id);
    setTasks((prev) => (prev ?? []).filter((t) => t.id !== task.id));
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

      {!isEmpty && (
        <FocusWidget tasks={[...(overdue ?? []), ...(todayTasks ?? [])]} />
      )}

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
        <Section title="Просрочено" count={overdue.length} icon={AlertTriangleIcon}>
          {overdue.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
              onToggle={toggle}
              subtasks={childrenByParent.get(t.id)}
              onToggleSub={toggle}
              onPostpone={postpone}
              onArchive={archive}
              onDelete={remove}
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
              onPostpone={postpone}
              onDelete={remove}
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
              onPostpone={postpone}
              onDelete={remove}
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
              onArchive={archive}
              onDelete={remove}
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
