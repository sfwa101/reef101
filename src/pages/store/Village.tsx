import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import { products as allProducts, type Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/lib/favorites";
import {
  HEALTH_TAGS,
  TRUST_BADGE_META,
  villageMetaFor,
  type HealthTag,
} from "@/lib/villageMeta";
import { fmtMoney, toLatin } from "@/lib/format";
import TypewriterPlaceholder from "@/components/TypewriterPlaceholder";
import villageHero from "@/assets/village-hero.jpg";
import {
  Search,
  Heart,
  Plus,
  Minus,
  Sparkles,
  Repeat,
  ShieldCheck,
  Leaf,
  Check,
} from "lucide-react";

/* ---------------- Routine store (localStorage) ---------------- */

const ROUTINE_KEY = "reef-village-routines-v1";

type RoutineRecord = {
  productId: string;
  frequency: "weekly" | "biweekly";
  discountPct: number;
  createdAt: string;
};

const loadRoutines = (): RoutineRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    return raw ? (JSON.parse(raw) as RoutineRecord[]) : [];
  } catch {
    return [];
  }
};
const saveRoutines = (r: RoutineRecord[]) => {
  try { localStorage.setItem(ROUTINE_KEY, JSON.stringify(r)); } catch { /* */ }
};

/* ---------------- Page ---------------- */

const villageProducts = allProducts.filter((p) => p.source === "village");

const SUB_CATS: { id: string; label: string }[] = [
  { id: "all",     label: "الكل" },
  { id: "عسل ومربى",   label: "عسل ومربى" },
  { id: "ألبان بلدية", label: "ألبان بلدية" },
  { id: "مخللات",      label: "مخللات" },
];

