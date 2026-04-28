import { useNavigate } from "@tanstack/react-router";
import {
  ShoppingBasket,
  ChefHat,
  Utensils,
  Apple,
  Milk,
  Beef,
  PackageOpen,
  Gift,
  Sprout,
  Cake,
  Pill,
  Wheat,
  Boxes,
  Cookie,
  Nut,
  CupSoda,
  SprayCan,
  CookingPot,
  Baby,
  HeartPulse,
  Sparkles,
  PartyPopper,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";

type LargeSection = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  icon: LucideIcon;
  gradient: string;
  size: "lg" | "md";
};

const largeSections: LargeSection[] = [
  {
    id: "supermarket",
    title: "السوبرماركت",
    subtitle: "كل ما تحتاجه يوميًا",
    to: "/store/supermarket",
    icon: ShoppingBasket,
    gradient: "linear-gradient(135deg, hsl(142 55% 38%), hsl(155 65% 60%))",
    size: "lg",
  },
  {
    id: "kitchen",
    title: "مطبخ ريف المدينة",
    subtitle: "وجبات طازجة كل يوم",
    to: "/store/kitchen",
    icon: ChefHat,
    gradient: "linear-gradient(135deg, hsl(18 75% 50%), hsl(35 85% 65%))",
    size: "md",
  },
  {
    id: "restaurants",
    title: "مطاعم",
    subtitle: "أشهى المطاعم المختارة",
    to: "/store/restaurants",
    icon: Utensils,
    gradient: "linear-gradient(135deg, hsl(0 70% 50%), hsl(15 85% 65%))",
    size: "md",
  },
  {
    id: "produce",
    title: "الخضراوات والفواكه",
    subtitle: "حصاد اليوم من المزرعة",
    to: "/store/produce",
    icon: Apple,
    gradient: "linear-gradient(135deg, hsl(95 60% 38%), hsl(80 70% 60%))",
    size: "lg",
  },
  {
    id: "dairy",
    title: "منتجات الألبان",
    subtitle: "من المزرعة مباشرة",
    to: "/store/dairy",
    icon: Milk,
    gradient: "linear-gradient(135deg, hsl(38 70% 50%), hsl(48 85% 70%))",
    size: "md",
  },
  {
    id: "meat",
    title: "اللحوم والمجمدات",
    subtitle: "طازجة ومجمدة بأعلى جودة",
    to: "/store/meat",
    icon: Beef,
    gradient: "linear-gradient(135deg, hsl(345 55% 38%), hsl(355 70% 58%))",
    size: "md",
  },
  {
    id: "wholesale",
    title: "قسم الجملة",
    subtitle: "وفّر بالحجم الكبير",
    to: "/store/wholesale",
    icon: PackageOpen,
    gradient: "linear-gradient(135deg, hsl(220 60% 22%), hsl(40 80% 55%) 130%)",
    size: "lg",
  },
  {
    id: "baskets",
    title: "سلال الريف",
    subtitle: "سلال مختارة بعناية",
    to: "/store/baskets",
    icon: Gift,
    gradient: "linear-gradient(135deg, hsl(160 55% 38%), hsl(175 65% 58%))",
    size: "md",
  },
  {
    id: "village",
    title: "منتجات القرية",
    subtitle: "خيرات الأرض الأصيلة",
    to: "/store/village",
    icon: Sprout,
    gradient: "linear-gradient(135deg, hsl(85 50% 35%), hsl(100 60% 58%))",
    size: "md",
  },
  {
    id: "sweets",
    title: "الحلويات والتورتة",
    subtitle: "لكل مناسبة حلوى مميزة",
    to: "/store/sweets",
    icon: Cake,
    gradient: "linear-gradient(135deg, hsl(330 65% 55%), hsl(350 80% 75%))",
    size: "md",
  },
  {
    id: "pharmacy",
    title: "الصيدلية",
    subtitle: "صحتك أولًا",
    to: "/store/pharmacy",
    icon: Pill,
    gradient: "linear-gradient(135deg, hsl(195 70% 42%), hsl(180 65% 60%))",
    size: "md",
  },
];

type SmallSection = {
  id: string;
  title: string;
  to: string;
  icon: LucideIcon;
  tint: string; // soft background
  ink: string; // icon color
};

