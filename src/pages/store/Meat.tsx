import { useEffect, useMemo, useRef, useState } from "react";
import BackHeader from "@/components/BackHeader";
import ProductCard from "@/components/ProductCard";
import { products, useProductsVersion } from "@/lib/products";
import { storeThemes } from "@/lib/storeThemes";
import { Search } from "lucide-react";

/**
 * Dual-tier sticky navigation:
 *   - Tier 1 (main): wide buttons for top-level groups
 *   - Tier 2 (sub):  horizontal scroller of subCategories of the active group
 * Both tiers stay pinned under the global header. Tier 2 morphs based on
 * Tier 1 selection. ScrollSpy keeps both in sync as the user scrolls.
 */

type SubKey = string;
type MainGroup = {
  id: string;
  name: string;
  /** which product.subCategory values fall into this group */
  subs: { id: SubKey; label: string }[];
};

const groups: MainGroup[] = [
  {
    id: "red",
    name: "لحوم حمراء",
    subs: [
      { id: "all-red", label: "الكل" },
      { id: "بتلو",    label: "بتلو" },
      { id: "ضأن",     label: "ضأن" },
      { id: "كندوز",   label: "كندوز" },
      { id: "مفروم",   label: "مفروم" },
    ],
  },
  {
    id: "poultry",
    name: "دواجن",
    subs: [
      { id: "all-poultry", label: "الكل" },
      { id: "بلدي",         label: "بلدي" },
      { id: "صدور",         label: "صدور" },
      { id: "أوراك",         label: "أوراك" },
      { id: "بط وأرانب",      label: "بط وأرانب" },
    ],
  },
  {
    id: "fish",
    name: "أسماك وبحريات",
    subs: [
      { id: "all-fish", label: "الكل" },
      { id: "بحري",      label: "بحري" },
      { id: "مزارع",     label: "مزارع" },
      { id: "فيليه",     label: "فيليه" },
      { id: "بحريات",    label: "بحريات" },
    ],
  },
  {
    id: "frozen",
    name: "مجمدات",
    subs: [
      { id: "all-frozen", label: "الكل" },
      { id: "خضار",         label: "خضار مجمدة" },
      { id: "وجبات",        label: "وجبات سريعة" },
    ],
  },
];

/** Map each product to its main group based on subCategory */
const groupOf = (sub?: string): string => {
  if (!sub) return "red";
  if (sub === "لحوم حمراء" || sub === "مفرومات") return "red";
  if (sub === "دواجن") return "poultry";
  if (sub === "أسماك" || sub === "بحريات") return "fish";
  if (sub === "مجمدات") return "frozen";
  return "red";
};

const HEADER_OFFSET = 56;
const TIER1 = 52;
const TIER2 = 44;
const TRIGGER = 14;

