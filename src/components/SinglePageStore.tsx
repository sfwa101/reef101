import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import BackHeader from "@/components/BackHeader";
import ProductCard from "@/components/ProductCard";
import { storeThemes, type StoreThemeKey } from "@/lib/storeThemes";
import type { Product } from "@/lib/products";
import { Search } from "lucide-react";

export type StoreCategory = {
  /** unique id used for scroll-spy */
  id: string;
  /** display label on the chip & section heading */
  name: string;
  /** filter predicate against the merged product list */
  match: (p: Product) => boolean;
};

interface SinglePageStoreProps {
  themeKey: StoreThemeKey;
  title: string;
  subtitle: string;
  hero?: ReactNode;
  intro?: ReactNode;          // optional services/categories block above products
  searchPlaceholder?: string;
  products: Product[];
  categories: StoreCategory[];
}

const HEADER_OFFSET = 56;     // matches new TopBar height
const BAR_HEIGHT = 48;        // single sticky cat bar
const TRIGGER_BUFFER = 18;

/**
 * Shared single-page store template:
 *  - Static top header (handled globally)
 *  - Hero / intro section that scrolls normally
 *  - Sticky category chip bar that pins under the global header
 *  - All products visible on one page; tap a chip to scroll to that section
 */
const SinglePageStore = ({
  themeKey, title, subtitle, hero, intro, searchPlaceholder = "ابحث…",
  products, categories,
}: SinglePageStoreProps) => {
  const theme = storeThemes[themeKey];
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const barRef = useRef<HTMLDivElement>(null);

  // Filter & group products
  const groups = useMemo(() => {
    const q = query.trim();
    return categories.map((c) => ({
      ...c,
      items: products
        .filter(c.match)
        .filter((p) => !q || p.name.includes(q) || (p.brand ?? "").includes(q)),
    }));
  }, [categories, products, query]);

  // Scroll-spy — throttled with requestAnimationFrame so we run at most once
  // per frame even when the user flings the page on a low-end phone.
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const trigger = HEADER_OFFSET + BAR_HEIGHT + TRIGGER_BUFFER;
      let current = categories[0]?.id ?? "";
      for (const c of categories) {
        const el = sectionRefs.current[c.id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - trigger <= 0) current = c.id;
        else break;
      }
      setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories]);

  // Auto-center active chip
  useEffect(() => {
    barRef.current?.querySelector<HTMLButtonElement>(`[data-cat="${active}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  const jumpTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - (HEADER_OFFSET + BAR_HEIGHT + 8);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div>
      <BackHeader title={title} subtitle={subtitle} accent="متجر" themeKey={themeKey} />

      {hero}

      {/* Search */}
      <div className="glass mb-3 mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.4} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {intro}

      {/* Sticky category chip bar — pinned right below the global header.
          Solid background (no backdrop-filter) keeps scroll smooth on low-end devices. */}
      <div
        className="fixed inset-x-0 z-30"
        style={{ top: `${HEADER_OFFSET}px`, contain: "layout paint" }}
      >
        <div
          className="mx-auto max-w-md px-4 py-2"
          style={{
            background: "hsl(var(--card))",
            borderBottom: "1px solid hsl(var(--border) / 0.5)",
          }}
        >
          <div ref={barRef} className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {categories.map((c) => {
              const isActive = c.id === active;
              return (
                <button
                  key={c.id}
                  data-cat={c.id}
                  onClick={() => jumpTo(c.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    isActive ? "text-primary-foreground shadow-pill" : "bg-foreground/5 text-foreground"
                  }`}
                  style={isActive ? { background: `hsl(${theme.hue})` } : undefined}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer so the first section isn't covered by the sticky bar */}
      <div style={{ height: BAR_HEIGHT + 8 }} />

      {/* Sections */}
      <div className="space-y-8">
        {groups.map((g) => (
          <section
            key={g.id}
            ref={(el) => { sectionRefs.current[g.id] = el; }}
            data-cat-id={g.id}
            // `content-visibility: auto` lets the browser skip rendering
            // off-screen sections — massive saving on long product lists.
            style={{
              scrollMarginTop: HEADER_OFFSET + BAR_HEIGHT + 8,
              contentVisibility: "auto",
              containIntrinsicSize: "1px 1200px",
            }}
          >
            <h2 className="mb-3 px-1 font-display text-xl font-extrabold text-foreground">
              {g.name} <span className="text-xs text-muted-foreground">· {g.items.length}</span>
            </h2>
            {g.items.length === 0 ? (
              <p className="rounded-2xl bg-foreground/5 p-6 text-center text-xs text-muted-foreground">
                لا توجد منتجات في هذا القسم بعد
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {g.items.map((p) => <ProductCard key={`${g.id}-${p.id}`} product={p} />)}
              </div>
            )}
          </section>
        ))}
        {/* Tail spacer so the last section can reach the trigger line */}
        <div style={{ height: "60vh" }} />
      </div>
    </div>
  );
};

export default SinglePageStore;
