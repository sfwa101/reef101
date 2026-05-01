/**
 * SearchAndFilters — search input, filter trigger, fulfillment chip row,
 * and the active-sort indicator chip. Behaviourally identical to the
 * inline block previously in `pages/store/Home.tsx`.
 */
import {
  ArrowUpDown,
  CalendarClock,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";

import { SORTS } from "../data";
import type { FulfillmentFilter, SortId } from "../types";

export const SearchAndFilters = ({
  q,
  setQ,
  filtersActive,
  onOpenFilters,
  fulFilter,
  setFulFilter,
  sort,
  setSort,
  hue,
}: {
  q: string;
  setQ: (q: string) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
  fulFilter: FulfillmentFilter;
  setFulFilter: (f: FulfillmentFilter) => void;
  sort: SortId;
  setSort: (s: SortId) => void;
  hue: string;
}) => (
  <section className="px-4 pt-3">
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن جهاز، أداة، علامة تجارية…"
          className="h-11 w-full rounded-2xl bg-card pe-10 ps-4 text-[13px] font-medium shadow-soft ring-1 ring-border/60 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2"
          style={{ ["--tw-ring-color" as string]: `hsl(${hue} / 0.4)` }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="مسح"
            className="absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-foreground/5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <button
        onClick={onOpenFilters}
        className={`relative flex h-11 shrink-0 items-center gap-1 rounded-2xl px-3.5 text-[12px] font-extrabold shadow-soft ring-1 transition active:scale-95 ${
          filtersActive
            ? "text-white ring-transparent"
            : "bg-card text-foreground ring-border/60"
        }`}
        style={filtersActive ? { background: `hsl(${hue})` } : undefined}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        تصفية
        {filtersActive && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-extrabold text-amber-950">
            ●
          </span>
        )}
      </button>
    </div>

    {/* Quick fulfillment chips */}
    <div className="mt-2 flex flex-wrap gap-1.5">
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
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10.5px] font-extrabold transition active:scale-95 ${
              active
                ? opt.id === "instant"
                  ? "bg-emerald-600 text-white"
                  : opt.id === "preorder"
                    ? "bg-gradient-to-l from-amber-500 to-amber-600 text-white"
                    : "bg-foreground text-background"
                : "bg-card text-foreground ring-1 ring-border/60"
            }`}
          >
            {opt.id === "instant" && <Truck className="h-3 w-3" />}
            {opt.id === "preorder" && <CalendarClock className="h-3 w-3" />}
            {opt.label}
          </button>
        );
      })}
      {sort !== "relevance" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-3 py-1 text-[10.5px] font-extrabold text-foreground">
          <ArrowUpDown className="h-3 w-3" />
          {SORTS.find((s) => s.id === sort)?.label}
          <button
            onClick={() => setSort("relevance")}
            aria-label="إلغاء الفرز"
            className="ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
    </div>
  </section>
);
