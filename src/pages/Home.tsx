import { Search, MapPin, Sparkles, Clock, Flame, Award, ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ProductCarousel from "@/components/ProductCarousel";
import ProductCard from "@/components/ProductCard";
import { byBadge, products } from "@/lib/products";

import tileSupermarket from "@/assets/tile-supermarket.jpg";
import tileKitchen from "@/assets/tile-kitchen.jpg";
import tileRecipes from "@/assets/tile-recipes.jpg";
import tileWholesale from "@/assets/tile-wholesale.jpg";
import tileDairy from "@/assets/tile-dairy.jpg";
import tileProduce from "@/assets/tile-produce.jpg";
import tileSubscription from "@/assets/tile-subscription.jpg";
import tileLibrary from "@/assets/tile-library.jpg";
import tilePharmacy from "@/assets/tile-pharmacy.jpg";
import tileHome from "@/assets/tile-home.jpg";

const quickShortcuts = [
  { id: "supermarket", title: "السوبرماركت", img: tileSupermarket, to: "/store/supermarket" },
  { id: "kitchen", title: "مطبخ ريف", img: tileKitchen, to: "/store/kitchen" },
  { id: "recipes", title: "وصفات الشيف", img: tileRecipes, to: "/store/recipes" },
  { id: "wholesale", title: "ريف الجملة", img: tileWholesale, to: "/store/wholesale" },
];

const allStores = [
  { id: "supermarket", title: "السوبرماركت", img: tileSupermarket, to: "/store/supermarket" },
  { id: "produce", title: "خضار وفاكهة", img: tileProduce, to: "/store/produce" },
  { id: "dairy", title: "الألبان", img: tileDairy, to: "/store/dairy" },
  { id: "kitchen", title: "مطبخ ريف", img: tileKitchen, to: "/store/kitchen" },
  { id: "recipes", title: "وصفات الشيف", img: tileRecipes, to: "/store/recipes" },
  { id: "subscription", title: "الاشتراكات", img: tileSubscription, to: "/store/subscription" },
  { id: "wholesale", title: "ريف الجملة", img: tileWholesale, to: "/store/wholesale" },
  { id: "pharmacy", title: "الصيدلية", img: tilePharmacy, to: "/store/pharmacy" },
  { id: "library", title: "مكتبة الطلبة", img: tileLibrary, to: "/store/library" },
  { id: "home", title: "الأدوات المنزلية", img: tileHome, to: "/store/home" },
];

const HomePage = () => {
  return (
    <div className="space-y-6">
      <section className="animate-float-up">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" strokeWidth={2.4} />
          <span>التوصيل إلى</span>
          <span className="font-bold text-foreground">المعادي، القاهرة</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-balance">
          صباح الخير،
          <br />
          <span className="text-primary">ماذا نُحضّر اليوم؟</span>
        </h1>
      </section>

      <Link
        to="/sections"
        className="glass flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-right shadow-soft animate-float-up"
        style={{ animationDelay: "80ms" }}
      >
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.4} />
        <span className="text-sm text-muted-foreground">ابحث عن منتج، وصفة، أو قسم…</span>
      </Link>

      <section
        className="relative overflow-hidden rounded-[1.5rem] p-4 shadow-tile animate-float-up"
        style={{
          animationDelay: "120ms",
          background: "linear-gradient(135deg, hsl(142 45% 30%), hsl(142 35% 42%) 60%, hsl(45 70% 60%))",
        }}
      >
        <div className="absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex-1">
            <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              عرض اليوم
            </span>
            <h3 className="mt-2 font-display text-lg font-extrabold leading-tight text-white text-balance tabular-nums">
              وفّر 25٪ على وصفات الشيف
            </h3>
            <p className="mt-0.5 text-[10px] text-white/85">عند اشتراكك في باقة الأسبوع الأول</p>
          </div>
          <Link to="/store/recipes" className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[11px] font-bold text-primary shadow-pill">
            اطلب
          </Link>
        </div>
      </section>

      <section className="animate-float-up" style={{ animationDelay: "160ms" }}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {quickShortcuts.map((s) => (
            <Link
              key={s.id}
              to={s.to}
              className="group relative flex h-24 w-32 shrink-0 flex-col justify-end overflow-hidden rounded-2xl shadow-soft tile-overlay"
            >
              <img src={s.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <span className="relative z-10 p-2.5 font-display text-sm font-bold text-white drop-shadow">
                {s.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <ProductCarousel title="الأكثر مبيعًا" subtitle="اختيارات يثق بها آلاف العملاء" accent="🔥 رائج" products={byBadge("best")} seeAllTo="/sections" />
      <ProductCarousel title="رائج هذا الأسبوع" accent="📈 الأعلى تفاعلًا" products={byBadge("trending")} seeAllTo="/sections" />
      <ProductCarousel title="اختيارات الشيف" subtitle="منتجات مختارة بعناية" accent="⭐ مميّز" products={byBadge("premium")} seeAllTo="/store/recipes" />
      <ProductCarousel title="وصل حديثًا" accent="✨ جديد" products={byBadge("new")} seeAllTo="/sections" />

      <section className="animate-float-up">
        <h2 className="mb-3 px-1 font-display text-xl font-extrabold text-foreground">استكشف بطريقتك</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Sparkles, title: "مختارات لك", sub: "بناءً على تفضيلاتك", to: "/sections" },
            { icon: Clock, title: "تحت 30 دقيقة", sub: "وجبات سريعة", to: "/store/kitchen" },
            { icon: Flame, title: "خصومات حارة", sub: "حتى 40٪", to: "/offers" },
            { icon: Award, title: "الأعلى تقييمًا", sub: "من العملاء", to: "/sections" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <Link key={i} to={c.to} className="glass-strong flex flex-col gap-2 rounded-2xl p-4 shadow-soft transition ease-apple hover:-translate-y-0.5 active:scale-[0.98]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="font-display text-sm font-extrabold text-foreground">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">{c.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 font-display text-xl font-extrabold text-foreground">من جميع الأقسام</h2>
        <div className="grid grid-cols-2 gap-3">
          {products.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="font-display text-xl font-extrabold text-foreground">أقسام المتجر</h2>
          <Link to="/sections" className="flex items-center gap-1 text-xs font-bold text-primary">
            الكل <ChevronLeft className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {allStores.map((s) => (
            <Link
              key={s.id}
              to={s.to}
              className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-2xl shadow-soft tile-overlay"
            >
              <img src={s.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-apple group-hover:scale-110" />
              <span className="relative z-10 p-2 font-display text-[11px] font-bold leading-tight text-white drop-shadow">
                {s.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p className="pt-4 text-center text-[11px] font-medium text-muted-foreground">
        ريف المدينة · عبق الريف داخل المدينة
      </p>
    </div>
  );
};

export default HomePage;