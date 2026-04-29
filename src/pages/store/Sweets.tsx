import SinglePageStore, { type StoreCategory } from "@/components/SinglePageStore";
import { products } from "@/lib/products";
import { storeThemes } from "@/lib/storeThemes";

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
        <section className="rounded-[1.75rem] p-5 shadow-tile" style={{ background: theme.gradient }}>
          <span className="text-[10px] font-bold text-foreground/80">حسب الطلب</span>
          <h2 className="font-display text-2xl font-extrabold text-foreground">تورتات بمناسبتك</h2>
          <p className="mt-1 text-xs text-foreground/70">جاهزة في 24 ساعة</p>
        </section>
      }
    />
  );
};
export default Sweets;