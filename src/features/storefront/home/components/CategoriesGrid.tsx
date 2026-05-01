/**
 * CategoriesGrid — sticky horizontal pill row for category navigation.
 * Pure presentational; controlled by `useHomeOrchestrator`.
 */
import { CATS } from "../data";
import type { CatId } from "../types";

export const CategoriesGrid = ({
  cat,
  setCat,
  hue,
}: {
  cat: CatId;
  setCat: (c: CatId) => void;
  hue: string;
}) => (
  <section
    className="sticky top-[64px] lg:top-[80px] z-30 mt-3 border-y border-border/40 bg-background/85 backdrop-blur"
    style={{ contain: "layout paint" }}
  >
    <div className="-mx-1 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CATS.map((c) => {
        const Icon = c.icon;
        const active = cat === c.id;
        return (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-extrabold transition active:scale-95 ${
              active
                ? "text-white shadow-pill"
                : "bg-card text-foreground ring-1 ring-border/60"
            }`}
            style={active ? { background: `hsl(${hue})` } : undefined}
          >
            <Icon className="h-3.5 w-3.5" />
            {c.name}
          </button>
        );
      })}
    </div>
  </section>
);
