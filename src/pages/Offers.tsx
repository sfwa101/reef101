import ProductCarousel from "@/components/ProductCarousel";
import { products } from "@/lib/products";
import { Tag, Gift, Percent, Sparkles } from "lucide-react";

const offerSections = [
  { title: "عروض السوبرماركت", accent: "أساسيات يومية", source: "supermarket" },
  { title: "عروض مطبخ ريف", accent: "وجبات بأسعار خاصة", source: "kitchen" },
  { title: "عروض وصفات الشيف", accent: "خصومات على الباقات", source: "recipes" },
  { title: "عروض ريف الجملة", accent: "وفر بالحجم الكبير", source: "wholesale" },
  { title: "عروض الصيدلية", accent: "صحة وعناية", source: "pharmacy" },
];

const Offers = () => {
  const onSale = products.filter((p) => p.oldPrice).concat(products.slice(0, 4));
  return (
    <div className="space-y-6">
      <section className="animate-float-up">
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">العروض</h1>
        <p className="mt-1 text-xs text-muted-foreground">خصومات اليوم من جميع الأقسام</p>
      </section>
      <section className="grid grid-cols-2 gap-3">
        {[
          { title: "عميل جديد", desc: "خصم 20٪", code: "WELCOME20", icon: Sparkles, bg: "from-primary to-primary/70" },
          { title: "توصيل مجاني", desc: "أول طلبين", code: "FREESHIP", icon: Gift, bg: "from-amber-500 to-orange-400" },
          { title: "خصم كاش", desc: "50 ج.م", code: "CASH50", icon: Tag, bg: "from-rose-500 to-pink-400" },
          { title: "خصم الجملة", desc: "حتى 35٪", code: "BULK35", icon: Percent, bg: "from-blue-600 to-indigo-500" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} p-4 text-white shadow-tile`}>
              <Icon className="absolute -bottom-3 -left-2 h-20 w-20 text-white/15" />
              <p className="text-[10px] font-bold opacity-90">{c.title}</p>
              <p className="font-display text-xl font-extrabold">{c.desc}</p>
              <p className="mt-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur">{c.code}</p>
            </div>
          );
        })}
      </section>
      <section className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-tile" style={{ background: "linear-gradient(135deg, hsl(0 65% 45%), hsl(20 70% 55%))" }}>
        <div className="absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
        <p className="text-[10px] font-bold text-white/90">عرض محدود</p>
        <h2 className="font-display text-2xl font-extrabold text-white text-balance">أسبوع التوفير الكبير<br />خصومات حتى 40٪</h2>
        <p className="mt-1 text-xs text-white/80">ينتهي خلال يومين</p>
      </section>
      <ProductCarousel title="العروض الحارة" accent="🔥 الأكثر طلبًا" products={onSale} seeAllTo="/sections" />
      {offerSections.map((s) => (
        <ProductCarousel key={s.source} title={s.title} accent={s.accent} products={products.slice(0, 5)} seeAllTo={`/store/${s.source}`} />
      ))}
    </div>
  );
};
export default Offers;
