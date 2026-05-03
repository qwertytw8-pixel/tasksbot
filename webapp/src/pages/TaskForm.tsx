import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { api, type Category, type SubscriptionStatus, type Task, type TaskInput } from "../api";
import { DatePicker } from "../components/DatePicker";
import { LimitModal } from "../components/LimitModal";
import { WheelTimePicker } from "../components/WheelTimePicker";
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CornerDownRightIcon,
  FlagIcon,
  LayersIcon,
  PlusIcon,
  TagIcon,
} from "../icons";
import { haptic } from "../telegram";
import { fromISODate, todayISO } from "../utils/date";

const REMIND_QUICK_PRESETS: { label: string; minutes: number }[] = [
  { label: "5 мин", minutes: 5 },
  { label: "15 мин", minutes: 15 },
  { label: "30 мин", minutes: 30 },
  { label: "1 ч", minutes: 60 },
  { label: "3 ч", minutes: 180 },
  { label: "1 день", minutes: 60 * 24 },
];

const PRIORITY_OPTIONS: { value: number; label: string; color: string }[] = [
  { value: 0, label: "Без", color: "var(--tb-hint)" },
  { value: 1, label: "Низкий", color: "var(--tb-priority-low)" },
  { value: 2, label: "Средний", color: "var(--tb-priority-med)" },
  { value: 3, label: "Высокий", color: "var(--tb-priority-high)" },
];

type WhenMode = "none" | "date";
type RemindMode = "off" | "on_time" | "before";

function toRemindMode(value: number | null): RemindMode {
  if (value === null) return "off";
  if (value === 0) return "on_time";
  return "before";
}