const Meat = () => {
  useProductsVersion();
  const theme = storeThemes.meat;
  const meatProducts = useMemo(
    () => products.filter((p) => p.source === "meat"),
    [],
  );

  const [activeMain, setActiveMain] = useState(groups[0].id);
  const [activeSub, setActiveSub] = useState(groups[0].subs[0].id);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});
  const tier2Ref = useRef<HTMLDivElement>(null);

  const currentGroup = groups.find((g) => g.id === activeMain) ?? groups[0];

  // ScrollSpy: track both main group and active sub-section across the
  // single continuous feed (Intersection-style via scroll position).
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const triggerY = HEADER_OFFSET + TIER1 + TIER2 + TRIGGER;

      // Pick active main group based on which group block is currently under the bar
      let mainId = groups[0].id;
      for (const g of groups) {
        const el = groupRefs.current[g.id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - triggerY <= 0) mainId = g.id;
        else break;
      }
      setActiveMain((prev) => (prev !== mainId ? mainId : prev));

      const grp = groups.find((g) => g.id === mainId) ?? groups[0];
      let current = grp.subs[0].id;
      for (const s of grp.subs) {
        const el = sectionRefs.current[s.id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - triggerY <= 0) current = s.id;
        else break;
      }
      setActiveSub(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-center active sub chip
  useEffect(() => {
    tier2Ref.current
      ?.querySelector<HTMLButtonElement>(`[data-sub="${activeSub}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSub]);

  const jumpToSub = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top =
      el.getBoundingClientRect().top + window.scrollY -
      (HEADER_OFFSET + TIER1 + TIER2 + 8);
    window.scrollTo({ top, behavior: "smooth" });
  };

  const jumpToGroup = (id: string) => {
    const el = groupRefs.current[id];
    if (!el) return;
    const top =
      el.getBoundingClientRect().top + window.scrollY -
      (HEADER_OFFSET + TIER1 + TIER2 + 8);
    window.scrollTo({ top, behavior: "smooth" });
  };

  // Build the continuous feed: all groups, each with its sub-sections.
  const feed = useMemo(() => {
    const q = query.trim();
    return groups.map((g) => {
      const items = meatProducts
        .filter((p) => groupOf(p.subCategory) === g.id)
        .filter((p) => !q || p.name.includes(q));
      const subs = g.subs.map((s) => ({
        ...s,
        items: items.filter((p) =>
          s.id.startsWith("all-")
            ? true
            : (p.name + " " + (p.subCategory ?? "")).includes(s.id),
        ),
      }));
      return { ...g, items, subs };
    });
  }, [meatProducts, query]);

  return (
    <div>
      <BackHeader
        title="اللحوم والمجمدات"
        subtitle="طازجة بأعلى معايير الجودة والسلامة"
        accent="متجر"
        themeKey="meat"
      />

      {/* Hero */}
      <section
        className="mt-3 rounded-[2rem] p-5 shadow-tile"
        style={{ background: theme.gradient }}
      >
        <span className="text-[10px] font-bold text-foreground/80">قطّع كما تحب</span>
        <h2 className="font-display text-2xl font-extrabold text-foreground">
          طازج اليوم
        </h2>
        <p className="mt-1 text-xs text-foreground/70">
          يصلك مبرّداً بعربات مجهّزة
        </p>
      </section>

      {/* Search */}
      <div className="glass mb-4 mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.4} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في اللحوم والمجمدات…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Dual-tier sticky nav */}
      <div className="fixed inset-x-0 z-30" style={{ top: `${HEADER_OFFSET}px` }}>
        <div
          className={`mx-auto max-w-md transition-shadow duration-300 ${
            scrolled ? "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]" : "shadow-none"
          }`}
          style={{
            background: `hsl(var(--card) / 0.96)`,
            backdropFilter: "saturate(180%) blur(24px)",
            WebkitBackdropFilter: "saturate(180%) blur(24px)",
            borderBottom: "1px solid hsl(var(--border) / 0.5)",
          }}
        >
          {/* Tier 1 — main groups */}
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            {groups.map((g) => {
              const active = g.id === activeMain;
              return (
                <button
                  key={g.id}
                  onClick={() => jumpToGroup(g.id)}
                  className={`rounded-xl px-2 py-2 text-[11px] font-extrabold transition ease-apple ${
                    active
                      ? "text-white shadow-pill"
                      : "bg-foreground/5 text-foreground"
                  }`}
                  style={active ? { background: `hsl(${theme.hue})` } : undefined}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
          {/* Tier 2 — subcategories */}
          <div
            ref={tier2Ref}
            className="flex gap-2 overflow-x-auto border-t border-border/40 px-3 py-2 no-scrollbar"
          >
            {currentGroup.subs.map((s) => {
              const active = s.id === activeSub;
              return (
                <button
                  key={s.id}
                  data-sub={s.id}
                  onClick={() => jumpToSub(s.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1 text-[11px] font-bold transition ease-apple ${
                    active
                      ? "bg-foreground text-background shadow-pill"
                      : "bg-foreground/5 text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer for the dual sticky bars */}
      <div style={{ height: TIER1 + TIER2 + 16 }} />

      {/* Continuous feed — all main groups stacked, ScrollSpy switches tiers */}
      <div className="space-y-10">
        {feed.map((g) => (
          <div
            key={g.id}
            ref={(el) => {
              groupRefs.current[g.id] = el;
            }}
            data-group={g.id}
            style={{ scrollMarginTop: HEADER_OFFSET + TIER1 + TIER2 + 8 }}
          >
            <h2 className="mb-4 flex items-center gap-2 px-1 font-display text-2xl font-extrabold text-foreground">
              <span className="inline-block h-6 w-1.5 rounded-full" style={{ background: `hsl(${theme.hue})` }} />
              {g.name}
              <span className="text-xs font-bold text-muted-foreground">· {g.items.length}</span>
            </h2>

            <div className="space-y-8">
              {g.subs.map((s) => (
                <section
                  key={`${g.id}-${s.id}`}
                  ref={(el) => {
                    sectionRefs.current[s.id] = el;
                  }}
                  data-sub-section={s.id}
                  style={{ scrollMarginTop: HEADER_OFFSET + TIER1 + TIER2 + 8 }}
                >
                  <h3 className="mb-3 px-1 font-display text-base font-extrabold text-foreground/90">
                    {s.label}{" "}
                    <span className="text-xs text-muted-foreground">· {s.items.length}</span>
                  </h3>
                  {s.items.length === 0 ? (
                    <p className="rounded-2xl bg-foreground/5 p-6 text-center text-xs text-muted-foreground">
                      لا توجد منتجات في هذا القسم بعد
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {s.items.map((p) => (
                        <ProductCard key={`${s.id}-${p.id}`} product={p} />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: "60vh" }} />
      </div>
    </div>
  );
};

export default Meat;