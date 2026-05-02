import { useNavigate } from "react-router-dom";

import { CheckIcon } from "../icons";

interface LimitModalProps {
  dailyCount: number;
  maxDaily: number;
  onClose: () => void;
}

const PREMIUM_FEATURES = [
  "Безлимитные задачи каждый день",
  "Создание своих категорий",
  "AI-парсинг текстовых сообщений",
  "AI-парсинг голосовых сообщений",
  "Подзадачи без ограничений",
];

export function LimitModal({ dailyCount, maxDaily, onClose }: LimitModalProps) {
  const navigate = useNavigate();

  return (
    <div className="limit-modal__backdrop" onClick={onClose}>
      <div className="limit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="limit-modal__icon">⚠️</div>
        <h2 className="limit-modal__title">Дневной лимит задач</h2>
        <p className="limit-modal__text">
          Ты создал <b>{dailyCount}</b> из <b>{maxDaily}</b> задач сегодня на
          бесплатном плане. Создание новых задач будет доступно завтра.
        </p>

        <div className="limit-modal__features">
          <div className="limit-modal__features-title">
            С Premium ты получишь:
          </div>
          <ul>
            {PREMIUM_FEATURES.map((f) => (
              <li key={f}>
                <span className="limit-modal__check">
                  <CheckIcon />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="limit-modal__buy"
          onClick={() => {
            onClose();
            navigate("/profile/subscription");
          }}
        >
          💎 Купить подписку
        </button>
        <button type="button" className="limit-modal__close" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
