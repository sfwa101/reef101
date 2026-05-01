/**
 * FiltersSheet — bottom-sheet for sort + price + fulfillment filters.
 * Verbatim extraction. Locks body scroll for the lifetime of the sheet.
 */
import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

import { toLatin } from "@/lib/format";

import { SORTS } from "../data";
import type { FulfillmentFilter, SortId } from "../types";

export const FiltersSheet = ({
  sort,
  setSort,
  priceMax,
  setPriceMax,
  priceMaxAvail,
  fulFilter,
  setFulFilter,
  onClose,
  onReset,
  hue,
}: {
  sort: SortId;
  setSort: (s: SortId) => void;
  priceMax: number;
  setPriceMax: (n: number) => void;
  priceMaxAvail: number;
  fulFilter: FulfillmentFilter;
  setFulFilter: (f: FulfillmentFilter) => void;
  onClose: () => void;
  onReset: () => void;
  hue: string;
}) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-t-[28px] bg-background p-4 shadow-2xl ring-1 ring-border/60 animate-in slide-in-from-bottom-8"
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="font-display text-lg font-extrabold">تصفية وفرز</h2>
          <button
            onClick={onReset}
            className="text-[11px] font-extrabold text-primary"
          >
            مسح
          </button>
        </div>

        <p className="text-[11px] font-extrabold text-foreground/70">
          طريقة التسليم
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { id: "all" as const, label: "الكل" },
            { id: "instant" as const, label: "تسليم فوري" },
            { id: "preorder" as const, label: "حجز مسبق" },
          ].map((opt) => {
            const active = fulFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFulFilter(opt.id)}
                className={`rounded-2xl py-2.5 text-[11px] font-extrabold transition active:scale-95 ${
                  active
                    ? "text-white shadow-pill"
                    : "bg-card text-foreground ring-1 ring-border/60"
                }`}
                style={active ? { background: `hsl(${hue})` } : undefined}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] font-extrabold text-foreground/70">
          الحد الأقصى للسعر: {toLatin(priceMax.toLocaleString("en-US"))} ج.م
        </p>
        <input
          type="range"
          min={500}
          max={priceMaxAvail}
          step={500}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="mt-2 w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{toLatin("500")} ج.م</span>
          <span>{toLatin(priceMaxAvail.toLocaleString("en-US"))} ج.م</span>
        </div>

        <p className="mt-4 text-[11px] font-extrabold text-foreground/70">
          الفرز
        </p>
        <div className="mt-2 flex flex-col gap-1.5">
          {SORTS.map((s) => {
            const active = sort === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] font-extrabold transition active:scale-[0.99] ${
                  active
                    ? "bg-primary text-primary-foreground shadow-pill"
                    : "bg-card text-foreground ring-1 ring-border/60"
                }`}
              >
                <span>{s.label}</span>
                {active && <CheckCircle2 className="h-4 w-4" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 h-12 w-full rounded-2xl bg-foreground text-[13px] font-extrabold text-background shadow-pill"
        >
          عرض النتائج
        </button>
      </div>
    </div>
  );
};
