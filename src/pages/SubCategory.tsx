import { useParams, Link } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import ProductCard from "@/components/ProductCard";
import { products, type Product } from "@/lib/products";
import { storeThemes, type StoreThemeKey } from "@/lib/storeThemes";
import { ChevronLeft } from "lucide-react";

type SubDef = {
  title: string;
  subtitle: string;
  themeKey: StoreThemeKey;
  match: (p: Product) => boolean;
};

const SUBS: Record<string, SubDef> = {
  rice: {
    title: "أرز وبقالة جافة", subtitle: "أرز ومكرونة وزيوت وحبوب",
    themeKey: "supermarket",
    match: (p) => p.category === "البقالة الجافة",
  },
  canned: {
    title: "معلبات", subtitle: "معلبات وحفظ طويل",
    themeKey: "supermarket",
    match: (p) => p.subCategory === "مخللات" || /معلب/.test(p.name),
  },
  bakery: {
    title: "مخبوزات", subtitle: "خبز وبسكويت ومعجنات",
    themeKey: "supermarket",
    match: (p) => p.category === "المخبوزات",
  },
  treats: {
    title: "مفرحات", subtitle: "حلويات وشوكولاتة",
    themeKey: "sweets",
    match: (p) => p.source === "sweets" || p.subCategory === "حلويات",
  },
  snacks: {
    title: "تسالي ومكسرات", subtitle: "وجبات خفيفة لكل وقت",
    themeKey: "supermarket",
    match: (p) => /كوكيز|تسال|مكسرات|شيبس|بسكويت/.test(p.name),
  },
  drinks: {
    title: "مشروبات", subtitle: "عصائر ومياه وقهوة",
    themeKey: "supermarket",
    match: (p) => p.category === "المشروبات",
  },
  paper: {
    title: "ورقيات ومنظفات", subtitle: "نظافة وعناية بالمنزل",
    themeKey: "homeTools",
    match: (p) => p.subCategory === "تنظيف" || /منظف|ورق/.test(p.name),
  },
  "kitchen-tools": {
    title: "أدوات المطبخ", subtitle: "أواني وأدوات يومية",
    themeKey: "homeTools",
    match: (p) => p.category === "أدوات منزلية",
  },
  baby: {
    title: "العناية بالطفل", subtitle: "كل احتياجات الأطفال",
    themeKey: "supermarket",
    match: (p) => p.category === "أطعمة الأطفال" || /طفل|أطفال|حفاض/.test(p.name),
  },
  personal: {
    title: "العناية الشخصية", subtitle: "شامبو وعناية يومية",
    themeKey: "supermarket",
    match: (p) => p.category === "العناية الشخصية",
  },
  women: {
    title: "عالم المرأة", subtitle: "منتجات نسائية مختارة",
    themeKey: "subscriptions",
    match: (p) => /مرأة|نساء/.test(p.name) || p.subCategory === "شامبو",
  },
  gifts: {
    title: "الهدايا والتغليف", subtitle: "تغليف وهدايا لكل المناسبات",
    themeKey: "subscriptions",
    match: (p) => p.source === "baskets" || /هدية|تغليف/.test(p.name),
  },
};

const SubCategory = () => {
  const { slug } = useParams({ from: "/_app/sub/$slug" });
  const def = SUBS[slug];

  if (!def) {
    return (
      <div className="space-y-4">
        <BackHeader title="القسم غير موجود" />
        <div className="glass-strong rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">عذراً، هذا القسم غير متوفر حالياً.</p>
          <Link to="/sections" className="inline-block rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
            تصفح كل الأقسام
          </Link>
        </div>
      </div>
    );
  }

  const theme = storeThemes[def.themeKey];
  const items = products.filter(def.match);

  return (
    <div className="space-y-5">
      <BackHeader title={def.title} />
      <section
        className="rounded-[1.75rem] p-5 shadow-tile"
        style={{ background: theme.gradient }}
      >
        <span className="text-[10px] font-bold text-foreground/80">{theme.label}</span>
        <h2 className="font-display text-2xl font-extrabold text-foreground">{def.title}</h2>
        <p className="mt-1 text-xs text-foreground/70">{def.subtitle}</p>
      </section>

      {items.length === 0 ? (
        <div className="glass-strong rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">لا توجد منتجات في هذا القسم بعد.</p>
          <Link
            to="/store/supermarket"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary"
          >
            تصفح السوبر ماركت <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-lg font-extrabold">المنتجات</h3>
            <span className="text-[11px] text-muted-foreground">{items.length} منتج</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SubCategory;