import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type DailyQuestOut, type DailyQuestsResponse } from "../api";
import { CoinIcon, RefreshIcon, CheckIcon } from "../icons";
import { useT } from "../i18n";
import { haptic } from "../telegram";

export function DailyQuestsPage() {
  const t = useT();
  const navigate = useNavigate();
  const [data, setData] = useState<DailyQuestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerolling, setRerolling] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.dailyQuests();
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReroll = useCallback(async (questId: number) => {
    if (!data) return;
    setRerolling(questId);
    try {
      const res = await api.rerollQuest(questId);
      haptic("light");
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          quests: prev.quests.map((q) =>
            q.id === questId ? res.new_quest : q
          ),
        };
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRerolling(null);
    }
  }, [data]);

  if (loading) return <div className="spinner">{t("\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026", "Loading\u2026")}</div>;
  if (error) return <div className="page"><p style={{ color: "var(--tb-danger)" }}>{error}</p></div>;
  if (!data) return null;

  const completedCount = data.quests.filter((q) => q.is_completed).length;

  return (
    <div className="page pet-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("\u0415\u0436\u0435\u0434\u043d\u0435\u0432\u043d\u044b\u0435 \u043a\u0432\u0435\u0441\u0442\u044b", "Daily Quests")}</h1>
          <p className="page-header__date">
            {completedCount}/{data.quests.length} {t("\u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u043e", "completed")}
          </p>
        </div>
        <button
          className="pet-back-btn"
          onClick={() => navigate("/pet")}
        >
          {t("\u041d\u0430\u0437\u0430\u0434", "Back")}
        </button>
      </div>

      <div className="daily-quests">
        {data.quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            rerollAvailable={data.reroll_available}
            rerollCost={data.reroll_cost}
            rerolling={rerolling === quest.id}
            onReroll={handleReroll}
          />
        ))}
      </div>

      {data.reroll_available && (
        <p className="daily-quests__hint">
          {t(
            `\u041f\u0435\u0440\u0435\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u043a\u0432\u0435\u0441\u0442 \u2014 ${data.reroll_cost} \u043c\u043e\u043d\u0435\u0442`,
            `Reroll a quest \u2014 ${data.reroll_cost} coins`
          )}
        </p>
      )}
    </div>
  );
}

function QuestCard({
  quest,
  rerollAvailable,
  rerollCost,
  rerolling,
  onReroll,
}: {
  quest: DailyQuestOut;
  rerollAvailable: boolean;
  rerollCost: number;
  rerolling: boolean;
  onReroll: (id: number) => void;
}) {
  const t = useT();
  const progress = Math.min(100, (quest.progress / quest.target_value) * 100);

  return (
    <div className={`quest-card ${quest.is_completed ? "quest-card--completed" : ""}`}>
      <div className="quest-card__top">
        <div className="quest-card__info">
          <div className="quest-card__name">
            {quest.is_completed && (
              <CheckIcon style={{ width: 16, height: 16, color: "#10B981", marginRight: 6, verticalAlign: "middle" }} />
            )}
            {t(quest.description_ru, quest.description_en)}
          </div>
          <div className="quest-card__reward">
            +{quest.reward_coins} <CoinIcon style={{ width: 12, height: 12, color: "#facc15", verticalAlign: "middle" }} />
          </div>
        </div>
        {!quest.is_completed && rerollAvailable && (
          <button
            className="quest-card__reroll"
            onClick={() => onReroll(quest.id)}
            disabled={rerolling}
            title={t(`\u041f\u0435\u0440\u0435\u0431\u0440\u043e\u0441\u0438\u0442\u044c (${rerollCost})`, `Reroll (${rerollCost})`)}
          >
            <RefreshIcon style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>
      {!quest.is_completed && (
        <div className="quest-card__progress">
          <div className="quest-card__progress-bar">
            <div
              className="quest-card__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="quest-card__progress-text">
            {quest.progress}/{quest.target_value}
          </span>
        </div>
      )}
    </div>
  );
}