const smallSections: SmallSection[] = [
  { id: "village", title: "منتجات القرية", to: "/store/village", icon: Sprout, tint: "85 65% 92%", ink: "85 55% 32%" },
  { id: "rice", title: "أرز وبقالة", to: "/sub/rice", icon: Wheat, tint: "38 80% 92%", ink: "30 70% 38%" },
  { id: "canned", title: "معلبات", to: "/sub/canned", icon: Boxes, tint: "200 60% 92%", ink: "200 60% 38%" },
  { id: "bakery", title: "مخبوزات", to: "/sub/bakery", icon: Cookie, tint: "28 80% 92%", ink: "22 70% 40%" },
  { id: "treats", title: "مفرحات", to: "/sub/treats", icon: PartyPopper, tint: "330 80% 93%", ink: "330 65% 50%" },
  { id: "snacks", title: "تسالي ومكسرات", to: "/sub/snacks", icon: Nut, tint: "35 75% 90%", ink: "30 65% 38%" },
  { id: "drinks", title: "مشروبات", to: "/sub/drinks", icon: CupSoda, tint: "190 70% 92%", ink: "195 65% 38%" },
  { id: "paper", title: "ورقيات ومنظفات", to: "/sub/paper", icon: SprayCan, tint: "210 60% 93%", ink: "215 55% 40%" },
  { id: "kitchenTools", title: "أدوات المطبخ", to: "/sub/kitchen-tools", icon: CookingPot, tint: "15 70% 92%", ink: "15 65% 42%" },
  { id: "baby", title: "العناية بالطفل", to: "/sub/baby", icon: Baby, tint: "200 80% 93%", ink: "200 70% 42%" },
  { id: "personal", title: "العناية الشخصية", to: "/sub/personal", icon: HeartPulse, tint: "340 75% 94%", ink: "340 65% 50%" },
  { id: "women", title: "عالم المرأة", to: "/sub/women", icon: Sparkles, tint: "300 70% 94%", ink: "300 55% 48%" },
  { id: "gifts", title: "الهدايا والتغليف", to: "/sub/gifts", icon: Gift, tint: "265 65% 94%", ink: "265 55% 50%" },
];

const Sections = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <section className="animate-float-up">
        <div className="relative overflow-hidden rounded-[2rem] p-6 shadow-tile" style={{ background: "var(--gradient-aurora)" }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">اكتشف</span>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground">
            أقسام ريف المدينة
          </h1>
          <p className="mt-2 max-w-[260px] text-xs font-medium text-foreground/70">
            متاجر متكاملة وأقسام منوعة، حساب واحد وسلة واحدة لكل احتياجاتك.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-card/80 px-3 py-1 text-[10px] font-bold text-foreground shadow-sm backdrop-blur">
              11 قسم رئيسي
            </span>
            <span className="rounded-full bg-card/80 px-3 py-1 text-[10px] font-bold text-foreground shadow-sm backdrop-blur">
              13 قسم فرعي
            </span>
          </div>
        </div>
      </section>

      {/* Large sections — magazine grid */}
      <section className="animate-float-up" style={{ animationDelay: "80ms" }}>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="font-display text-xl font-extrabold text-foreground">الأقسام الرئيسية</h2>
          <span className="text-[11px] font-medium text-muted-foreground">{largeSections.length} متجر</span>
        </div>

        <div className="grid grid-cols-2 auto-rows-[150px] gap-3">
          {largeSections.map((s, idx) => {
            const Icon = s.icon;
            const big = s.size === "lg";
            return (
              <button
                key={s.id}
                onClick={() => navigate({ to: s.to as never })}
                className={`group relative overflow-hidden rounded-[1.75rem] text-right shadow-tile transition-transform duration-500 ease-apple hover:-translate-y-1 active:scale-[0.98] ${
                  big ? "row-span-2" : ""
                } animate-float-up`}
                style={{ animationDelay: `${idx * 50}ms`, background: s.gradient }}
                aria-label={s.title}
              >
                {/* subtle pattern overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 10% 90%, rgba(0,0,0,0.18), transparent 50%)",
                  }}
                />

                {/* Big decorative icon */}
                <Icon
                  className={`absolute text-white/25 transition-transform duration-700 ease-apple group-hover:scale-110 ${
                    big ? "h-40 w-40 -bottom-6 -left-6" : "h-28 w-28 -bottom-4 -left-4"
                  }`}
                  strokeWidth={1.4}
                />

                <div className="relative z-10 flex h-full flex-col justify-between p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/25 backdrop-blur">
                      <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow">
                      <ChevronLeft className="h-3.5 w-3.5 text-foreground" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <h3
                      className={`font-display font-extrabold leading-tight text-white drop-shadow ${
                        big ? "text-2xl" : "text-base"
                      }`}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium text-white/85 drop-shadow">{s.subtitle}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Small sections — 3-per-row chip grid */}
      <section className="animate-float-up" style={{ animationDelay: "160ms" }}>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="font-display text-xl font-extrabold text-foreground">تسوق بالقسم</h2>
          <span className="text-[11px] font-medium text-muted-foreground">{smallSections.length} قسم</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {smallSections.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => navigate({ to: s.to as never })}
                className="group relative flex aspect-[1/1.05] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-card p-3 shadow-soft ring-1 ring-border/50 transition ease-apple hover:-translate-y-0.5 active:scale-[0.97] animate-float-up"
                style={{ animationDelay: `${idx * 35}ms` }}
                aria-label={s.title}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-110"
                  style={{ background: `hsl(${s.tint})` }}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.2} style={{ color: `hsl(${s.ink})` }} />
                </div>
                <span className="text-center text-[11px] font-bold leading-tight text-foreground">{s.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="pt-2 text-center text-[11px] font-medium text-muted-foreground">
        ريف المدينة · عبق الريف داخل المدينة
      </p>
    </div>
  );
};

export default Sections;
