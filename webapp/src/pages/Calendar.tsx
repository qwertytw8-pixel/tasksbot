import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api, type Category, type Task } from "../api";
import { TaskRow } from "../components/TaskRow";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  PlusIcon,
  SparkIcon,
} from "../icons";
import { haptic } from "../telegram";
import {
  RU_MONTHS,
  RU_WEEKDAYS_SHORT,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialDay = searchParams.get("day") ?? todayISO();
  const [selectedISO, setSelectedISO] = useState<string>(initialDay);
  const [monthAnchor, setMonthAnchor] = useState<Date>(() =>
    startOfMonth(fromISODate(initialDay))
  );

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);

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
    for (const t of tasks) {
      if (!t.due_date) continue;
      if (!map.has(t.due_date)) map.set(t.due_date, []);
      map.get(t.due_date)!.push(t);
    }
    return map;
  }, [tasks]);

  const selectedDate = fromISODate(selectedISO);
  const selectedTasks = (tasksByDay.get(selectedISO) ?? []).filter(
    (t) => t.parent_task_id === null
  );
  const selectedSubtasks = (tasksByDay.get(selectedISO) ?? []).filter(
    (t) => t.parent_task_id !== null
  );

  const undated = useMemo(
    () =>
      (tasks ?? []).filter(
        (t) => !t.due_date && !t.is_done && t.parent_task_id === null
      ),
    [tasks]
  );

  const monthLabel = `${RU_MONTHS[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`;

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
      priority: task.priority,
      is_done: !task.is_done,
    });
    setTasks((prev) => (prev ?? []).map((t) => (t.id === task.id ? updated : t)));
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
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;
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

  if (!tasks) return <div className="spinner">Загрузка…</div>;

  const catById = new Map(cats.map((c) => [c.id, c] as const));
  const today = new Date();

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <span className="page-header__eyebrow">
            <CalendarIcon /> calendar
          </span>
          <div className="page-header__title-row">
            <h1>Календарь</h1>
          </div>
          <div className="page-header__subtitle">
            Тапни по числу — увидишь задачи на этот день и сможешь добавить новую.
          </div>
        </div>
      </div>

      <div className="cal">
        <div className="cal__head">
          <button
            className="cal__nav"
            onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))}
            aria-label="Предыдущий месяц"
          >
            <ChevronLeftIcon />
          </button>
          <div className="cal__title">{monthLabel}</div>
          <button
            className="cal__nav"
            onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}
            aria-label="Следующий месяц"
          >
            <ChevronRightIcon />
          </button>
        </div>

        <div className="cal__grid cal__grid--head">
          {RU_WEEKDAYS_SHORT.map((w) => (
            <div key={w} className="cal__weekday">
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
                  <span className="cal__count" aria-label={`задач: ${total}`}>
                    {open > 0 ? open : "✓"}
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
          {selectedDate.toLocaleDateString("ru-RU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <button className="day-strip__add" onClick={addForSelected}>
          <PlusIcon /> Новая задача
        </button>
      </div>

      {selectedTasks.length === 0 && selectedSubtasks.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <CalendarIcon />
          </div>
          <div className="empty__title">На этот день пусто</div>
          <div>Жми «Новая задача», чтобы добавить дело на этот день.</div>
        </div>
      )}

      {selectedTasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          category={t.category_id ? catById.get(t.category_id) : null}
          onToggle={toggle}
          subtasks={(tasks ?? []).filter((c) => c.parent_task_id === t.id)}
          onToggleSub={toggle}
          onPostpone={!t.is_done ? postpone : undefined}
          onArchive={archive}
          onDelete={remove}
        />
      ))}

      {selectedSubtasks.length > 0 && (
        <div className="section-block">
          <div className="section-block__header">
            <div className="section-block__title">
              <InboxIcon /> подзадачи на этот день
            </div>
            <div className="section-block__count">{selectedSubtasks.length}</div>
          </div>
          {selectedSubtasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
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
              <InboxIcon /> без даты
            </div>
            <div className="section-block__count">{undated.length}</div>
          </div>
          {undated.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              category={t.category_id ? catById.get(t.category_id) : null}
              onToggle={toggle}
              subtasks={(tasks ?? []).filter((c) => c.parent_task_id === t.id)}
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
