import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Category, Task } from "../api";
import { Confetti } from "./Confetti";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CornerDownRightIcon,

  LayersIcon,
  RotateCcwIcon,
  SunriseIcon,
  TrashIcon,
} from "../icons";
import { haptic } from "../telegram";
import { fromISODate, isSameDay, tomorrowISO } from "../utils/date";

export interface TaskRowProps {
  task: Task;
  category?: Category | null;
  onToggle: (task: Task) => void;
  subtasks?: Task[];
  onToggleSub?: (task: Task) => void;
  compact?: boolean;
  hideArrow?: boolean;
  onPostpone?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onUnarchive?: (task: Task) => void;
}

function dueLabelFor(task: Task): { label: string | null; icon: "time" | "date" | null } {
  if (task.has_time && task.due_at) {
    const d = new Date(task.due_at);
    const today = new Date();
    const sameDay = isSameDay(d, today);
    return {
      label: d.toLocaleString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        day: sameDay ? undefined : "numeric",
        month: sameDay ? undefined : "short",
      }),
      icon: "time",
    };
  }
  if (task.due_date) {
    const d = fromISODate(task.due_date);
    const today = new Date();
    if (isSameDay(d, today)) return { label: "Сегодня", icon: "date" };
    return {
      label: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      icon: "date",
    };
  }
  return { label: null, icon: null };
}

export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.is_done || task.archived_at) return false;
  if (task.has_time && task.due_at) {
    return new Date(task.due_at).getTime() < now.getTime();
  }
  if (task.due_date) {
    // "End of day" for date-only tasks: only count as overdue if the due_date is strictly before today.
    const due = fromISODate(task.due_date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return due.getTime() < today.getTime();
  }
  return false;
}

function overdueLabelFor(task: Task, now: Date = new Date()): string | null {
  if (!isTaskOverdue(task, now)) return null;
  if (task.has_time && task.due_at) {
    const diffMin = Math.floor((now.getTime() - new Date(task.due_at).getTime()) / 60000);
    if (diffMin < 1) return "Просрочено только что";
    if (diffMin < 60) return `Просрочено ${diffMin} мин`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    if (hours < 24) return mins === 0 ? `Просрочено ${hours} ч` : `Просрочено ${hours} ч ${mins} мин`;
    const days = Math.floor(hours / 24);
    return `Просрочено ${days} дн`;
  }
  if (task.due_date) {
    const due = fromISODate(task.due_date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays <= 0) return "Просрочено";
    if (diffDays === 1) return "Просрочено на 1 день";
    return `Просрочено на ${diffDays} дн`;
  }
  return "Просрочено";
}

// Dispatched when any task-swipe opens so all others close.
const SWIPE_EVENT = "tb:task-swipe-open";

type SwipeOpenDetail = { id: number };

const ACTION_WIDTH = 76;
const SWIPE_THRESHOLD = 40;
const MAX_OVERSHOOT = 24;

