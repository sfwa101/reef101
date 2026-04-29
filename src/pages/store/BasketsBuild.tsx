import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import { products, type Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { toLatin } from "@/lib/format";
import {
  BUILD_BOX_THRESHOLDS,
  tierForSubtotal,
  nextTierForSubtotal,
} from "@/lib/baskets";
import AnimatedNumber from "@/components/baskets/AnimatedNumber";
import { PackagePlus, Plus, Minus, Sparkles, Check, ShoppingCart } from "lucide-react";

const BUILD_SOURCES: Product["source"][] = ["produce", "dairy", "village", "supermarket"];

const BasketsBuild = () => {
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [activeCat, setActiveCat] = useState<string>("all");

  const pool = useMemo(
    () => products.filter((p) => BUILD_SOURCES.includes(p.source)),
    [],
  );
  const cats = useMemo(() => {
    const set = new Set<string>();
    pool.forEach((p) => p.subCategory && set.add(p.subCategory));
    return ["all", ...Array.from(set)];
  }, [pool]);

  const visible = useMemo(
    () => (activeCat === "all" ? pool : pool.filter((p) => p.subCategory === activeCat)),
    [pool, activeCat],
  );

  const lines = useMemo(
    () =>
      Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ product: pool.find((p) => p.id === id)!, qty: q }))
        .filter((l) => l.product),
    [qty, pool],
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.qty, 0),
    [lines],
  );
  const tier = tierForSubtotal(subtotal);
  const next = nextTierForSubtotal(subtotal);
  const discountPct = tier?.discountPct ?? 0;
  const discount = Math.round((subtotal * discountPct) / 100);
  const final = subtotal - discount;
  const progress = next
    ? Math.min(100, Math.round((subtotal / next.min) * 100))
    : 100;

  const inc = (id: string) => setQty((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const dec = (id: string) =>
    setQty((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) }));

  const checkout = () => {
    if (lines.length === 0) {
      toast.error("اختر منتجات أولاً");
      return;
    }
    const ratio = subtotal > 0 ? final / subtotal : 1;
    lines.forEach((l) => {
      add(l.product, l.qty, {
        unitPrice: Math.round(l.product.price * ratio),
        bookingNote: tier ? `سلة مخصصة · ${tier.label} ${toLatin(discountPct)}%` : "سلة مخصصة",
      });
    });
    fireConfetti();
    toast.success(`تمت إضافة سلتك المخصصة · وفّرت ${toLatin(discount)} ج.م`);
    navigate({ to: "/cart" });
  };

  return (
    <div className="space-y-5 pb-32">
      <BackHeader title="ابني سلتك" subtitle="اختر منتجاتك ووفّر تلقائياً مع الكمية" accent="متجر" themeKey="baskets" />

      {/* Progress hero */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 p-5 shadow-tile text-white">
        <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-wide opacity-90">سلتك المخصصة</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-display text-3xl font-extrabold tabular-nums">
              <AnimatedNumber value={final} /> <span className="text-sm">ج.م</span>
            </span>
            {discount > 0 && (
              <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold text-emerald-900 shadow-pill tabular-nums">
                وفّرت {toLatin(discount)} ج.م
              </span>
            )}
          </div>

          {/* Progress to next tier */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-l from-amber-300 to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10.5px] font-bold opacity-95">
            {next
              ? `أضف ${toLatin(next.min - subtotal)} ج.م لتحصل على ${next.label} (خصم ${toLatin(next.discountPct)}٪)`
              : `وصلت لأعلى مستوى خصم! (${toLatin(discountPct)}٪)`}
          </p>

          {/* Tier chips */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {BUILD_BOX_THRESHOLDS.map((t) => {
              const active = subtotal >= t.min;
              return (
                <span
                  key={t.min}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold tabular-nums ${
                    active ? "bg-white text-emerald-700 shadow-pill" : "bg-white/15 text-white/80"
                  }`}
                >
                  {active && <Check className="-mt-0.5 me-0.5 inline h-2.5 w-2.5" strokeWidth={3.5} />}
                  {toLatin(t.min)}+ ج · {toLatin(t.discountPct)}٪
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sticky cats */}
      <div className="sticky top-14 z-20 -mx-4 border-y border-border/40 bg-background/85 px-4 py-2 shadow-[0_4px_12px_-8px_rgba(0,0,0,0.15)]">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition ${
                activeCat === c ? "bg-foreground text-background shadow-pill" : "bg-foreground/5 text-foreground/80"
              }`}
            >
              {c === "all" ? "الكل" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <section className="grid grid-cols-2 gap-3">
        {visible.map((p) => {
          const q = qty[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className={`relative overflow-hidden rounded-2xl bg-card p-2 ring-1 transition ${
                q > 0 ? "ring-emerald-500 shadow-pill" : "ring-border/60 shadow-soft"
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-foreground/5">
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                {q > 0 && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white tabular-nums shadow-pill">
                    ×{toLatin(q)}
                  </span>
                )}
              </div>
              <div className="mt-1.5 px-0.5">
                <p className="line-clamp-1 text-[11.5px] font-extrabold leading-tight">{p.name}</p>
                <p className="text-[9.5px] text-muted-foreground">{p.unit}</p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="font-display text-[13px] font-extrabold tabular-nums">
                    {toLatin(p.price)} <span className="text-[9px] font-bold text-muted-foreground">ج</span>
                  </span>
                  {q === 0 ? (
                    <button
                      onClick={() => inc(p.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-pill transition active:scale-90"
                      aria-label="إضافة"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-foreground/5 p-0.5">
                      <button onClick={() => dec(p.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-[11px] font-extrabold tabular-nums">{toLatin(q)}</span>
                      <button onClick={() => inc(p.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Plus className="h-3 w-3" strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Sticky checkout */}
      <div className="fixed inset-x-0 bottom-[68px] z-30 px-3">
        <button
          onClick={checkout}
          disabled={lines.length === 0}
          className="flex w-full items-center justify-between gap-3 rounded-[20px] bg-emerald-600 px-4 py-3.5 text-white shadow-float transition active:scale-[0.99] disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-display text-sm font-extrabold">
              {lines.length === 0 ? "ابدأ بإضافة منتجات" : `${toLatin(lines.length)} منتج · أضف للسلة`}
            </span>
          </span>
          <span className="font-display text-base font-extrabold tabular-nums">
            <AnimatedNumber value={final} /> ج
          </span>
        </button>
        {tier && (
          <p className="mt-1 text-center text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="-mt-0.5 inline h-3 w-3" /> {tier.label} مفعّل · توفير {toLatin(discount)} ج.م
          </p>
        )}
      </div>
    </div>
  );
};

export default BasketsBuild;
