import { useMemo, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { haptic } from "../telegram";
import {
  RU_MONTHS,
  RU_WEEKDAYS_SHORT,
  addMonths,
  buildMonthGrid,
  fromISODate,
  isSameDay,
  startOfMonth,
  toISODate,
  todayISO,
} from "../utils/date";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (iso: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const selected = fromISODate(value || todayISO());
  const [monthAnchor, setMonthAnchor] = useState<Date>(() =>
    startOfMonth(selected)
  );

  const cells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

  const today = new Date();
  const todayStr = todayISO();

  const monthLabel = `${RU_MONTHS[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`;

  function selectDay(d: Date) {
    haptic("light");
    const iso = toISODate(d);
    onChange(iso);
    if (
      d.getMonth() !== monthAnchor.getMonth() ||
      d.getFullYear() !== monthAnchor.getFullYear()
    ) {
      setMonthAnchor(startOfMonth(d));
    }
  }

  function prevMonth() {
    haptic("light");
    setMonthAnchor((prev) => addMonths(prev, -1));
  }

  function nextMonth() {
    haptic("light");
    setMonthAnchor((prev) => addMonths(prev, 1));
  }

  function goToday() {
    haptic("light");
    onChange(todayStr);
    setMonthAnchor(startOfMonth(new Date()));
  }

  return (
    <div className="dp">
      <div className="dp__nav">
        <button type="button" className="dp__arrow" onClick={prevMonth}>
          <ChevronLeftIcon />
        </button>
        <button type="button" className="dp__month-label" onClick={goToday}>
          {monthLabel}
        </button>
        <button type="button" className="dp__arrow" onClick={nextMonth}>
          <ChevronRightIcon />
        </button>
      </div>

      <div className="dp__quick">
        <button
          type="button"
          className={`dp__quick-btn ${value === todayStr ? "dp__quick-btn--active" : ""}`}
          onClick={goToday}
        >
          Сегодня
        </button>
        <button
          type="button"
          className={`dp__quick-btn ${value === toISODate((() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()) ? "dp__quick-btn--active" : ""}`}
          onClick={() => {
            haptic("light");
            const d = new Date();
            d.setDate(d.getDate() + 1);
            const iso = toISODate(d);
            onChange(iso);
            setMonthAnchor(startOfMonth(d));
          }}
        >
          Завтра
        </button>
      </div>

      <div className="dp__weekdays">
        {RU_WEEKDAYS_SHORT.map((wd) => (
          <div key={wd} className="dp__wd">
            {wd}
          </div>
        ))}
      </div>

      <div className="dp__grid">
        {cells.map((d, i) => {
          const isCurrentMonth =
            d.getMonth() === monthAnchor.getMonth() &&
            d.getFullYear() === monthAnchor.getFullYear();
          const isSelected = isSameDay(d, selected);
          const isToday = isSameDay(d, today);

          return (
            <button
              key={i}
              type="button"
              className={[
                "dp__cell",
                !isCurrentMonth && "dp__cell--muted",
                isSelected && "dp__cell--selected",
                isToday && !isSelected && "dp__cell--today",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => selectDay(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