export function TaskRow({
  task,
  category,
  onToggle,
  subtasks,
  onToggleSub,
  compact = false,
  hideArrow = false,
  onPostpone,
  onDelete,
  onArchive,
  onUnarchive,
}: TaskRowProps) {
  const navigate = useNavigate();
  const [confettiOrigin, setConfettiOrigin] = useState<{ x: number; y: number } | null>(null);

  const { label: dueLabel, icon: dueIcon } = dueLabelFor(task);
  const childCount = subtasks?.length ?? 0;
  const childDone = subtasks?.filter((c) => c.is_done).length ?? 0;
  const overdueLabel = overdueLabelFor(task);

  // Hide "Завтра" if the task is already scheduled for tomorrow.
  const isAlreadyTomorrow = task.due_date === tomorrowISO();
  const effectivePostpone = onPostpone && !isAlreadyTomorrow ? onPostpone : undefined;

  // Toggle (Готово/Вернуть) shows only for live tasks that also have another action.
  const isArchived = Boolean(task.archived_at);
  const hasToggleInSwipe = !isArchived && Boolean(effectivePostpone || onDelete || onArchive);
  const actionsCount =
    (hasToggleInSwipe ? 1 : 0) +
    (effectivePostpone ? 1 : 0) +
    (onArchive ? 1 : 0) +
    (onUnarchive ? 1 : 0) +
    (onDelete ? 1 : 0);
  const hasActions = actionsCount > 0;
  const maxOffset = actionsCount * ACTION_WIDTH;

  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const open = !dragging && dx <= -SWIPE_THRESHOLD;
  const foregroundRef = useRef<HTMLDivElement | null>(null);
  const pointerState = useRef<{
    id: number;
    startX: number;
    startY: number;
    startDx: number;
    active: boolean;
    decided: "horizontal" | "vertical" | null;
  } | null>(null);

  const actionsRef = useRef<HTMLDivElement | null>(null);

  // Close on global open of another task or outside taps.
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<SwipeOpenDetail>).detail;
      if (!detail || detail.id !== task.id) setDx(0);
    }
    function onGlobalDown(e: Event) {
      const target = e.target as HTMLElement;
      if (actionsRef.current?.contains(target)) return;
      setDx(0);
    }
    window.addEventListener(SWIPE_EVENT, onOpen);
    if (open) window.addEventListener("pointerdown", onGlobalDown, { capture: true });
    return () => {
      window.removeEventListener(SWIPE_EVENT, onOpen);
      window.removeEventListener("pointerdown", onGlobalDown, { capture: true } as never);
    };
  }, [open, task.id]);

  function broadcastOpen() {
    window.dispatchEvent(new CustomEvent<SwipeOpenDetail>(SWIPE_EVENT, { detail: { id: task.id } }));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!hasActions) return;
    pointerState.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startDx: dx,
      active: true,
      decided: null,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const s = pointerState.current;
    if (!s || !s.active || s.id !== e.pointerId) return;
    const deltaX = e.clientX - s.startX;
    const deltaY = e.clientY - s.startY;
    if (s.decided === null) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      s.decided = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      if (s.decided === "vertical") {
        // Let the page scroll; release our gesture.
        s.active = false;
        return;
      }
      setDragging(true);
      try {
        foregroundRef.current?.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (s.decided !== "horizontal") return;
    let next = s.startDx + deltaX;
    // clamp: [-(maxOffset + overshoot) ... +overshoot]
    if (next < -(maxOffset + MAX_OVERSHOOT)) next = -(maxOffset + MAX_OVERSHOOT);
    if (next > MAX_OVERSHOOT) next = MAX_OVERSHOOT;
    setDx(next);
  }

  function handlePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    const s = pointerState.current;
    if (!s) return;
    try {
      foregroundRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    pointerState.current = null;
    setDragging(false);
    if (s.decided !== "horizontal") return;
    if (dx <= -SWIPE_THRESHOLD) {
      setDx(-maxOffset);
      haptic("light");
      broadcastOpen();
    } else {
      setDx(0);
    }
  }

  function handleRowClick() {
    if (open) {
      setDx(0);
      return;
    }
    navigate(`/edit/${task.id}`);
  }

  function runAction(action: () => void) {
    haptic("medium");
    setDx(0);
    action();
  }

  const translateX = `${dx}px`;
  const contentClass = [
    "task-swipe__content",
    dragging ? "task-swipe__content--dragging" : "",
    open ? "task-swipe__content--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const swipeClass = [
    "task-swipe",
    open ? "task-swipe--open" : "",
    dragging || dx !== 0 ? "task-swipe--active task-swipe--revealing" : "",
    compact ? "task-swipe--compact" : "",
    !hasActions ? "task-swipe--no-actions" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const priorityClass = task.priority
    ? `task-card--priority-${task.priority}`
    : "";

  const cardClass = [
    "task-card",
    task.is_done ? "task-card--done" : "",
    overdueLabel ? "task-card--overdue" : "",
    isArchived ? "task-card--archived" : "",
    priorityClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className={swipeClass}>
        {hasActions && (
          <div
            ref={actionsRef}
            className="task-swipe__actions"
            style={{ width: maxOffset }}
            aria-hidden={!open}
          >
            {effectivePostpone && (
              <button
                type="button"
                className="task-swipe__action task-swipe__action--postpone"
                onClick={(e) => {
                  e.stopPropagation();
                  runAction(() => effectivePostpone(task));
                }}
              >
                <SunriseIcon />
                <span>Завтра</span>
              </button>
            )}
            {hasToggleInSwipe && (
              <button
                type="button"
                className="task-swipe__action task-swipe__action--done"
                onClick={(e) => {
                  e.stopPropagation();
                  runAction(() => onToggle(task));
                }}
              >
                <CheckIcon />
                <span>{task.is_done ? "Вернуть" : "Готово"}</span>
              </button>
            )}
            {onArchive && (
              <button
                type="button"
                className="task-swipe__action task-swipe__action--archive"
                onClick={(e) => {
                  e.stopPropagation();
                  runAction(() => onArchive(task));
                }}
              >
                <ArchiveIcon />
                <span>В архив</span>
              </button>
            )}
            {onUnarchive && (
              <button
                type="button"
                className="task-swipe__action task-swipe__action--restore"
                onClick={(e) => {
                  e.stopPropagation();
                  runAction(() => onUnarchive(task));
                }}
              >
                <RotateCcwIcon />
                <span>Вернуть</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="task-swipe__action task-swipe__action--delete"
                onClick={(e) => {
                  e.stopPropagation();
                  runAction(() => onDelete(task));
                }}
              >
                <TrashIcon />
                <span>Удалить</span>
              </button>
            )}
          </div>
        )}

        <div
          ref={foregroundRef}
          className={contentClass}
          style={{ transform: `translate3d(${translateX}, 0, 0)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <div
            className={`task ${compact ? "task--compact" : ""}`}
            onClick={handleRowClick}
          >
            <button
              className={`task__check ${task.is_done ? "task__check--done" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                haptic("light");
                if (!task.is_done) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                  haptic("heavy");
                }
                onToggle(task);
              }}
              aria-label={task.is_done ? "Отметить невыполненной" : "Отметить выполненной"}
            >
              {task.is_done ? <CheckIcon /> : null}
            </button>
            {confettiOrigin && (
              <Confetti
                originX={confettiOrigin.x}
                originY={confettiOrigin.y}
                onDone={() => setConfettiOrigin(null)}
              />
            )}

            <div className="task__content">
              <div className="task__title">{task.title}</div>
              {task.description && <div className="task__description">{task.description}</div>}
              {(category ||
                dueLabel ||
                overdueLabel ||
                task.remind_minutes_before != null ||
                childCount > 0) && (
                <div className="task__meta">

                  {category && (
                    <span
                      className="task__cat"
                      style={category.color ? { color: category.color } : undefined}
                    >
                      {category.emoji ? `${category.emoji} ` : ""}
                      {category.name}
                    </span>
                  )}
                  {overdueLabel ? (
                    <span className="task__meta-item task__meta-item--overdue">
                      <AlertTriangleIcon />
                      {overdueLabel}
                    </span>
                  ) : (
                    dueLabel && (
                      <span className="task__meta-item">
                        {dueIcon === "time" ? <ClockIcon /> : <CalendarIcon />}
                        {dueLabel}
                      </span>
                    )
                  )}
                  {task.remind_minutes_before != null && (
                    <span className="task__meta-item">
                      <BellIcon />−{task.remind_minutes_before} мин
                    </span>
                  )}
                  {childCount > 0 && (
                    <span className="task__meta-item">
                      <LayersIcon /> {childDone}/{childCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {!hideArrow && (
              <span className="task__arrow">
                <ArrowRightIcon />
              </span>
            )}
          </div>
        </div>
      </div>

      {subtasks && subtasks.length > 0 && (
        <div className="task__children">
          {subtasks.map((c) => (
            <SubtaskRow
              key={c.id}
              task={c}
              onToggle={onToggleSub ?? onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubtaskRow({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  const navigate = useNavigate();
  return (
    <div
      className={`subtask ${task.is_done ? "subtask--done" : ""}`}
      onClick={() => navigate(`/edit/${task.id}`)}
    >
      <span className="subtask__rail">
        <CornerDownRightIcon />
      </span>
      <button
        className={`task__check task__check--sm ${task.is_done ? "task__check--done" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          haptic("light");
          onToggle(task);
        }}
        aria-label={task.is_done ? "Отметить невыполненной" : "Отметить выполненной"}
      >
        {task.is_done ? <CheckIcon /> : null}
      </button>
      <span className="subtask__title">{task.title}</span>
    </div>
  );
}
