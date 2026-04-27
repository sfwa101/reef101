import SinglePageStore, { type StoreCategory } from "@/components/SinglePageStore";
import { products } from "@/lib/products";
import { storeThemes } from "@/lib/storeThemes";
import { Crown, Boxes, Truck, BadgePercent } from "lucide-react";

// Simulate bulk packs from regular products (5-6× quantity, ~13% off)
const bulkProducts = products.map((p) => ({
  ...p,
  id: `bulk-${p.id}`,
  name: `عبوة وفر · ${p.name}`,
  unit: `حزمة 6× ${p.unit}`,
  price: Math.round(p.price * 5.2),
  oldPrice: Math.round(p.price * 6),
  source: "wholesale" as const,
}));

const cats: StoreCategory[] = [
  { id: "top", name: "الأكثر توفيرًا", match: (p) => p.source === "wholesale" && (p.oldPrice ?? 0) - p.price > 30 },
  { id: "food", name: "غذائيات", match: (p) => p.source === "wholesale" && ["البقالة الجافة", "الألبان والبيض", "اللحوم والدواجن", "الخضار والفواكه", "المخبوزات"].includes(p.category) },
  { id: "drinks", name: "مشروبات", match: (p) => p.source === "wholesale" && p.category === "المشروبات" },
  { id: "clean", name: "تنظيف وعناية", match: (p) => p.source === "wholesale" && (p.category === "العناية الشخصية" || p.category === "أدوات منزلية") },
  { id: "baby", name: "أطفال", match: (p) => p.source === "wholesale" && p.category === "أطعمة الأطفال" },
  { id: "pets", name: "حيوانات", match: (p) => p.source === "wholesale" && p.category === "أغذية الحيوانات" },
];

const Wholesale = () => (
  <SinglePageStore
    themeKey="wholesale"
    title="ريف الجملة"
    subtitle="عبوات كبيرة بأسعار العضويّة"
    searchPlaceholder="ابحث في عبوات الوفر…"
    products={bulkProducts}
    categories={cats}
    hero={
      <section
        className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-tile"
        style={{ background: "linear-gradient(135deg, hsl(220 60% 18%), hsl(200 50% 30%) 60%, hsl(40 80% 55%))" }}
      >
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <Crown className="h-4 w-4 text-accent" />
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              عضويّة ريف
            </span>
          </div>
          <h2 className="font-display text-2xl font-extrabold text-white text-balance">
            وفّر حتى 35٪<br />عند الشراء بكميّات كبيرة
          </h2>
          <p className="mt-1 text-xs text-white/80">للأفراد والعائلات · بدون حد أدنى للطلب</p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-pill">
            اشترك بـ 299 ج.م/سنة
          </button>
        </div>
      </section>
    }
    intro={
      <div className="mb-3 mt-3 grid grid-cols-3 gap-3">
        {[
          { icon: BadgePercent, label: "خصم 35٪", sub: "حتى" },
          { icon: Boxes, label: "عبوات وفر", sub: "حجم عائلي" },
          { icon: Truck, label: "توصيل مجاني", sub: "للأعضاء" },
        ].map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.label} className="glass-strong flex flex-col items-center gap-2 rounded-2xl p-3 text-center shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
                <Icon className="h-5 w-5 text-primary" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[12px] font-extrabold">{b.label}</p>
                <p className="text-[10px] text-muted-foreground">{b.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    }
  />
);

export default Wholesale;
