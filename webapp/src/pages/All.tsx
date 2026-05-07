import { useEffect, useMemo, useState } from "react";

import { api, toggleTask, type Category, type Task } from "../api";
import { TaskRow, isTaskOverdue } from "../components/TaskRow";
import { useI18n, getStoredHorizon } from "../i18n";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  FolderIcon,
  InboxIcon,
  SparkIcon,
  SunriseIcon,
} from "../icons";
import { fromISODate, todayISO, tomorrowISO } from "../utils/date";

type SectionKey =
  | "overdue"
  | "today"
  | "tomorrow"
  | "week"
  | "later"
  | "undated"
  | "done";

interface SectionDef {
  key: SectionKey;
  titleKey: string;
  icon: typeof SparkIcon;
}

const SECTION_ORDER: SectionDef[] = [
  { key: "overdue", titleKey: "section.overdue", icon: AlertTriangleIcon },
  { key: "today", titleKey: "section.today", icon: SparkIcon },
  { key: "tomorrow", titleKey: "section.tomorrow", icon: SunriseIcon },
  { key: "week", titleKey: "section.week", icon: CalendarIcon },
  { key: "later", titleKey: "section.later", icon: ClockIcon },
  { key: "undated", titleKey: "section.undated", icon: InboxIcon },
  { key: "done", titleKey: "section.done", icon: CheckIcon },
];

export function AllPage() {
  const { t } = useI18n();
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

  const horizon = getStoredHorizon();

  const sectioned = useMemo(() => {
    if (!tasks) return null;
    const now = new Date();
    const today = todayISO();
    const tomorrow = tomorrowISO();
    const in7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const horizonDate = horizon > 0
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + horizon)
      : null;

    const buckets: Record<SectionKey, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      week: [],
      later: [],
      undated: [],
      done: [],
    };

    const topLevel = tasks.filter((t) => t.parent_task_id === null);
    const filtered =
      filterCat === null ? topLevel : topLevel.filter((t) => t.category_id === filterCat);

    for (const t of filtered) {
      if (t.is_done) {
        const doneAt = t.done_at ? new Date(t.done_at) : new Date(t.created_at);
        if (doneAt >= startOfDay) buckets.done.push(t);
        continue;
      }
      if (isTaskOverdue(t, now)) {
        buckets.overdue.push(t);
        continue;
      }
      if (t.has_time && t.due_at) {
        const d = new Date(t.due_at);
        if (horizonDate && d > horizonDate) continue;
        const iso = toISODate(d);
        if (iso === today) buckets.today.push(t);
        else if (iso === tomorrow) buckets.tomorrow.push(t);
        else if (d <= in7) buckets.week.push(t);
        else buckets.later.push(t);
        continue;
      }
      if (t.due_date) {
        if (horizonDate && fromISODate(t.due_date) > horizonDate) continue;
        if (t.due_date === today) buckets.today.push(t);
        else if (t.due_date === tomorrow) buckets.tomorrow.push(t);
        else if (fromISODate(t.due_date) <= in7) buckets.week.push(t);
        else buckets.later.push(t);
        continue;
      }
      buckets.undated.push(t);
    }
    return buckets;
  }, [tasks, filterCat, horizon]);

  async function toggle(task: Task) {
    const updated = await toggleTask(task);
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
    let due_at: string | null = null;
    if (task.has_time && task.due_at) {
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
      has_time: task.has_time,
      due_at,
      remind_minutes_before: task.remind_minutes_before,
      priority: task.priority,
      is_done: task.is_done,
    });
    setTasks((prev) => (prev ?? []).map((t) => (t.id === task.id ? updated : t)));
  }

  async function remove(task: Task) {
    if (!window.confirm(t("confirm.delete_task").replace("{title}", task.title))) return;
    await api.deleteTask(task.id);
    setTasks((prev) => (prev ?? []).filter((t) => t.id !== task.id && t.parent_task_id !== task.id));
  }

  async function archive(task: Task) {
    await api.archiveTask(task.id);
    setTasks((prev) => (prev ?? []).filter((t) => t.id !== task.id));
  }

  if (!tasks || !sectioned) return <div className="spinner">{t("loading")}</div>;

  const catById = new Map(cats.map((c) => [c.id, c] as const));
  const focusCount =
    sectioned.today.length +
    sectioned.tomorrow.length +
    sectioned.week.length +
    sectioned.later.length +
    sectioned.undated.length;
  const overdueCount = sectioned.overdue.length;
  const doneCount = sectioned.done.length;
  const hasAny =
    focusCount + overdueCount + doneCount === 0 && (filterCat === null);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <div className="page-header__title-row">
            <h1>{t("all.title")}</h1>
          </div>
          <div className="page-header__subtitle">
            {t("all.subtitle")}
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__label">
            <SparkIcon /> {t("all.focus")}
          </div>
          <div className="stat-card__value">{focusCount}</div>
        </div>
        <div className={`stat-card ${overdueCount > 0 ? "stat-card--danger" : ""}`}>
          <div className="stat-card__label">
            <AlertTriangleIcon /> {t("all.overdue")}
          </div>
          <div className={`stat-card__value ${overdueCount === 0 ? "stat-card__value--muted" : ""}`}>
            {overdueCount}
          </div>
        </div>
        <div className="stat-card stat-card--success">
          <div className="stat-card__label">
            <CheckIcon /> {t("all.closed")}
          </div>
          <div className={`stat-card__value ${doneCount === 0 ? "stat-card__value--muted" : ""}`}>
            {doneCount}
          </div>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 12 }}>
        <button
          className={`chip ${filterCat === null ? "chip--active" : ""}`}
          onClick={() => setFilterCat(null)}
        >
          {t("all.filter_all")}
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

      {hasAny && (
        <div className="empty">
          <div className="empty__icon">
            <FolderIcon />
          </div>
          <div className="empty__title">{t("all.empty_title")}</div>
          <div>{t("all.empty_text")}</div>
        </div>
      )}

      {SECTION_ORDER.map((section) => {
        const items = sectioned[section.key];
        if (!items.length) return null;
        const isDone = section.key === "done";
        return (
          <Section key={section.key} title={t(section.titleKey)} count={items.length} icon={section.icon}>
            {items.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                category={task.category_id ? catById.get(task.category_id) : null}
                onToggle={toggle}
                subtasks={childrenByParent.get(task.id)}
                onToggleSub={toggle}
                onPostpone={!isDone ? postpone : undefined}
                onArchive={archive}
                onDelete={remove}
              />
            ))}
          </Section>
        );
      })}
    </div>
  );
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
