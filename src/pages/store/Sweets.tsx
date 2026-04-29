import SinglePageStore, { type StoreCategory } from "@/components/SinglePageStore";
import { products } from "@/lib/products";
import { storeThemes } from "@/lib/storeThemes";
import { fulfillmentMeta } from "@/lib/sweetsFulfillment";

const cats: StoreCategory[] = [
  { id: "all",     name: "الكل",      match: (p) => p.source === "sweets" },
  { id: "cakes",   name: "تورتات",    match: (p) => p.source === "sweets" && p.subCategory === "تورتات" },
  { id: "east",    name: "شرقية",     match: (p) => p.source === "sweets" && p.subCategory === "شرقية" },
  { id: "west",    name: "غربية",     match: (p) => p.source === "sweets" && p.subCategory === "غربية" },
  { id: "ice",     name: "مثلجات",    match: (p) => p.source === "sweets" && p.subCategory === "مثلجات" },
];

const Sweets = () => {
  const theme = storeThemes.sweets;
  return (
    <SinglePageStore
      themeKey="sweets"
      title="الحلويات والتورتة"
      subtitle="لكل مناسبة لمسة حلوة من ريف المدينة"
      searchPlaceholder="ابحث في الحلويات…"
      products={products}
      categories={cats}
      hero={
        <section className="space-y-3">
          <div className="rounded-[1.75rem] p-5 shadow-tile" style={{ background: theme.gradient }}>
            <span className="text-[10px] font-bold text-foreground/80">حسب الطلب</span>
            <h2 className="font-display text-2xl font-extrabold text-foreground">تورتات بمناسبتك</h2>
            <p className="mt-1 text-xs text-foreground/70">جاهزة في 24 ساعة</p>
          </div>

          {/* Fulfillment legend — explains the three coloured badges */}
          <div className="rounded-2xl bg-card p-3 ring-1 ring-border/40">
            <p className="mb-2 text-[11px] font-extrabold text-muted-foreground">حالات التوفر</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {(["A", "B", "C"] as const).map((t) => {
                const m = fulfillmentMeta[t];
                return (
                  <div key={t} className="rounded-[12px] bg-foreground/5 p-2">
                    <div className={`mx-auto mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${m.badgeBg} ${m.badgeText}`}>
                      <span>{m.emoji}</span>
                      {m.badge}
                    </div>
                    <p className="text-[9.5px] font-bold leading-tight text-foreground/80">
                      {t === "A" ? "من المخزن" : t === "B" ? "نفس اليوم" : "احجز مسبقاً"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      }
    />
  );
};
export default Sweets;