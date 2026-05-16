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
  LayersIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from "../icons";
import { useI18n } from "../i18n";
import { haptic } from "../telegram";
import { fromISODate, todayISO } from "../utils/date";

const REMIND_QUICK_KEYS = [
  { key: "form.remind_5m", minutes: 5 },
  { key: "form.remind_15m", minutes: 15 },
  { key: "form.remind_30m", minutes: 30 },
  { key: "form.remind_1h", minutes: 60 },
  { key: "form.remind_3h", minutes: 180 },
  { key: "form.remind_1d", minutes: 60 * 24 },
];

const PRIORITY_KEYS = [
  { value: 0, key: "form.priority_none", color: "var(--tb-hint)" },
  { value: 1, key: "form.priority_low", color: "var(--tb-priority-low)" },
  { value: 2, key: "form.priority_med", color: "var(--tb-priority-med)" },
  { value: 3, key: "form.priority_high", color: "var(--tb-priority-high)" },
];

type WhenMode = "none" | "date";
type RemindMode = "off" | "on_time" | "before";

function toRemindMode(value: number | null): RemindMode {
  if (value === null) return "off";
  if (value === 0) return "on_time";
  return "before";
}



export function TaskFormPage() {
  const { t, lang } = useI18n();
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
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷");
  const [newCatColor, setNewCatColor] = useState("#6D5DFC");
  const [newCatBusy, setNewCatBusy] = useState(false);

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
          alert(t("form.daily_limit_alert"));
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!task) return;
    if (!confirm(t("confirm.delete_task_subs"))) return;
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
      priority: sub.priority,
      is_done: !sub.is_done,
    });
    setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
  }

  async function removeSubtask(sub: Task) {
    if (!confirm(t("confirm.delete_subtask"))) return;
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
            <h1>{editing ? t("form.edit") : t("form.new")}</h1>
          </div>
          <div className="page-header__subtitle">
            {t("form.subtitle")}
          </div>
        </div>
        <button className="inline-action" onClick={() => navigate(-1)}>
          {t("form.close")}
        </button>
      </div>

      <div className="surface">
        <div className="form">
          <div className="field">
            <span className="field__label">{t("form.title_label")}</span>
            <input
              className="input"
              placeholder={t("form.title_placeholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!editing}
            />
          </div>

          <div className="field">
            <span className="field__label">{t("form.desc_label")}</span>
            <textarea
              className="textarea"
              placeholder={t("form.desc_placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <span className="field__label">{t("form.category")}</span>
            <div className="chips">
              <button
                type="button"
                className={`chip ${categoryId === null ? "chip--active" : ""}`}
                onClick={() => setCategoryId(null)}
              >
                <TagIcon style={{ width: 14, height: 14 }} />
                {t("form.cat_none")}
              </button>
              {cats.map((c) => (
                <span key={c.id} className="chip-wrap">
                  <button
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
                  <button
                    type="button"
                    className="chip-delete"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(t("confirm.delete_category"))) return;
                      await api.deleteCategory(c.id);
                      setCats((prev) => prev.filter((x) => x.id !== c.id));
                      if (categoryId === c.id) setCategoryId(null);
                    }}
                    aria-label={t("confirm.delete_category")}
                  >
                    <TrashIcon style={{ width: 12, height: 12 }} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="chip chip--add"
                onClick={() => setShowNewCat((v) => !v)}
              >
                <PlusIcon style={{ width: 14, height: 14 }} />
                {t("form.cat_new")}
              </button>
            </div>
            {showNewCat && (
              <div className="inline-cat-form">
                <input
                  className="input input--sm"
                  placeholder={t("form.cat_name_placeholder")}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <input
                  className="input input--sm input--emoji"
                  maxLength={4}
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                />
                <div className="chips chips--mini">
                  {["#6D5DFC","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EF4444","#06B6D4","#EC4899"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`chip chip--dot ${newCatColor === c ? "chip--soft-active" : ""}`}
                      style={{ borderColor: newCatColor === c ? c : undefined }}
                      onClick={() => setNewCatColor(c)}
                    >
                      <span className="swatch" style={{ ["--c" as never]: c }} />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn--sm"
                  disabled={newCatBusy || !newCatName.trim()}
                  onClick={async () => {
                    setNewCatBusy(true);
                    try {
                      const created = await api.createCategory({
                        name: newCatName.trim(),
                        emoji: newCatEmoji || null,
                        color: newCatColor,
                      });
                      setCats((prev) => [...prev, created]);
                      setCategoryId(created.id);
                      setNewCatName("");
                      setShowNewCat(false);
                    } finally {
                      setNewCatBusy(false);
                    }
                  }}
                >
                  <PlusIcon style={{ width: 14, height: 14 }} />
                  {t("form.cat_add")}
                </button>
              </div>
            )}
          </div>

          <div className="field">
            <span className="field__label">{t("form.priority")}</span>
            <div className="segmented">
              {PRIORITY_KEYS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`segmented__item ${priority === p.value ? "segmented__item--active" : ""}`}
                  style={priority === p.value ? { color: p.color, borderColor: p.color } : undefined}
                  onClick={() => setPriority(p.value)}
                >
                  {t(p.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">{t("form.when")}</span>
            <div className="segmented">
              <button
                type="button"
                className={`segmented__item ${whenMode === "none" ? "segmented__item--active" : ""}`}
                onClick={() => { setWhenMode("none"); setIncludeTime(false); }}
              >
                <LayersIcon /> {t("form.when_none")}
              </button>
              <button
                type="button"
                className={`segmented__item ${whenMode === "date" ? "segmented__item--active" : ""}`}
                onClick={() => setWhenMode("date")}
              >
                <CalendarIcon /> {t("form.when_date")}
              </button>
            </div>

            {whenMode === "date" && (
              <>
                <DatePicker value={dueDate} onChange={setDueDate} />
                {dueDate && (
                  <div className="hint">
                    {fromISODate(dueDate).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    {includeTime && (
                      <> {lang === "ru" ? "в" : "at"} {String(timeHours).padStart(2, "0")}:{String(timeMinutes).padStart(2, "0")}</>
                    )}
                  </div>
                )}

                <label className="time-toggle" onClick={() => { haptic("light"); setIncludeTime((v) => !v); }}>
                  <span className={`time-toggle__track ${includeTime ? "time-toggle__track--on" : ""}`}>
                    <span className="time-toggle__thumb" />
                  </span>
                  <span className="time-toggle__label">
                    <ClockIcon /> {t("form.add_time")}
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
              <span className="field__label">{t("form.remind")}</span>
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
                  {t("form.remind_off")}
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
                  {t("form.remind_on_time")}
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
                    {t("form.remind_before")}
                  </button>
                )}
                {!isPremium && (
                  <button
                    type="button"
                    className="remind-mode remind-mode--locked"
                    onClick={() => {
                      setModalVariant("premium_feature");
                      setModalFeatureTitle(t("form.remind_before"));
                      setShowLimitModal(true);
                    }}
                  >
                    <span className="remind-mode__icon">
                      <BellIcon />
                    </span>
                    {t("form.remind_before")} 💎
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
                    <span className="remind-custom__unit">{t("form.remind_unit")}</span>
                  </div>
                  <div className="remind-quick">
                    {REMIND_QUICK_KEYS.map((p) => (
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
                        {t(p.key)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {whenMode !== "none" && (
            <div className="field">
              <span className="field__label">{t("form.recurrence")}</span>
              <div className="segmented">
                <button
                  type="button"
                  className={`segmented__item ${recurrence === null ? "segmented__item--active" : ""}`}
                  onClick={() => setRecurrence(null)}
                >
                  {t("form.rec_none")}
                </button>
                <button
                  type="button"
                  className={`segmented__item ${recurrence === "daily" ? "segmented__item--active" : ""}`}
                  onClick={() => setRecurrence("daily")}
                >
                  {t("form.rec_daily")}
                </button>
                <button
                  type="button"
                  className={`segmented__item ${recurrence === "weekly" ? "segmented__item--active" : ""}`}
                  onClick={() => setRecurrence("weekly")}
                >
                  {t("form.rec_weekly")}
                </button>
                <button
                  type="button"
                  className={`segmented__item ${recurrence === "monthly" ? "segmented__item--active" : ""}`}
                  onClick={() => setRecurrence("monthly")}
                >
                  {t("form.rec_monthly")}
                </button>
              </div>
            </div>
          )}

          <div className="field">
            <span className="field__label">{t("form.project")}</span>
            <div className="chips">
              <button
                type="button"
                className={`chip ${parentId === null ? "chip--active" : ""}`}
                onClick={() => setParentId(null)}
              >
                <LayersIcon style={{ width: 14, height: 14 }} />
                {t("form.project_standalone")}
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
              {t("form.project_hint")}
            </div>
          </div>

          <button className="btn" disabled={busy || !title.trim()} onClick={() => void save()}>
            {editing ? t("form.save") : t("form.add_task")}
          </button>

          {editing && (
            <button className="btn btn--danger" onClick={() => void remove()}>
              {t("form.delete_task")}
            </button>
          )}
        </div>
      </div>

      {editing && task && (
        <div className="surface" style={{ marginTop: 14 }}>
          <div className="surface__heading">
            <LayersIcon /> {t("form.subtasks")}
            <span className="surface__heading-count">{subtasks.length}</span>
          </div>

          {subtasks.length === 0 && !showSubtaskInput && (
            <div className="hint" style={{ marginTop: 4 }}>
              {t("form.subtasks_hint")}
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
                aria-label={t("form.delete_subtask")}
              >
                ×
              </button>
            </div>
          ))}

          {showSubtaskInput ? (
            <div className="subtask-form">
              <input
                className="input"
                placeholder={t("form.subtask_placeholder")}
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
                {t("form.cat_add")}
              </button>
            </div>
          ) : (
            <button
              className="btn btn--ghost"
              onClick={() => setShowSubtaskInput(true)}
              type="button"
            >
              <PlusIcon style={{ width: 16, height: 16, marginRight: 8, verticalAlign: "-3px" }} />
              {t("form.add_subtask")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
