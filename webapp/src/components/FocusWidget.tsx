import { useNavigate } from "react-router-dom";

import type { Task } from "../api";
import { SparkIcon } from "../icons";

interface FocusWidgetProps {
  tasks: Task[];
}

export function FocusWidget({ tasks }: FocusWidgetProps) {
  const navigate = useNavigate();
  const top3 = tasks.slice(0, 3);

  return (
    <div className="focus-widget">
      <div className="focus-widget__header">
        <SparkIcon /> Фокус дня
      </div>
      {top3.length === 0 ? (
        <div className="focus-widget__empty">Нет задач на сегодня</div>
      ) : (
        <div className="focus-widget__list">
          {top3.map((task, i) => (
            <div
              key={task.id}
              className="focus-widget__item"
              onClick={() => navigate(`/edit/${task.id}`)}
            >
              <div className="focus-widget__num">{i + 1}</div>
              <div className="focus-widget__title">{task.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
