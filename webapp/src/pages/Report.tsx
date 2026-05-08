import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type GameReportOut } from "../api";
import { CoinIcon, FireIcon, CheckIcon, TargetIcon } from "../icons";
import { useT } from "../i18n";

export function ReportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [report, setReport] = useState<GameReportOut | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const data = await api.gameReport(p);
      setReport(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  return (
    <div className="page pet-page">
      <div className="page-header">
        <div className="page-header__stack">
          <h1>{t("\u041E\u0442\u0447\u0451\u0442", "Report")}</h1>
          <p className="page-header__date">
            {report
              ? `${report.period_start} \u2014 ${report.period_end}`
              : t("\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026", "Loading\u2026")}
          </p>
        </div>
        <button className="pet-back-btn" onClick={() => navigate(-1)}>
          {t("\u041D\u0430\u0437\u0430\u0434", "Back")}
        </button>
      </div>

      {/* Period selector */}
      <div className="report-period">
        <button
          className={`report-period__btn ${period === "week" ? "report-period__btn--active" : ""}`}
          onClick={() => setPeriod("week")}
        >
          {t("\u041D\u0435\u0434\u0435\u043B\u044F", "Week")}
        </button>
        <button
          className={`report-period__btn ${period === "month" ? "report-period__btn--active" : ""}`}
          onClick={() => setPeriod("month")}
        >
          {t("\u041C\u0435\u0441\u044F\u0446", "Month")}
        </button>
      </div>

      {loading && (
        <div className="spinner">{t("\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026", "Loading\u2026")}</div>
      )}

      {!loading && report && (
        <>
          {/* Main stats grid */}
          <div className="report-grid">
            <div className="report-card report-card--accent">
              <div className="report-card__icon">
                <CheckIcon style={{ width: 20, height: 20, color: "var(--tb-accent-strong)" }} />
              </div>
              <div className="report-card__value">{report.tasks_completed}</div>
              <div className="report-card__label">
                {t("\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E", "Completed")}
              </div>
            </div>

            <div className="report-card">
              <div className="report-card__icon">
                <TargetIcon style={{ width: 20, height: 20, color: "#f97316" }} />
              </div>
              <div className="report-card__value">{report.tasks_on_time}</div>
              <div className="report-card__label">
                {t("\u0412\u043E\u0432\u0440\u0435\u043C\u044F", "On time")}
              </div>
            </div>

            <div className="report-card">
              <div className="report-card__icon">
                <FireIcon style={{ width: 20, height: 20, color: "#ef4444" }} />
              </div>
              <div className="report-card__value">{report.tasks_high_priority}</div>
              <div className="report-card__label">
                {t("\u0412\u0430\u0436\u043D\u044B\u0435", "High priority")}
              </div>
            </div>

            <div className="report-card">
              <div className="report-card__icon">
                <CoinIcon style={{ width: 20, height: 20, color: "#facc15" }} />
              </div>
              <div className="report-card__value">{report.total_coins}</div>
              <div className="report-card__label">
                {t("\u041C\u043E\u043D\u0435\u0442 \u0432\u0441\u0435\u0433\u043E", "Total coins")}
              </div>
            </div>
          </div>

          {/* Summary section */}
          <div className="report-summary">
            <div className="report-summary__row">
              <span className="report-summary__label">
                {t("\u0421\u043E\u0437\u0434\u0430\u043D\u043E \u0437\u0430\u0434\u0430\u0447", "Tasks created")}
              </span>
              <span className="report-summary__value">{report.tasks_created}</span>
            </div>
            <div className="report-summary__row">
              <span className="report-summary__label">
                {t("\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0441\u0442\u0440\u0438\u043A", "Current streak")}
              </span>
              <span className="report-summary__value">
                {report.current_streak} {t("\u0434\u043D.", "d")}
              </span>
            </div>
            <div className="report-summary__row">
              <span className="report-summary__label">
                {t("\u0418\u0434\u0435\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u043D\u0435\u0439", "Perfect days")}
              </span>
              <span className="report-summary__value">{report.perfect_days_total}</span>
            </div>
            <div className="report-summary__row">
              <span className="report-summary__label">
                {t("\u0412\u0441\u0435\u0433\u043E \u0437\u0430\u0434\u0430\u0447", "Total tasks")}
              </span>
              <span className="report-summary__value">{report.tasks_completed_total}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