export function TaskFormPage() {
  const { id } = useParams<{ id?: string }>();
  const editing = id !== undefined;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetDay = searchParams.get("day");
  const presetParent = searchParams.get("parent");

  const [cats, setCats] = useState<Category[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [task, setTask] = useState<Task | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [parentId, setParentId] = useState<number | null>(
    presetParent ? Number(presetParent) : null
  );

  const [whenMode, setWhenMode] = useState<WhenMode>(presetDay ? "date" : "none");
  const [dueDate, setDueDate] = useState<string>(presetDay ?? todayISO());
  const [includeTime, setIncludeTime] = useState(false);
  const [timeHours, setTimeHours] = useState<number>(12);
  const [timeMinutes, setTimeMinutes] = useState<number>(0);
  const [remind, setRemind] = useState<number | null>(15);
  const [remindCustom, setRemindCustom] = useState<string>("15");
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [priority, setPriority] = useState<number>(0);

  const [busy, setBusy] = useState(false);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [modalVariant, setModalVariant] = useState<"daily_limit" | "premium_feature">("daily_limit");
  const [modalFeatureTitle, setModalFeatureTitle] = useState<string | undefined>();
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtasks, setSubtasks] = useState<Task[]>([]);

  const isPremium = subStatus?.is_premium ?? true;

  useEffect(() => {
    void (async () => {
      const [c, t, st] = await Promise.all([
        api.listCategories(),
        api.listTasks(),
        api.subscriptionStatus(),
      ]);
      setCats(c);
      setAllTasks(t);
      setSubStatus(st);
      if (editing && id) {
        const found = t.find((x) => x.id === Number(id));
        if (found) {
          setTask(found);
          setTitle(found.title);
          setDescription(found.description ?? "");
          setCategoryId(found.category_id);
          setParentId(found.parent_task_id);
          if (found.has_time && found.due_at) {
            setWhenMode("date");
            setIncludeTime(true);
            const dtObj = new Date(found.due_at);
            setTimeHours(dtObj.getHours());
            setTimeMinutes(dtObj.getMinutes());
            if (found.due_date) setDueDate(found.due_date);
          } else if (found.due_date) {
            setWhenMode("date");
            setIncludeTime(false);
            setDueDate(found.due_date);
          } else {
            setWhenMode("none");
          }
          const loadedRemind = found.remind_minutes_before;
          if (!st.is_premium && loadedRemind !== null && loadedRemind > 0) {
            setRemind(0);
          } else {
            setRemind(loadedRemind);
          }
          setRecurrence(found.recurrence ?? null);
          setPriority(found.priority ?? 0);
          if (
            loadedRemind !== null &&
            loadedRemind > 0
          ) {
            setRemindCustom(String(loadedRemind));
          }
          setSubtasks(t.filter((x) => x.parent_task_id === found.id));
        }
      }
    })();
  }, [editing, id]);

  const projectCandidates = useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.parent_task_id === null && (!editing || (task && t.id !== task.id))
      ),
    [allTasks, editing, task]
  );

  function buildPayload(): TaskInput {
    if (whenMode === "date" && includeTime && dueDate) {
      const dateObj = fromISODate(dueDate);
      dateObj.setHours(timeHours, timeMinutes, 0, 0);
      return {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        parent_task_id: parentId,
        has_time: true,
        due_at: dateObj.toISOString(),
        due_date: null,
        remind_minutes_before: remind,
        recurrence,
        priority,
        is_done: task?.is_done ?? false,
      };
    }
    if (whenMode === "date" && dueDate) {
      return {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        parent_task_id: parentId,
        has_time: false,
        due_date: dueDate,
        due_at: null,
        remind_minutes_before: null,
        recurrence,
        priority,
        is_done: task?.is_done ?? false,
      };
    }
    return {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId,
      parent_task_id: parentId,
      has_time: false,
      due_date: null,
      due_at: null,
      remind_minutes_before: null,
      recurrence: null,
      priority,
      is_done: task?.is_done ?? false,
    };
  }

  async function save() {
    if (!title.trim()) return;
    if (!editing) {
      try {
        const st = await api.subscriptionStatus();
        setSubStatus(st);
        if (!st.is_premium && st.daily_tasks_count >= st.max_daily_tasks) {
          setModalVariant("daily_limit");
          setShowLimitModal(true);
          return;
        }
      } catch {
        // proceed if status check fails
      }
    }
    setBusy(true);
    try {
      const payload = buildPayload();
      if (editing && task) {
        await api.updateTask(task.id, payload);
      } else {
        await api.createTask(payload);
      }
      haptic("medium");
      navigate(-1);
    } catch (err) {
      if (String(err).includes("403")) {
        try {
          const st = await api.subscriptionStatus();
          setSubStatus(st);
          setModalVariant("daily_limit");
          setShowLimitModal(true);
        } catch {
          alert("Дневной лимит задач исчерпан.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!task) return;
    if (!confirm("Удалить задачу? Подзадачи тоже будут удалены.")) return;
    await api.deleteTask(task.id);
    navigate(-1);
  }

  async function addSubtask() {
    if (!task || !newSubtaskTitle.trim()) return;
    const created = await api.createTask({
      title: newSubtaskTitle.trim(),
      parent_task_id: task.id,
      category_id: task.category_id,
      due_date: task.due_date,
      has_time: false,
    });
    setSubtasks((prev) => [...prev, created]);
    setNewSubtaskTitle("");
    setShowSubtaskInput(false);
  }

  async function toggleSubtask(sub: Task) {
    const updated = await api.updateTask(sub.id, {
      title: sub.title,
      description: sub.description,
      category_id: sub.category_id,
      parent_task_id: sub.parent_task_id,
      due_date: sub.due_date,
      has_time: sub.has_time,
      due_at: sub.due_at,
      remind_minutes_before: sub.remind_minutes_before,
      recurrence: sub.recurrence,
      is_done: !sub.is_done,
    });
    setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
  }

  async function removeSubtask(sub: Task) {
    if (!confirm("Удалить подзадачу?")) return;
    await api.deleteTask(sub.id);
    setSubtasks((prev) => prev.filter((s) => s.id !== sub.id));
  }

  return (
    <div className="page">
      {showLimitModal && (
        <LimitModal
          variant={modalVariant}
          dailyCount={subStatus?.daily_tasks_count}
          maxDaily={subStatus?.max_daily_tasks}
          featureTitle={modalFeatureTitle}
          onClose={() => setShowLimitModal(false)}
        />
      )}
      <div className="page-header">
        <div className="page-header__stack">
          <div className="page-header__title-row">
            <h1>{editing ? "Задача" : "Новая задача"}</h1>
          </div>
          <div className="page-header__subtitle">
            Заголовок, категория и при желании дата, время или ссылка на проект.
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
                  style={
                    categoryId === c.id && c.color
                      ? { color: c.color, borderColor: c.color }
                      : undefined
                  }
                >
                  {c.emoji ? `${c.emoji} ` : ""}
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Важность</span>
            <div className="segmented">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`segmented__item ${priority === p.value ? "segmented__item--active" : ""}`}
                  style={priority === p.value ? { color: p.color, borderColor: p.color } : undefined}
                  onClick={() => setPriority(p.value)}
                >
                  {p.value > 0 && <FlagIcon style={{ color: p.color }} />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Когда</span>
            <div className="segmented">
              <button
                type="button"
                className={`segmented__item ${whenMode === "none" ? "segmented__item--active" : ""}`}
                onClick={() => { setWhenMode("none"); setIncludeTime(false); }}
              >
                <LayersIcon /> Без даты
              </button>
              <button
                type="button"
                className={`segmented__item ${whenMode === "date" ? "segmented__item--active" : ""}`}
                onClick={() => setWhenMode("date")}
              >
                <CalendarIcon /> Дата
              </button>
            </div>

            {whenMode === "date" && (
              <>
                <DatePicker value={dueDate} onChange={setDueDate} />
                {dueDate && (
                  <div className="hint">
                    {fromISODate(dueDate).toLocaleDateString("ru-RU", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    {includeTime && (
                      <> в {String(timeHours).padStart(2, "0")}:{String(timeMinutes).padStart(2, "0")}</>
                    )}
                  </div>
                )}

                <label className="time-toggle" onClick={() => { haptic("light"); setIncludeTime((v) => !v); }}>
                  <span className={`time-toggle__track ${includeTime ? "time-toggle__track--on" : ""}`}>
                    <span className="time-toggle__thumb" />
                  </span>
                  <span className="time-toggle__label">
                    <ClockIcon /> Добавить время
                  </span>
                </label>

                {includeTime && (
                  <div className="time-section-enter">
                    <WheelTimePicker
                      hours={timeHours}
                      minutes={timeMinutes}
                      onChange={(h, m) => {
                        setTimeHours(h);
                        setTimeMinutes(m);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {whenMode === "date" && includeTime && (
            <div className="field">
              <span className="field__label">Напомнить</span>
              <div className="remind-modes" role="tablist">
                <button
                  type="button"
                  className={`remind-mode ${
                    toRemindMode(remind) === "off" ? "remind-mode--active" : ""
                  }`}
                  onClick={() => setRemind(null)}
                >
                  <span className="remind-mode__icon">
                    <BellIcon />
                  </span>
                  Без
                </button>
                <button
                  type="button"
                  className={`remind-mode ${
                    toRemindMode(remind) === "on_time" ? "remind-mode--active" : ""
                  }`}
                  onClick={() => setRemind(0)}
                >
                  <span className="remind-mode__icon">
                    <ClockIcon />
                  </span>
                  Вовремя
                </button>
                {isPremium && (
                  <button
                    type="button"
                    className={`remind-mode ${
                      toRemindMode(remind) === "before" ? "remind-mode--active" : ""
                    }`}
                    onClick={() => {
                      const fallback = Number.parseInt(remindCustom, 10);
                      const next =
                        Number.isFinite(fallback) && fallback > 0 ? fallback : 15;
                      setRemindCustom(String(next));
                      setRemind(next);
                    }}
                  >
                    <span className="remind-mode__icon">
                      <BellIcon />
                    </span>
                    Заранее
                  </button>
                )}
                {!isPremium && (
                  <button
                    type="button"
                    className="remind-mode remind-mode--locked"
                    onClick={() => {
                      setModalVariant("premium_feature");
                      setModalFeatureTitle("Напоминание заранее");
                      setShowLimitModal(true);
                    }}
                  >
                    <span className="remind-mode__icon">
                      <BellIcon />
                    </span>
                    Заранее 💎
                  </button>
                )}
              </div>

              {isPremium && toRemindMode(remind) === "before" && (
                <div className="remind-custom">
                  <div className="remind-custom__row">
                    <input
                      className="remind-custom__input"
                      type="number"
                      min={1}
                      max={60 * 24 * 7}
                      inputMode="numeric"
                      value={remindCustom}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRemindCustom(v);
                        const n = Number.parseInt(v, 10);
                        if (Number.isFinite(n) && n > 0) setRemind(n);
                      }}
                    />
                    <span className="remind-custom__unit">минут до начала</span>
                  </div>
                  <div className="remind-quick">
                    {REMIND_QUICK_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.minutes}
                        className={`remind-quick__chip ${
                          remind === p.minutes ? "remind-quick__chip--active" : ""
                        }`}
                        onClick={() => {
                          setRemind(p.minutes);
                          setRemindCustom(String(p.minutes));
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {whenMode !== "none" && (
            <div className="field">
              <span className="field__label">Повторение</span>
              <div className="segmented">
                <button
                  type="button"
                  className={`segmented__item ${recurrence === null ? "segmented__item--active" : ""}`}
                  onClick={() => setRecurrence(null)}
                >
                  Без
                </button>
                <button
                  type="button"
                  className={`segmented__item ${recurrence === "daily" ? "segmented__item--active" : ""}`}
                  onClick={() => setRecurrence("daily")}
                >
                  День
                </button>
                <button
                  type="button"
                  className={`segmented__item ${recurrence === "weekly" ? "segmented__item--active" : ""}`}
                  onClick={() => setRecurrence("weekly")}
                >
                  Неделя
                </button>
                <button
                  type="button"
                  className={`segmented__item ${recurrence === "monthly" ? "segmented__item--active" : ""}`}
                  onClick={() => setRecurrence("monthly")}
                >
                  Месяц
                </button>
              </div>
            </div>
          )}

          <div className="field">
            <span className="field__label">Часть проекта</span>
            <div className="chips">
              <button
                type="button"
                className={`chip ${parentId === null ? "chip--active" : ""}`}
                onClick={() => setParentId(null)}
              >
                <LayersIcon style={{ width: 14, height: 14 }} />
                Самостоятельная
              </button>
              {projectCandidates.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`chip ${parentId === p.id ? "chip--soft-active" : ""}`}
                  onClick={() => setParentId(p.id)}
                >
                  <CornerDownRightIcon style={{ width: 14, height: 14 }} />
                  {p.title}
                </button>
              ))}
            </div>
            <div className="hint">
              Можно вложить задачу в большой проект — например, проект «Сайт» и задача «Текст
              на главную».
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

      {editing && task && (
        <div className="surface" style={{ marginTop: 14 }}>
          <div className="surface__heading">
            <LayersIcon /> Подзадачи
            <span className="surface__heading-count">{subtasks.length}</span>
          </div>

          {subtasks.length === 0 && !showSubtaskInput && (
            <div className="hint" style={{ marginTop: 4 }}>
              Дроби крупную задачу на шаги — каждый можно отметить отдельно.
            </div>
          )}

          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className={`subtask subtask--editable ${sub.is_done ? "subtask--done" : ""}`}
            >
              <button
                className={`task__check task__check--sm ${sub.is_done ? "task__check--done" : ""}`}
                onClick={() => void toggleSubtask(sub)}
              >
                {sub.is_done ? <CheckIcon /> : null}
              </button>
              <span className="subtask__title" onClick={() => navigate(`/edit/${sub.id}`)}>
                {sub.title}
              </span>
              <button
                className="subtask__remove"
                onClick={() => void removeSubtask(sub)}
                aria-label="Удалить подзадачу"
              >
                ×
              </button>
            </div>
          ))}

          {showSubtaskInput ? (
            <div className="subtask-form">
              <input
                className="input"
                placeholder="Название подзадачи"
                value={newSubtaskTitle}
                autoFocus
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addSubtask();
                }}
              />
              <button
                className="btn btn--inline"
                disabled={!newSubtaskTitle.trim()}
                onClick={() => void addSubtask()}
              >
                Добавить
              </button>
            </div>
          ) : (
            <button
              className="btn btn--ghost"
              onClick={() => setShowSubtaskInput(true)}
              type="button"
            >
              <PlusIcon style={{ width: 16, height: 16, marginRight: 8, verticalAlign: "-3px" }} />
              Добавить подзадачу
            </button>
          )}
        </div>
      )}
    </div>
  );
}
