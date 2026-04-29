import { useNavigate } from "react-router-dom";

import type { Category, Task } from "../api";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CornerDownRightIcon,
  LayersIcon,
} from "../icons";
import { haptic } from "../telegram";
import { fromISODate, isSameDay } from "../utils/date";

export interface TaskRowProps {
  task: Task;
  category?: Category | null;
  onToggle: (task: Task) => void;
  subtasks?: Task[];
  onToggleSub?: (task: Task) => void;
  compact?: boolean;
  hideArrow?: boolean;
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

export function TaskRow({
  task,
  category,
  onToggle,
  subtasks,
  onToggleSub,
  compact = false,
  hideArrow = false,
}: TaskRowProps) {
  const navigate = useNavigate();

  const { label: dueLabel, icon: dueIcon } = dueLabelFor(task);
  const childCount = subtasks?.length ?? 0;
  const childDone = subtasks?.filter((c) => c.is_done).length ?? 0;

  return (
    <div className={`task-card ${task.is_done ? "task-card--done" : ""}`}>
      <div
        className={`task ${compact ? "task--compact" : ""}`}
        onClick={() => navigate(`/edit/${task.id}`)}
      >
        <button
          className={`task__check ${task.is_done ? "task__check--done" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            haptic("light");
            onToggle(task);
          }}
          aria-label={task.is_done ? "Отметить невыполненной" : "Отметить выполненной"}
        >
          {task.is_done ? <CheckIcon /> : null}
        </button>

        <div className="task__content">
          <div className="task__title">{task.title}</div>
          {task.description && <div className="task__description">{task.description}</div>}
          {(category || dueLabel || task.remind_minutes_before != null || childCount > 0) && (
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
              {dueLabel && (
                <span className="task__meta-item">
                  {dueIcon === "time" ? <ClockIcon /> : <CalendarIcon />}
                  {dueLabel}
                </span>
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
