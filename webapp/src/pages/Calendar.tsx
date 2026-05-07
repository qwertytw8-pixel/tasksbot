import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api, toggleTask, type Category, type Task } from "../api";
import { HourlyTimeline } from "../components/HourlyTimeline";
import { TaskRow } from "../components/TaskRow";
import { useI18n } from "../i18n";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  InboxIcon,
  ListIcon,
  PlusIcon,
  SparkIcon,
} from "../icons";
import { haptic } from "../telegram";
import {
  addMonths,
  buildMonthGrid,
  fromISODate,
  isSameDay,
  startOfMonth,
  toISODate,
  todayISO,
  tomorrowISO,
} from "../utils/date";

export function CalendarPage() {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialDay = searchParams.get("day") ?? todayISO();
  const [selectedISO, setSelectedISO] = useState<string>(initialDay);
  const [monthAnchor, setMonthAnchor] = useState<Date>(() =>
    startOfMonth(fromISODate(initialDay))
  );

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  useEffect(() => {
    void (async () => {
      const [t, c] = await Promise.all([api.listTasks(), api.listCategories()]);
      setTasks(t);
      setCats(c);
    })();
  }, []);

  useEffect(() => {
    setSearchParams({ day: selectedISO }, { replace: true });
  }, [selectedISO, setSearchParams]);

  const cells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    if (!tasks) return map;
    for (const task of tasks) {
      if (!task.due_date) continue;
      if (!map.has(task.due_date)) map.set(task.due_date, []);
      map.get(task.due_date)!.push(task);
    }
    return map;
  }, [tasks]);

  const selectedDate = fromISODate(selectedISO);
  const selectedTasks = (tasksByDay.get(selectedISO) ?? []).filter(
    (task) => task.parent_task_id === null
  );
  const selectedSubtasks = (tasksByDay.get(selectedISO) ?? []).filter(
    (task) => task.parent_task_id !== null
  );

  const undated = useMemo(
    () =>
      (tasks ?? []).filter(
        (task) => !task.due_date && !task.is_done && task.parent_task_id === null
      ),
    [tasks]
  );

  const monthLabel = `${t(`month.${monthAnchor.getMonth()}`)} ${monthAnchor.getFullYear()}`;
  const weekdays = Array.from({ length: 7 }, (_, i) => t(`wd.${i}`));

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

  function selectDay(d: Date) {
    haptic("light");
    const iso = toISODate(d);
    setSelectedISO(iso);
    if (
      d.getMonth() !== monthAnchor.getMonth() ||
      d.getFullYear() !== monthAnchor.getFullYear()
    ) {
      setMonthAnchor(startOfMonth(d));
    }
  }

  function addForSelected() {
    navigate(`/new?day=${selectedISO}`);
  }

  if (!tasks) return <div className="spinner">{t("loading")}</div>;

  const catById = new Map(cats.map((c) => [c.id, c] as const));
  const today = new Date();
  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <div className="page-header__title-row">
            <h1>{t("calendar.title")}</h1>
          </div>
          <div className="page-header__subtitle">
            {t("calendar.subtitle")}
          </div>
        </div>
      </div>

      <div className="cal">
        <div className="cal__head">
          <button
            className="cal__nav"
            onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))}
            aria-label={t("calendar.prev_month")}
          >
            <ChevronLeftIcon />
          </button>
          <div className="cal__title">{monthLabel}</div>
          <button
            className="cal__nav"
            onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}
            aria-label={t("calendar.next_month")}
          >
            <ChevronRightIcon />
          </button>
        </div>

        <div className="cal__grid cal__grid--head">
          {weekdays.map((w, i) => (
            <div key={i} className="cal__weekday">
              {w}
            </div>
          ))}
        </div>

        <div className="cal__grid">
          {cells.map((d) => {
            const iso = toISODate(d);
            const inMonth = d.getMonth() === monthAnchor.getMonth();
            const isToday = isSameDay(d, today);
            const isSelected = iso === selectedISO;
            const dayTasks = tasksByDay.get(iso) ?? [];
            const open = dayTasks.filter((t) => !t.is_done).length;
            const total = dayTasks.length;
            return (
              <button
                key={iso}
                className={[
                  "cal__cell",
                  inMonth ? "" : "cal__cell--muted",
                  isToday ? "cal__cell--today" : "",
                  isSelected ? "cal__cell--selected" : "",
                  total > 0 ? "cal__cell--has" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => selectDay(d)}
              >
                <span className="cal__num">{d.getDate()}</span>
                {total > 0 ? (
                  <span className="cal__count">
                    {open > 0 ? open : "\u2713"}
                  </span>
                ) : (
                  <span className="cal__count cal__count--empty" aria-hidden>
                    ·
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="day-strip">
        <div className="day-strip__date">
          <SparkIcon />
          {selectedDate.toLocaleDateString(locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <div className="day-strip__actions">
          <button
            className={`day-strip__view-btn ${viewMode === "list" ? "day-strip__view-btn--active" : ""}`}
            onClick={() => { haptic("light"); setViewMode("list"); }}
            aria-label={t("calendar.list")}
          >
            <ListIcon />
          </button>
          <button
            className={`day-strip__view-btn ${viewMode === "timeline" ? "day-strip__view-btn--active" : ""}`}
            onClick={() => { haptic("light"); setViewMode("timeline"); }}
            aria-label={t("calendar.hourly")}
          >
            <ClockIcon />
          </button>
          <button className="day-strip__add" onClick={addForSelected}>
            <PlusIcon /> {t("calendar.new")}
          </button>
        </div>
      </div>

      {viewMode === "timeline" && (
        <HourlyTimeline
          tasks={[...selectedTasks, ...selectedSubtasks]}
          categories={catById}
        />
      )}

      {viewMode === "list" && selectedTasks.length === 0 && selectedSubtasks.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <CalendarIcon />
          </div>
          <div className="empty__title">{t("calendar.empty_title")}</div>
          <div>{t("calendar.empty_text")}</div>
        </div>
      )}

      {viewMode === "list" && selectedTasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          category={task.category_id ? catById.get(task.category_id) : null}
          onToggle={toggle}
          subtasks={(tasks ?? []).filter((c) => c.parent_task_id === task.id)}
          onToggleSub={toggle}
          onPostpone={!task.is_done ? postpone : undefined}
          onArchive={archive}
          onDelete={remove}
        />
      ))}

      {viewMode === "list" && selectedSubtasks.length > 0 && (
        <div className="section-block">
          <div className="section-block__header">
            <div className="section-block__title">
              <InboxIcon /> {t("calendar.subtasks_label")}
            </div>
            <div className="section-block__count">{selectedSubtasks.length}</div>
          </div>
          {selectedSubtasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              category={task.category_id ? catById.get(task.category_id) : null}
              onToggle={toggle}
              compact
            />
          ))}
        </div>
      )}

      {undated.length > 0 && (
        <div className="section-block">
          <div className="section-block__header">
            <div className="section-block__title">
              <InboxIcon /> {t("section.undated")}
            </div>
            <div className="section-block__count">{undated.length}</div>
          </div>
          {undated.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              category={task.category_id ? catById.get(task.category_id) : null}
              onToggle={toggle}
              subtasks={(tasks ?? []).filter((c) => c.parent_task_id === task.id)}
              onToggleSub={toggle}
              onPostpone={postpone}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
