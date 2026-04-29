import { useEffect, useRef, type UIEvent } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string; // YYYY-MM-DD or ""
  onChange: (iso: string) => void;
  minYear?: number;
  maxYear?: number;
};

const ITEM_H = 40; // px per row
const VISIBLE = 5; // odd: 5 rows visible, center = selected

const MONTHS_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

const pad = (n: number) => `${n}`.padStart(2, "0");

const daysInMonth = (year: number, month1: number) => new Date(year, month1, 0).getDate();

const Wheel = ({
  items,
  selectedIndex,
  onSelect,
  ariaLabel,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollTimer = useRef<number | null>(null);
  const programmatic = useRef(false);

  // Sync scroll to selectedIndex when it changes externally
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = selectedIndex * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 1) {
      programmatic.current = true;
      el.scrollTo({ top: target, behavior: "smooth" });
      window.setTimeout(() => { programmatic.current = false; }, 250);
    }
  }, [selectedIndex]);

  const handleScroll = (_e: UIEvent<HTMLDivElement>) => {
    if (programmatic.current) return;
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      // Snap exact
      const snapTo = clamped * ITEM_H;
      if (Math.abs(el.scrollTop - snapTo) > 1) {
        programmatic.current = true;
        el.scrollTo({ top: snapTo, behavior: "smooth" });
        window.setTimeout(() => { programmatic.current = false; }, 200);
      }
      if (clamped !== selectedIndex) onSelect(clamped);
    }, 90);
  };

  const padRows = Math.floor(VISIBLE / 2);
  const containerH = ITEM_H * VISIBLE;

  return (
    <div className="relative flex-1" aria-label={ariaLabel}>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="hide-scrollbar overflow-y-scroll snap-y snap-mandatory"
        style={{ height: containerH, scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: padRows * ITEM_H }} />
        {items.map((label, i) => {
          const active = i === selectedIndex;
          return (
            <div
              key={i}
              onClick={() => onSelect(i)}
              className={cn(
                "snap-center flex items-center justify-center text-center select-none cursor-pointer transition",
                active ? "text-foreground font-extrabold text-base" : "text-muted-foreground text-sm"
              )}
              style={{ height: ITEM_H }}
            >
              {label}
            </div>
          );
        })}
        <div style={{ height: padRows * ITEM_H }} />
      </div>
      {/* center highlight */}
      <div
        className="pointer-events-none absolute inset-x-1 rounded-xl bg-primary-soft/60 ring-1 ring-primary/20"
        style={{ top: padRows * ITEM_H, height: ITEM_H }}
      />
      {/* fade top/bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: padRows * ITEM_H,
          background: "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card)/0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: padRows * ITEM_H,
          background: "linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card)/0) 100%)",
        }}
      />
    </div>
  );
};

export const DateWheelPicker = ({ value, onChange, minYear = 1950, maxYear = new Date().getFullYear() }: Props) => {
  const today = new Date();
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  const year = parsed ? parsed.getFullYear() : today.getFullYear() - 25;
  const month = parsed ? parsed.getMonth() + 1 : today.getMonth() + 1;
  const day = parsed ? parsed.getDate() : 1;

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => `${maxYear - i}`); // newest first
  const months = MONTHS_AR;
  const dim = daysInMonth(year, month);
  const days = Array.from({ length: dim }, (_, i) => pad(i + 1));

  const yearIndex = Math.max(0, years.indexOf(`${year}`));
  const monthIndex = month - 1;
  const dayIndex = Math.min(day, dim) - 1;

  const emit = (y: number, m: number, d: number) => {
    const safeDay = Math.min(d, daysInMonth(y, m));
    onChange(`${y}-${pad(m)}-${pad(safeDay)}`);
  };

  return (
    <div dir="ltr" className="flex items-stretch gap-2 rounded-[1.2rem] bg-card p-2">
      {/* Year (newest first) */}
      <Wheel
        items={years}
        selectedIndex={yearIndex}
        onSelect={(i) => emit(parseInt(years[i], 10), month, day)}
        ariaLabel="السنة"
      />
      {/* Month */}
      <Wheel
        items={months}
        selectedIndex={monthIndex}
        onSelect={(i) => emit(year, i + 1, day)}
        ariaLabel="الشهر"
      />
      {/* Day */}
      <Wheel
        items={days}
        selectedIndex={dayIndex}
        onSelect={(i) => emit(year, month, i + 1)}
        ariaLabel="اليوم"
      />
    </div>
  );
};

export default DateWheelPicker;
