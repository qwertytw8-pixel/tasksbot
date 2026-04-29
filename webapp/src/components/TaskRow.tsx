import { useNavigate } from "react-router-dom";

import type { Category, Task } from "../api";
import { haptic } from "../telegram";

export function TaskRow({
  task,
  category,
  onToggle,
}: {
  task: Task;
  category?: Category | null;
  onToggle: (task: Task) => void;
}) {
  const navigate = useNavigate();

  const due = task.due_at ? new Date(task.due_at) : null;
  const dueLabel = due
    ? due.toLocaleString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        day: due.toDateString() === new Date().toDateString() ? undefined : "numeric",
        month: due.toDateString() === new Date().toDateString() ? undefined : "short",
      })
    : null;

  return (
    <div
      className={`task ${task.is_done ? "task--done" : ""}`}
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
        {task.is_done ? "✓" : ""}
      </button>
      <div>
        <div className="task__title">{task.title}</div>
        {(category || dueLabel || task.remind_minutes_before != null) && (
          <div className="task__meta">
            {category && (
              <span className="task__cat">
                {category.emoji ? `${category.emoji} ` : ""}
                {category.name}
              </span>
            )}
            {dueLabel && (
              <span>
                <span className="task__meta-dot" />🕒 {dueLabel}
              </span>
            )}
            {task.remind_minutes_before != null && (
              <span>
                <span className="task__meta-dot" />🔔 −{task.remind_minutes_before}мин
              </span>
            )}
          </div>
        )}
      </div>
      {category?.color && <span className="swatch" style={{ ["--c" as never]: category.color }} />}
    </div>
  );
}