const Village = () => {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<HealthTag | "all">("all");
  const [subCat, setSubCat] = useState<string>("all");
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);

  useEffect(() => { setRoutines(loadRoutines()); }, []);

  const items = useMemo(() => {
    const q = query.trim();
    return villageProducts.filter((p) => {
      if (subCat !== "all" && p.subCategory !== subCat) return false;
      if (q && !p.name.includes(q) && !(p.brand ?? "").includes(q)) return false;
      if (tag !== "all") {
        const meta = villageMetaFor(p.id);
        if (!meta || !meta.tags.includes(tag)) return false;
      }
      return true;
    });
  }, [query, tag, subCat]);

  const toggleRoutine = (productId: string, discountPct: number, frequency: "weekly" | "biweekly") => {
    const cur = loadRoutines();
    const exists = cur.find((r) => r.productId === productId);
    const next = exists
      ? cur.filter((r) => r.productId !== productId)
      : [...cur, { productId, frequency, discountPct, createdAt: new Date().toISOString() }];
    saveRoutines(next);
    setRoutines(next);
  };

  return (
    <div
      className="-mx-4 -my-4 px-4 py-4"
      style={{
        // Boutique cream/ivory background — overrides default surface.
        background: "linear-gradient(180deg, #FBF7EE 0%, #F5EFE0 100%)",
        minHeight: "100vh",
      }}
    >
      <BackHeader title="منتجات القرية" subtitle="بوتيك المزرعة الفاخر" accent="حصري" themeKey="village" />

      {/* Hero banner */}
      <section
        className="relative mt-3 overflow-hidden rounded-[1.75rem] shadow-tile"
        style={{ aspectRatio: "16/10" }}
      >
        <img
          src={villageHero}
          alt="من المزرعة إلى مائدتك"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(58,52,30,0) 30%, rgba(40,35,18,0.85) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur">
            <Leaf className="h-3 w-3" />
            بوتيك ريف المدينة
          </div>
          <h2 className="font-display text-2xl font-extrabold leading-tight">
            <TypewriterPlaceholder
              options={[
                "من المزرعة إلى مائدتك",
                "بدون إضافات.. طبيعة ١٠٠٪",
                "كل قطرة لها قصة",
              ]}
            />
          </h2>
          <p className="mt-1 text-[11px] opacity-90">
            منتجات أصيلة · مزارعون موثوقون · إنتاج محدود
          </p>
        </div>
      </section>

      {/* Search */}
      <div
        className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-soft"
        style={{ background: "#FFFDF8", border: "1px solid #E8DFC9" }}
      >
        <Search className="h-4 w-4" style={{ color: "#7B6A3F" }} strokeWidth={2.4} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في خيرات القرية…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Sub-category chips */}
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        {SUB_CATS.map((c) => {
          const active = subCat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSubCat(c.id)}
              className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition"
              style={
                active
                  ? { background: "#5A6E3A", color: "#FBF7EE" }
                  : { background: "#FFFDF8", color: "#3A341E", border: "1px solid #E8DFC9" }
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Health filter pills */}
      <div className="mt-4">
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#7B6A3F" }}>
          فلترة حسب الأسلوب الصحي
        </p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          <button
            onClick={() => setTag("all")}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold transition"
            style={
              tag === "all"
                ? { background: "#3A341E", color: "#F0E5C2" }
                : { background: "#FFFDF8", color: "#3A341E", border: "1px solid #E8DFC9" }
            }
          >
            الكل
          </button>
          {HEALTH_TAGS.map((h) => {
            const active = tag === h.id;
            return (
              <button
                key={h.id}
                onClick={() => setTag(h.id)}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold transition"
                style={
                  active
                    ? { background: "#3A341E", color: "#F0E5C2" }
                    : { background: "#FFFDF8", color: "#3A341E", border: "1px solid #E8DFC9" }
                }
              >
                <span className="me-1">{h.emoji}</span>
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product grid */}
      <section className="mt-5">
        {items.length === 0 ? (
          <p
            className="rounded-2xl p-6 text-center text-xs"
            style={{ background: "#FFFDF8", color: "#7B6A3F", border: "1px dashed #D9CDA4" }}
          >
            لا توجد منتجات تطابق المعايير المختارة
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map((p) => (
              <VillageCard
                key={p.id}
                product={p}
                onToggleRoutine={toggleRoutine}
                routineActive={routines.some((r) => r.productId === p.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="h-24" />
    </div>
  );
};

/* ---------------- Single product card (boutique style) ---------------- */

const VillageCard = ({
  product,
  onToggleRoutine,
  routineActive,
}: {
  product: Product;
  onToggleRoutine: (id: string, discount: number, freq: "weekly" | "biweekly") => void;
  routineActive: boolean;
}) => {
  const meta = villageMetaFor(product.id);
  const { add, setQty, lines } = useCart();
  const qty = lines.find((l) => l.product.id === product.id)?.qty ?? 0;
  const { has, toggle } = useFavorites();
  const fav = has(product.id);
  const [justAdded, setJustAdded] = useState(false);

  const isPreorder = !!meta?.batch;
  const remaining = meta?.batch?.remaining ?? 0;
  const total = meta?.batch?.total ?? 0;
  const reservedPct = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 0;
  const lowStock = isPreorder && remaining <= 5;

  const handleAdd = () => {
    add(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      className="overflow-hidden rounded-[1.75rem] transition-shadow duration-300"
      style={{
        background: "#FFFDF8",
        border: "1px solid #EFE6CE",
        boxShadow: "0 1px 2px rgba(58,52,30,0.04), 0 8px 24px -12px rgba(58,52,30,0.10)",
      }}
    >
      <div className="grid grid-cols-[140px_1fr]">
        {/* Image side */}
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          className="group relative block overflow-hidden"
          style={{ background: "#F5EFE0" }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
          {/* Soft gradient bottom for legibility of scarcity bar */}
          {total > 0 && (
            <div
              className="absolute inset-x-0 bottom-0 h-12"
              style={{ background: "linear-gradient(180deg, transparent, rgba(40,35,18,0.55))" }}
            />
          )}

          {/* Trust badges — single, smaller, top-right */}
          {meta?.trust && meta.trust.length > 0 && (
            <span
              className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold shadow-pill backdrop-blur-md"
              style={{ background: "rgba(255,253,248,0.92)", color: "#3A341E" }}
              title={TRUST_BADGE_META[meta.trust[0]].label}
            >
              <span className="text-[10px] leading-none">{TRUST_BADGE_META[meta.trust[0]].emoji}</span>
              {TRUST_BADGE_META[meta.trust[0]].label}
            </span>
          )}

          {/* Scarcity progress bar */}
          {total > 0 && (
            <div className="absolute inset-x-2 bottom-2">
              <div className="mb-1 flex items-center justify-between text-[8.5px] font-extrabold text-white">
                <span>تم حجز {toLatin(reservedPct)}٪</span>
                {lowStock && <span style={{ color: "#FFD27A" }}>متبقي {toLatin(remaining)}</span>}
              </div>
              <div className="h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.35)" }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${reservedPct}%`,
                    background: lowStock
                      ? "linear-gradient(90deg, #E0A02A, #B8860B)"
                      : "linear-gradient(90deg, #C8D58A, #5A6E3A)",
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={(e) => { e.preventDefault(); toggle(product.id); }}
            aria-label="مفضلة"
            className="absolute top-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition active:scale-90"
            style={{ background: fav ? "#A04040" : "rgba(255,253,248,0.9)", color: fav ? "#fff" : "#3A341E" }}
          >
            <Heart className={`h-3.5 w-3.5 ${fav ? "fill-white" : ""}`} strokeWidth={2.4} />
          </button>
        </Link>

        {/* Body side */}
        <div className="flex flex-col gap-1.5 p-3">
          {product.brand && (
            <p className="text-[10px] font-bold" style={{ color: "#B8860B" }}>{product.brand}</p>
          )}
          <h3 className="line-clamp-2 font-display text-sm font-extrabold leading-tight" style={{ color: "#3A341E" }}>
            {product.name}
          </h3>
          {meta?.source && (
            <p className="line-clamp-1 text-[10px]" style={{ color: "#7B6A3F" }}>
              <ShieldCheck className="me-1 inline h-2.5 w-2.5" />
              {meta.source}
            </p>
          )}

          {/* Tags — only 2, on hover/group reveal a third */}
          {meta?.tags && meta.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meta.tags.slice(0, 2).map((id) => {
                const h = HEALTH_TAGS.find((x) => x.id === id)!;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    style={{ background: "#F5EFE0", color: "#3A341E" }}
                  >
                    <span>{h.emoji}</span>{h.label}
                  </span>
                );
              })}
              {meta.tags.length > 2 && (
                <span
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ background: "transparent", color: "#7B6A3F", border: "1px dashed #D9CDA4" }}
                >
                  +{toLatin(meta.tags.length - 2)}
                </span>
              )}
            </div>
          )}

          {/* Price + CTA */}
          <div className="mt-2 flex items-end justify-between">
            <div className="leading-none">
              <span className="font-display text-lg font-extrabold tabular-nums" style={{ color: "#3A341E" }}>
                {toLatin(product.price)}
              </span>
              <span className="text-[10px] font-medium" style={{ color: "#7B6A3F" }}> ج.م</span>
              {product.oldPrice && (
                <div className="text-[10px] line-through tabular-nums" style={{ color: "#B0A079" }}>
                  {toLatin(product.oldPrice)} ج.م
                </div>
              )}
              {meta?.batch?.nextBatchDay && (
                <p className="mt-1 text-[9.5px] font-bold" style={{ color: "#B8860B" }}>
                  الدفعة القادمة: {meta.batch.nextBatchDay}
                </p>
              )}
            </div>

            {qty === 0 ? (
              <button
                onClick={handleAdd}
                className="relative flex items-center gap-1 rounded-full px-3.5 py-2 text-[11px] font-extrabold shadow-pill transition active:scale-95"
                style={{
                  background: justAdded
                    ? "linear-gradient(135deg, #3F5226, #2A3717)"
                    : isPreorder
                    ? "linear-gradient(135deg, #B8860B, #8C6508)"
                    : "linear-gradient(135deg, #5A6E3A, #3F5226)",
                  color: "#FBF7EE",
                }}
              >
                {justAdded ? (
                  <>
                    <Check className="h-3.5 w-3.5 animate-scale-in" strokeWidth={3} />
                    تمت الإضافة
                  </>
                ) : isPreorder ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    {meta!.batch!.ctaLabel ?? "احجز حصتك الآن"}
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                    أضف للسلة
                  </>
                )}
              </button>
            ) : (
              <div
                className="flex h-9 items-center gap-1 rounded-full shadow-pill"
                style={{ background: "#3A341E", color: "#F0E5C2" }}
              >
                <button onClick={() => setQty(product.id, Math.max(0, qty - 1))} className="flex h-9 w-8 items-center justify-center rounded-full">
                  <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
                <span className="min-w-[1ch] text-center text-sm font-extrabold tabular-nums">{toLatin(qty)}</span>
                <button onClick={handleAdd} className="flex h-9 w-8 items-center justify-center rounded-full">
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            )}
          </div>

          {/* Routine CTA */}
          {meta?.routine && (
            <button
              onClick={() => onToggleRoutine(product.id, meta.routine!.discountPct, meta.routine!.defaultFrequency)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-extrabold transition"
              style={
                routineActive
                  ? { background: "#3A341E", color: "#F0E5C2" }
                  : { background: "#FBF7EE", color: "#3A341E", border: "1px dashed #B8860B" }
              }
            >
              <Repeat className="h-3.5 w-3.5" />
              {routineActive
                ? `روتين مُفعّل · خصم ${toLatin(meta.routine.discountPct)}٪`
                : `اجعله روتيناً · وفّر ${toLatin(meta.routine.discountPct)}٪`}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default Village;
