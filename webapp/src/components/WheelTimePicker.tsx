import { useCallback, useEffect, useRef } from "react";

import { haptic } from "../telegram";

interface WheelTimePickerProps {
  hours: number;
  minutes: number;
  onChange: (h: number, m: number) => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const HALF = Math.floor(VISIBLE_ITEMS / 2);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function WheelTimePicker({ hours, minutes, onChange }: WheelTimePickerProps) {
  return (
    <div className="wtp">
      <div className="wtp__highlight" />
      <WheelColumn
        items={HOURS}
        value={hours}
        onChange={(h) => onChange(h, minutes)}
        format={pad}
      />
      <div className="wtp__separator">:</div>
      <WheelColumn
        items={MINUTES}
        value={minutes}
        onChange={(m) => onChange(hours, m)}
        format={pad}
      />
    </div>
  );
}

interface WheelColumnProps {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}

function WheelColumn({ items, value, onChange, format }: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const rafRef = useRef(0);
  const lastHapticRef = useRef(-1);

  const scrollToValue = useCallback(
    (v: number, smooth = false) => {
      const el = containerRef.current;
      if (!el) return;
      const idx = items.indexOf(v);
      if (idx < 0) return;
      const top = idx * ITEM_HEIGHT;
      el.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
    },
    [items]
  );

  useEffect(() => {
    scrollToValue(value);
  }, []);

  useEffect(() => {
    if (!isScrollingRef.current) {
      scrollToValue(value);
    }
  }, [value, scrollToValue]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;

    cancelAnimationFrame(rafRef.current);
    isScrollingRef.current = true;

    rafRef.current = requestAnimationFrame(() => {
      const scrollTop = el.scrollTop;
      const idx = Math.round(scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));

      if (clamped !== lastHapticRef.current) {
        lastHapticRef.current = clamped;
        haptic("light");
      }
    });
  }

  function handleScrollEnd() {
    const el = containerRef.current;
    if (!el) return;

    const scrollTop = el.scrollTop;
    const idx = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    const selectedValue = items[clamped];

    el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
    isScrollingRef.current = false;

    if (selectedValue !== value) {
      onChange(selectedValue);
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let scrollTimer: ReturnType<typeof setTimeout>;

    function onScroll() {
      handleScroll();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(handleScrollEnd, 100);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, items, onChange]);

  const paddingItems = HALF;

  return (
    <div
      className="wtp__col"
      ref={containerRef}
      style={{ height: VISIBLE_ITEMS * ITEM_HEIGHT }}
    >
      {/* top padding */}
      {Array.from({ length: paddingItems }, (_, i) => (
        <div key={`pt-${i}`} className="wtp__item wtp__item--pad" style={{ height: ITEM_HEIGHT }} />
      ))}
      {items.map((item) => {
        const isActive = item === value;
        return (
          <div
            key={item}
            className={`wtp__item ${isActive ? "wtp__item--active" : ""}`}
            style={{ height: ITEM_HEIGHT }}
            onClick={() => {
              onChange(item);
              scrollToValue(item, true);
            }}
          >
            {format(item)}
          </div>
        );
      })}
      {/* bottom padding */}
      {Array.from({ length: paddingItems }, (_, i) => (
        <div key={`pb-${i}`} className="wtp__item wtp__item--pad" style={{ height: ITEM_HEIGHT }} />
      ))}
    </div>
  );
}
