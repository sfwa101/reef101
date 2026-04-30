import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { products, useProductsVersion } from "@/lib/products";
import { Tag, Gift, Percent, Sparkles, Flame, Clock } from "lucide-react";
import { toLatin } from "@/lib/format";

const promoCards = [
  { title: "عميل جديد", desc: "خصم 20٪", code: "WELCOME20", icon: Sparkles, bg: "from-primary to-primary/70" },
  { title: "توصيل مجاني", desc: "أول طلبين", code: "FREESHIP", icon: Gift, bg: "from-amber-500 to-orange-400" },
  { title: "خصم كاش", desc: "50 ج.م", code: "CASH50", icon: Tag, bg: "from-rose-500 to-pink-400" },
  { title: "خصم الجملة", desc: "حتى 35٪", code: "BULK35", icon: Percent, bg: "from-blue-600 to-indigo-500" },
];

const tabs = [
  { id: "all", label: "الكل" },
  { id: "best", label: "الأكثر مبيعًا" },
  { id: "trending", label: "رائج" },
  { id: "discount", label: "تخفيضات" },
] as const;

const useDailyCountdown = () => {
  useProductsVersion();
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      const h = Math.floor(diff / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);
      setLeft(`${toLatin(String(h).padStart(2, "0"))}:${toLatin(String(m).padStart(2, "0"))}:${toLatin(String(s).padStart(2, "0"))}`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return left;
};

const Offers = () => {
  const [tab, setTab] = useState<typeof tabs[number]["id"]>("all");
  const countdown = useDailyCountdown();

  const discounted = useMemo(() => products.filter((p) => p.oldPrice), []);
  const flashSale = useMemo(() => discounted.slice(0, 4), [discounted]);

  const filtered = useMemo(() => {
    const onSale = new Set(discounted.map((p) => p.id));
    const featured = products.filter((p) => onSale.has(p.id) || p.badge === "best" || p.badge === "trending");
    if (tab === "all") return featured;
    if (tab === "discount") return discounted;
    return featured.filter((p) => p.badge === tab);
  }, [tab, discounted]);

  return (
    <div className="space-y-6">
      <section className="animate-float-up">
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">العروض</h1>
        <p className="mt-1 text-xs text-muted-foreground">خصومات اليوم من جميع الأقسام</p>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-tile" style={{ background: "linear-gradient(135deg, hsl(0 65% 45%), hsl(20 70% 55%))" }}>
        <div className="absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/90"><Flame className="h-3 w-3" /> عرض الفلاش</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-white text-balance">خصومات حتى 40٪</h2>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white">
            <Clock className="h-3.5 w-3.5" /> ينتهي خلال <span className="tabular-nums">{countdown}</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 px-1 font-display text-base font-extrabold">عروض الفلاش</h3>
        <div className="grid grid-cols-2 gap-3">
          {flashSale.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {promoCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} p-4 text-white shadow-tile`}>
              <Icon className="absolute -bottom-3 -left-2 h-20 w-20 text-white/15" />
              <p className="text-[10px] font-bold opacity-90">{c.title}</p>
              <p className="font-display text-xl font-extrabold">{c.desc}</p>
              <p className="mt-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{c.code}</p>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {tabs.map((t) => {
            const active = t.id === tab;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${active ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5"}`}>
                {t.label}
              </button>
            );
          })}
        </div>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد عروض في هذا القسم حالياً</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
};
export default Offers;
