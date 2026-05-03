import { useNavigate } from "react-router-dom";

import type { Category, Task } from "../api";
import { FlagIcon } from "../icons";

const PRIORITY_COLORS: Record<number, string> = {
  1: "#4caf50",
  2: "#ff9800",
  3: "#f44336",
};

interface HourlyTimelineProps {
  tasks: Task[];
  categories: Map<number, Category>;
}

export function HourlyTimeline({ tasks, categories }: HourlyTimelineProps) {
  const navigate = useNavigate();

  const timedTasks = tasks
    .filter((t) => t.has_time && t.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

  const untimedTasks = tasks.filter((t) => !t.has_time || !t.due_at);

  const tasksByHour = new Map<number, Task[]>();
  for (const t of timedTasks) {
    const h = new Date(t.due_at!).getHours();
    if (!tasksByHour.has(h)) tasksByHour.set(h, []);
    tasksByHour.get(h)!.push(t);
  }

  const hours: number[] = [];
  for (let h = 0; h < 24; h++) hours.push(h);

  const nowHour = new Date().getHours();

  return (
    <div className="hourly-timeline">
      {untimedTasks.length > 0 && (
        <div className="hourly-timeline__untimed">
          <div className="hourly-timeline__untimed-label">Весь день</div>
          <div className="hourly-timeline__untimed-list">
            {untimedTasks.map((t) => {
              const cat = t.category_id ? categories.get(t.category_id) : null;
              return (
                <div
                  key={t.id}
                  className={`ht-task ${t.is_done ? "ht-task--done" : ""}`}
                  onClick={() => navigate(`/edit/${t.id}`)}
                >
                  {t.priority > 0 && (
                    <span className="ht-task__priority" style={{ color: PRIORITY_COLORS[t.priority] }}>
                      <FlagIcon />
                    </span>
                  )}
                  <span className="ht-task__title">{t.title}</span>
                  {cat && (
                    <span className="ht-task__cat" style={cat.color ? { color: cat.color } : undefined}>
                      {cat.emoji ?? ""} {cat.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="hourly-timeline__grid">
        {hours.map((h) => {
          const hTasks = tasksByHour.get(h) ?? [];
          const isNow = h === nowHour;
          return (
            <div
              key={h}
              className={`ht-row ${isNow ? "ht-row--now" : ""} ${hTasks.length > 0 ? "ht-row--has" : ""}`}
            >
              <div className="ht-row__time">
                {String(h).padStart(2, "0")}:00
              </div>
              <div className="ht-row__line" />
              <div className="ht-row__tasks">
                {hTasks.map((t) => {
                  const cat = t.category_id ? categories.get(t.category_id) : null;
                  const mins = new Date(t.due_at!).getMinutes();
                  return (
                    <div
                      key={t.id}
                      className={`ht-task ${t.is_done ? "ht-task--done" : ""}`}
                      onClick={() => navigate(`/edit/${t.id}`)}
                    >
                      {t.priority > 0 && (
                        <span className="ht-task__priority" style={{ color: PRIORITY_COLORS[t.priority] }}>
                          <FlagIcon />
                        </span>
                      )}
                      <span className="ht-task__title">{t.title}</span>
                      <span className="ht-task__time">
                        {String(h).padStart(2, "0")}:{String(mins).padStart(2, "0")}
                      </span>
                      {cat && (
                        <span className="ht-task__cat" style={cat.color ? { color: cat.color } : undefined}>
                          {cat.emoji ?? ""} {cat.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
