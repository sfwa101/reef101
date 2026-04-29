import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import BackHeader from "@/components/BackHeader";
import ProductCard from "@/components/ProductCard";
import { storeThemes, type StoreThemeKey } from "@/lib/storeThemes";
import type { Product } from "@/lib/products";
import { Search } from "lucide-react";
import {
  groupBySupermarketTaxonomy,
  groupForSub,
  supermarketTaxonomy,
} from "@/lib/supermarketTaxonomy";
import { volumeDealFor } from "@/lib/volumeDeals";

interface DualNavStoreProps {
  themeKey: StoreThemeKey;
  title: string;
  subtitle: string;
  hero?: ReactNode;
  intro?: ReactNode;
  searchPlaceholder?: string;
  products: Product[];
}

const HEADER_OFFSET = 56;
const MAIN_BAR = 48;
const SUB_BAR = 42;
const STICKY_TOTAL = HEADER_OFFSET + MAIN_BAR + SUB_BAR + 8;

const DualNavStore = ({
  themeKey,
  title,
  subtitle,
  hero,
  intro,
  searchPlaceholder = "ابحث في السوبرماركت…",
  products,
}: DualNavStoreProps) => {
  const theme = storeThemes[themeKey];
  const [query, setQuery] = useState("");
  const [activeSub, setActiveSub] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const mainBarRef = useRef<HTMLDivElement>(null);
  const subBarRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(
    () => groupBySupermarketTaxonomy(products, query),
    [products, query],
  );

  // Initialize active sub to first available
  useEffect(() => {
    if (!activeSub && grouped[0]?.subs[0]) {
      setActiveSub(grouped[0].subs[0].sub.id);
    }
  }, [grouped, activeSub]);

  // Active main group derived from active sub
  const activeGroup = useMemo(
    () => groupForSub(activeSub) ?? supermarketTaxonomy[0],
    [activeSub],
  );

  // Subs of the currently active group (only those that exist in current grouped output)
  const visibleSubs = useMemo(() => {
    const g = grouped.find((x) => x.group.id === activeGroup.id);
    return g?.subs.map((s) => s.sub) ?? [];
  }, [grouped, activeGroup]);

  // ScrollSpy: pick the lowest sub-section whose top has crossed the trigger line
  useEffect(() => {
    const onScroll = () => {
      const trigger = STICKY_TOTAL + 12;
      let current = activeSub;
      for (const g of grouped) {
        for (const { sub } of g.subs) {
          const el = sectionRefs.current[sub.id];
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          if (top - trigger <= 0) current = sub.id;
          else {
            if (current) {
              setActiveSub(current);
              return;
            }
          }
        }
      }
      if (current) setActiveSub(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [grouped, activeSub]);

  // Auto-center active chips
  useEffect(() => {
    mainBarRef.current
      ?.querySelector<HTMLButtonElement>(`[data-main="${activeGroup.id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeGroup]);
  useEffect(() => {
    subBarRef.current
      ?.querySelector<HTMLButtonElement>(`[data-sub="${activeSub}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSub]);

  const jumpToSub = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - STICKY_TOTAL;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const jumpToGroup = (groupId: string) => {
    const g = grouped.find((x) => x.group.id === groupId);
    if (g?.subs[0]) jumpToSub(g.subs[0].sub.id);
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

      {/* Sticky DUAL nav — main rail + sub rail */}
      <div className="fixed inset-x-0 z-30" style={{ top: `${HEADER_OFFSET}px` }}>
        <div className="mx-auto max-w-md">
          {/* Main rail */}
          <div
            className="px-3 pt-2 pb-1.5"
            style={{
              background: `hsl(var(--card) / 0.98)`,
              backdropFilter: "saturate(180%) blur(24px)",
              WebkitBackdropFilter: "saturate(180%) blur(24px)",
            }}
          >
            <div ref={mainBarRef} className="-mx-3 flex gap-1.5 overflow-x-auto px-3 no-scrollbar">
              {supermarketTaxonomy.map((g) => {
                const isActive = g.id === activeGroup.id;
                const enabled = grouped.some((x) => x.group.id === g.id);
                return (
                  <button
                    key={g.id}
                    data-main={g.id}
                    onClick={() => enabled && jumpToGroup(g.id)}
                    disabled={!enabled}
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-extrabold transition ease-apple ${
                      enabled ? "" : "opacity-35"
                    } ${isActive ? "shadow-pill" : "bg-foreground/5 text-foreground/80"}`}
                    style={
                      isActive
                        ? {
                            background: `hsl(${g.color.tint})`,
                            color: `hsl(${g.color.hue})`,
                            boxShadow: `0 6px 18px -10px hsl(${g.color.hue} / 0.55)`,
                          }
                        : undefined
                    }
                  >
                    <span aria-hidden className="text-[13px] leading-none">{g.emoji}</span>
                    <span>{g.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub rail */}
          <div
            className="px-3 py-1.5"
            style={{
              background: `hsl(var(--background) / 0.95)`,
              backdropFilter: "saturate(180%) blur(20px)",
              WebkitBackdropFilter: "saturate(180%) blur(20px)",
              boxShadow: "0 8px 18px -14px rgba(0,0,0,0.22)",
              borderBottom: `1px solid hsl(${activeGroup.color.ring} / 0.45)`,
            }}
          >
            <div ref={subBarRef} className="-mx-3 flex gap-3 overflow-x-auto px-3 no-scrollbar">
              {visibleSubs.length === 0 ? (
                <span className="py-1.5 text-[11px] text-muted-foreground">لا توجد منتجات</span>
              ) : (
                visibleSubs.map((s) => {
                  const isActive = s.id === activeSub;
                  return (
                    <button
                      key={s.id}
                      data-sub={s.id}
                      onClick={() => jumpToSub(s.id)}
                      className="relative shrink-0 py-1 text-[12px] font-bold transition ease-apple"
                      style={{
                        color: isActive ? `hsl(${activeGroup.color.hue})` : `hsl(var(--muted-foreground))`,
                      }}
                    >
                      {s.name}
                      <span
                        className="absolute -bottom-0.5 left-0 right-0 mx-auto h-[3px] w-3/4 rounded-full transition-all"
                        style={{
                          background: isActive ? `hsl(${activeGroup.color.hue})` : "transparent",
                        }}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer so first section isn't hidden under the dual rail */}
      <div style={{ height: MAIN_BAR + SUB_BAR + 12 }} />

      {/* Sections — flat list of all subs grouped under their main group */}
      <div className="space-y-8">
        {grouped.map((g) => (
          <div key={g.group.id} className="space-y-5">
            {/* Group header tile */}
            <div
              className="rounded-2xl px-4 py-3 shadow-soft"
              style={{
                background: `linear-gradient(135deg, hsl(${g.group.color.tint}), hsl(${g.group.color.tint} / 0.6))`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>{g.group.emoji}</span>
                <h2
                  className="font-display text-lg font-extrabold"
                  style={{ color: `hsl(${g.group.color.hue})` }}
                >
                  {g.group.name}
                </h2>
              </div>
            </div>

            {g.subs.map(({ sub, items }) => (
              <section
                key={sub.id}
                ref={(el) => { sectionRefs.current[sub.id] = el; }}
                style={{ scrollMarginTop: STICKY_TOTAL }}
              >
                <h3 className="mb-3 flex items-center gap-2 px-1 text-base font-extrabold text-foreground">
                  <span
                    className="inline-block h-3 w-1 rounded-full"
                    style={{ background: `hsl(${g.group.color.hue})` }}
                  />
                  {sub.name}
                  <span className="text-[10px] font-medium text-muted-foreground">
                    · {items.length}
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((p) => (
                    <ProductCard
                      key={`${sub.id}-${p.id}`}
                      product={p}
                      volumeBadge={volumeDealFor(p) ?? undefined}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="rounded-2xl bg-foreground/5 p-6 text-center text-xs text-muted-foreground">
            لا توجد نتائج للبحث
          </p>
        )}
        <div style={{ height: "60vh" }} />
      </div>
    </div>
  );
};

export default DualNavStore;
