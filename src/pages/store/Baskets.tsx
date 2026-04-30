import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import { products, useProductsVersion } from "@/lib/products";
import { storeThemes } from "@/lib/storeThemes";
import BasketCard from "@/components/baskets/BasketCard";
import { loadSubs, findFrequency, type SubscriptionRecord } from "@/lib/baskets";
import { toLatin } from "@/lib/format";
import { Sparkles, PackagePlus, ShoppingBasket, CalendarClock, ChevronLeft } from "lucide-react";

const categories = [
  { id: "all", name: "الكل" },
  { id: "أسبوعية", name: "أسبوعية" },
  { id: "فواكه", name: "فواكه" },
  { id: "خضار", name: "خضار" },
  { id: "إفطار", name: "إفطار" },
  { id: "مناسبات", name: "مناسبات" },
];

const Baskets = () => {
  useProductsVersion();
  const theme = storeThemes.baskets;
  const [active, setActive] = useState("all");
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);

  useEffect(() => { setSubs(loadSubs()); }, []);

  const list = useMemo(() => {
    const all = products.filter((p) => p.source === "baskets");
    return active === "all" ? all : all.filter((p) => p.subCategory === active);
  }, [active]);

  return (
    <div className="space-y-5 pb-10">
      <BackHeader title="سلال الريف" subtitle="وفّر حتى 25٪ مع سلال جاهزة لكل أسبوع" accent="متجر" themeKey="baskets" />

      {/* Hero — premium gradient with animated shine */}
      <section
        className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-tile"
        style={{ background: theme.gradient }}
      >
        <div className="absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -top-8 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
            <Sparkles className="h-3 w-3" /> وفّر بالكمية
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white text-balance">
            سلال جاهزة بأسعار<br />تشبه أسعار الجملة
          </h2>
          <p className="mt-1 text-xs text-white/85">استبدل أي صنف · اشترك واحصل على كاشباك حتى 8٪</p>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/store/baskets-build"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3.5 text-right text-white shadow-tile transition active:scale-[0.98]"
        >
          <PackagePlus className="mb-1.5 h-5 w-5" />
          <p className="font-display text-sm font-extrabold leading-tight">ابني سلتك</p>
          <p className="text-[10px] font-bold opacity-90">اختر منتجاتك ووفّر حتى 20٪</p>
          <ChevronLeft className="absolute bottom-2 left-2 h-4 w-4 opacity-70 transition group-hover:translate-x-[-2px]" />
        </Link>
        <Link
          to="/store/baskets-subs"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-3.5 text-right text-white shadow-tile transition active:scale-[0.98]"
        >
          <CalendarClock className="mb-1.5 h-5 w-5" />
          <p className="font-display text-sm font-extrabold leading-tight">اشتراكاتي</p>
          <p className="text-[10px] font-bold opacity-90">
            {subs.length > 0 ? `${toLatin(subs.length)} اشتراك نشط` : "اشترك ووفّر تلقائياً"}
          </p>
          <ChevronLeft className="absolute bottom-2 left-2 h-4 w-4 opacity-70 transition group-hover:translate-x-[-2px]" />
        </Link>
      </section>

      {/* Active subs strip */}
      {subs.length > 0 && (
        <section className="space-y-2">
          <h3 className="px-1 font-display text-base font-extrabold">اشتراكاتك القادمة</h3>
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {subs.slice(0, 5).map((s) => {
              const f = findFrequency(s.frequency);
              const days = Math.max(0, Math.ceil((new Date(s.nextDelivery).getTime() - Date.now()) / 86400000));
              return (
                <Link
                  key={s.id}
                  to="/store/baskets-subs"
                  className="relative flex w-44 shrink-0 items-center gap-2.5 rounded-2xl bg-card p-2 ring-1 ring-border/60 shadow-soft"
                >
                  <img src={s.basketImage} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="line-clamp-1 text-[11.5px] font-extrabold">{s.basketName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {f.shortLabel} · بعد {toLatin(days)} يوم
                    </p>
                  </div>
                  {s.paused && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[8px] font-extrabold text-white">موقوف</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Sticky category bar */}
      <div className="sticky top-14 z-20 -mx-4 border-y border-border/40 bg-background/85 px-4 py-2 shadow-[0_4px_12px_-8px_rgba(0,0,0,0.15)]">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition ${
                active === c.id
                  ? "bg-foreground text-background shadow-pill"
                  : "bg-foreground/5 text-foreground/80"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
            <ShoppingBasket className="h-5 w-5 text-emerald-600" /> السلال الجاهزة
          </h3>
          <span className="text-[10.5px] font-bold text-muted-foreground tabular-nums">
            {toLatin(list.length)} سلة
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <BasketCard key={p.id} product={p} />
          ))}
        </div>
        {list.length === 0 && (
          <p className="rounded-2xl bg-foreground/5 p-6 text-center text-xs text-muted-foreground">
            لا توجد سلال في هذا التصنيف الآن.
          </p>
        )}
      </section>
    </div>
  );
};

export default Baskets;
