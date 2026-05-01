/**
 * CompareBar — floating "compare items" tray. Auto-hides when empty.
 * Verbatim extraction.
 */
import { Link } from "@tanstack/react-router";
import { Scale, X } from "lucide-react";

import { useCompare } from "@/context/CompareContext";
import { toLatin } from "@/lib/format";

export const CompareBar = () => {
  const compare = useCompare();
  if (compare.items.length === 0) return null;
  return (
    <div className="fixed bottom-[88px] left-4 right-4 z-40 mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl bg-foreground/95 px-3 py-2.5 shadow-2xl ring-1 ring-foreground/30 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2 rtl:space-x-reverse">
          {compare.items.slice(0, 3).map((it) => (
            <img
              key={it.id}
              src={it.image}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-foreground"
            />
          ))}
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-extrabold text-background">
            مقارنة {toLatin(compare.items.length)} منتجات
          </p>
          <p className="text-[9.5px] text-background/70">
            حتى {toLatin(compare.max)} منتجات
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={compare.clear}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-background/15 text-background"
          aria-label="مسح المقارنة"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <Link
          to="/store/home-compare"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-pill"
        >
          <Scale className="h-3.5 w-3.5" />
          قارن الآن
        </Link>
      </div>
    </div>
  );
};
