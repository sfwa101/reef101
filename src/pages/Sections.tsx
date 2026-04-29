import { useNavigate } from "@tanstack/react-router";
import {
  ChefHat,
  Sprout,
  Apple,
  Milk,
  Beef,
  Sparkles,
  UtensilsCrossed,
  Cake,
  Package,
  ShoppingBag,
  Ticket,
  GraduationCap,
  Pill,
  Gift,
  Wheat,
  Boxes,
  Cookie,
  Nut,
  CupSoda,
  Baby,
  PartyPopper,
  Wrench,
  SprayCan,
  Crown,
  ShoppingBasket,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";

import tileSupermarket from "@/assets/tile-supermarket.jpg";
import tileVillage from "@/assets/tile-village.jpg";
import tileKitchen from "@/assets/tile-kitchen.jpg";
import tileProduce from "@/assets/tile-produce.jpg";
import tileDairy from "@/assets/tile-dairy.jpg";
import tileMeat from "@/assets/tile-meat.jpg";
import tileSweets from "@/assets/tile-sweets.jpg";
import tileRestaurants from "@/assets/tile-restaurants.jpg";
import tileBaskets from "@/assets/tile-baskets.jpg";
import tileRecipes from "@/assets/tile-recipes.jpg";
import tileWholesale from "@/assets/tile-wholesale.jpg";
import tileSubscription from "@/assets/tile-subscription.jpg";

/* ------------------------------------------------------------------ */
/* Premium adaptive palette — soft, low-saturation, high-brightness    */
/* tints that re-introduce identity per section without shouting.      */
/* ------------------------------------------------------------------ */

type Accent = {
  /** soft surface background (light mode) */
  surface: string;
  /** icon + accent ink color */
  ink: string;
  /** colored shadow tint */
  shadow: string;
};

const accents: Record<string, Accent> = {
  sage:  { surface: "140 38% 94%", ink: "150 45% 30%", shadow: "150 45% 30%" },
  olive: { surface: "70 35% 92%",  ink: "85 38% 28%",  shadow: "85 38% 28%" },
  amber: { surface: "38 65% 92%",  ink: "30 60% 36%",  shadow: "30 55% 36%" },
  terra: { surface: "18 55% 93%",  ink: "14 55% 36%",  shadow: "14 50% 36%" },
  rose:  { surface: "350 50% 94%", ink: "345 45% 40%", shadow: "345 45% 40%" },
  plum:  { surface: "295 32% 93%", ink: "290 35% 36%", shadow: "290 35% 36%" },
  ocean: { surface: "200 42% 92%", ink: "205 50% 30%", shadow: "205 45% 30%" },
  mint:  { surface: "162 38% 92%", ink: "168 42% 28%", shadow: "168 40% 28%" },
  sand:  { surface: "40 45% 93%",  ink: "32 38% 30%",  shadow: "32 35% 30%" },
  steel: { surface: "215 22% 92%", ink: "215 28% 28%", shadow: "215 25% 28%" },
  brick: { surface: "8 48% 93%",   ink: "5 50% 36%",   shadow: "5 50% 36%" },
  honey: { surface: "45 65% 90%",  ink: "35 65% 36%",  shadow: "35 60% 36%" },
};

type AccentKey = keyof typeof accents;

/* ------------------------------------------------------------------ */
/* Hero (large) cards — image-driven, span 2 cols                      */
/* ------------------------------------------------------------------ */

type HeroCard = {
  id: string;
  title: string;
  desc: string;
  to: string;
  image: string;
  /** gradient overlay tint (HSL string) */
  overlay: string;
  badge?: string;
  /** "wide" = full row, "tall" = 1 col span 2 rows, "half" = 1 col 1 row */
  size: "wide" | "tall" | "half";
};

const heroPrimary: HeroCard[] = [
  {
    id: "village",
    title: "منتجات القرية",
    desc: "بوتيك المزرعة الفاخر · 150+ منتج طبيعي",
    to: "/store/village",
    image: tileVillage,
    overlay: "30 45% 18%",
    badge: "حصري",
    size: "wide",
  },
  {
    id: "supermarket",
    title: "السوبر ماركت",
    desc: "كل المقاضي في مكان واحد",
    to: "/store/supermarket",
    image: tileSupermarket,
    overlay: "150 35% 14%",
    badge: "الأكثر طلباً",
    size: "tall",
  },
  {
    id: "kitchen",
    title: "مطبخ ريف",
    desc: "وجبات جاهزة طازجة يومياً",
    to: "/store/kitchen",
    image: tileKitchen,
    overlay: "14 40% 16%",
    size: "half",
  },
  {
    id: "produce",
    title: "الخضار والفواكه",
    desc: "حصاد اليوم من المزرعة",
    to: "/store/produce",
    image: tileProduce,
    overlay: "100 35% 14%",
    size: "half",
  },
];

/* ------------------------------------------------------------------ */
/* Medium image cards — 2 per row                                      */
/* ------------------------------------------------------------------ */

type MidCard = {
  id: string;
  title: string;
  desc: string;
  to: string;
  image: string;
  overlay: string;
  badge?: string;
};

const heroSecondary: MidCard[] = [
  { id: "dairy",       title: "الألبان",        desc: "من المزرعة مباشرة",     to: "/store/dairy",       image: tileDairy,       overlay: "32 45% 16%" },
  { id: "meat",        title: "اللحوم",         desc: "طازجة وموثوقة",          to: "/store/meat",        image: tileMeat,        overlay: "5 50% 12%" },
  { id: "restaurants", title: "مطاعم مختارة",   desc: "أفضل مطاعم المدينة",     to: "/store/restaurants", image: tileRestaurants, overlay: "200 45% 12%" },
  { id: "sweets",      title: "حلويات وتورتة",  desc: "لمسة حلوة لكل مناسبة",   to: "/store/sweets",      image: tileSweets,      overlay: "335 40% 18%" },
  { id: "baskets",     title: "سلال الريف",     desc: "سلال أسبوعية موفّرة",    to: "/store/baskets",     image: tileBaskets,     overlay: "28 45% 16%", badge: "وفّر 20%" },
  { id: "recipes",     title: "وصفات الشيف",    desc: "أطباق بخطوات سهلة",      to: "/store/recipes",     image: tileRecipes,     overlay: "15 45% 16%" },
];

/* ------------------------------------------------------------------ */
/* Service cards — small tinted cards (NO images)                      */
/* ------------------------------------------------------------------ */

type ServiceCard = {
  id: string;
  title: string;
  desc: string;
  to: string;
  icon: LucideIcon;
  accent: AccentKey;
};

const services: ServiceCard[] = [
  { id: "library",       title: "مكتبة الطلبة", desc: "قرطاسية وطباعة",   to: "/store/library",      icon: GraduationCap, accent: "ocean" },
  { id: "pharmacy",      title: "الصيدلية",      desc: "صحتك أولاً",        to: "/store/pharmacy",     icon: Pill,          accent: "mint" },
  { id: "gifts",         title: "الهدايا",        desc: "تغليف لكل مناسبة",  to: "/sub/gifts",          icon: Gift,          accent: "rose" },
  { id: "home",          title: "أدوات المنزل",  desc: "كل ما يحتاجه البيت",to: "/store/home",         icon: Wrench,        accent: "steel" },
  { id: "subscriptions", title: "الاشتراكات",    desc: "وفّر شهرياً",        to: "/store/subscription", icon: Ticket,        accent: "plum" },
  { id: "wholesale",     title: "ريف الجملة",    desc: "وفّر بالكمية",       to: "/store/wholesale",    icon: Package,       accent: "amber" },
];

/* ------------------------------------------------------------------ */
/* Pantry sub-categories — horizontal rail under Supermarket           */
/* ------------------------------------------------------------------ */

type PantryChip = { id: string; title: string; to: string; icon: LucideIcon; accent: AccentKey };

const pantryRail: PantryChip[] = [
  { id: "rice",     title: "أرز وبقالة",     to: "/sub/rice",     icon: Wheat,       accent: "sand" },
  { id: "canned",   title: "معلبات",          to: "/sub/canned",   icon: Boxes,       accent: "steel" },
  { id: "bakery",   title: "مخبوزات",         to: "/sub/bakery",   icon: Cookie,      accent: "honey" },
  { id: "snacks",   title: "تسالي ومكسرات",  to: "/sub/snacks",   icon: Nut,         accent: "amber" },
  { id: "drinks",   title: "مشروبات",         to: "/sub/drinks",   icon: CupSoda,     accent: "ocean" },
  { id: "treats",   title: "مفرحات",          to: "/sub/treats",   icon: PartyPopper, accent: "rose" },
];

const personalRail: PantryChip[] = [
  { id: "personal", title: "العناية الشخصية", to: "/sub/personal", icon: Crown,    accent: "plum" },
  { id: "baby",     title: "العناية بالطفل",  to: "/sub/baby",     icon: Baby,     accent: "ocean" },
  { id: "women",    title: "عالم المرأة",      to: "/sub/women",    icon: Sparkles, accent: "rose" },
  { id: "paper",    title: "ورقيات ومنظفات",  to: "/sub/paper",    icon: SprayCan, accent: "mint" },
];

/* ------------------------------------------------------------------ */

const Sections = () => {
  const navigate = useNavigate();

  const go = (to: string) => navigate({ to: to as never });

  // Hero card renderer (image background + gradient overlay)
  const HeroTile = ({ card, className }: { card: HeroCard | MidCard; className: string }) => (
    <button
      onClick={() => go(card.to)}
      className={`group relative overflow-hidden rounded-[26px] text-right ring-1 ring-black/5 transition-all duration-300 ease-apple hover:-translate-y-1 active:scale-[0.98] ${className}`}
      style={{
        boxShadow:
          "0 1px 2px rgba(0,0,0,.04), 0 8px 22px -10px rgba(0,0,0,.18), 0 22px 50px -22px rgba(0,0,0,.22)",
      }}
      aria-label={card.title}
    >
      <img
        src={card.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
        width={1024}
        height={768}
      />
      {/* gradient overlay for legibility + section identity */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, hsl(${card.overlay} / 0.05) 0%, hsl(${card.overlay} / 0.45) 55%, hsl(${card.overlay} / 0.88) 100%)`,
        }}
      />
      {/* badge */}
      {card.badge && (
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-foreground shadow-sm backdrop-blur">
          {card.badge}
        </span>
      )}
      {/* content */}
      <div className="relative flex h-full w-full flex-col justify-end p-4">
        <h3 className="font-display text-[19px] font-extrabold leading-tight text-white drop-shadow-sm">
          {card.title}
        </h3>
        <p className="mt-1 text-[12px] font-medium leading-snug text-white/85 line-clamp-2">
          {card.desc}
        </p>
      </div>
      {/* hover sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.08), transparent 40%)" }}
      />
    </button>
  );

  // Service tile (no image, tinted surface)
  const ServiceTile = ({ s }: { s: ServiceCard }) => {
    const a = accents[s.accent];
    return (
      <button
        onClick={() => go(s.to)}
        className="group relative flex items-center gap-3 overflow-hidden rounded-[20px] p-3.5 text-right ring-1 ring-border/50 transition-all duration-200 ease-apple hover:-translate-y-0.5 active:scale-[0.97]"
        style={{
          background: `linear-gradient(180deg, hsl(${a.surface}) 0%, hsl(${a.surface} / 0.5) 100%)`,
          boxShadow: `0 1px 2px hsl(${a.shadow} / 0.06), 0 10px 24px -14px hsl(${a.shadow} / 0.22)`,
        }}
        aria-label={s.title}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-inset transition-transform duration-300 group-hover:scale-110 dark:bg-white/10"
          style={{ boxShadow: `inset 0 0 0 1px hsl(${a.ink} / 0.1)` }}
        >
          <s.icon className="h-5 w-5" strokeWidth={2.1} style={{ color: `hsl(${a.ink})` }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[13.5px] font-extrabold leading-tight" style={{ color: `hsl(${a.ink})` }}>
            {s.title}
          </h3>
          <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-foreground/65">
            {s.desc}
          </p>
        </div>
      </button>
    );
  };

  // Horizontal rail chip
  const RailChip = ({ c }: { c: PantryChip }) => {
    const a = accents[c.accent];
    return (
      <button
        onClick={() => go(c.to)}
        className="flex shrink-0 snap-start items-center gap-2 rounded-full px-3.5 py-2 ring-1 ring-border/50 transition-all duration-200 ease-apple active:scale-95"
        style={{
          background: `hsl(${a.surface})`,
          boxShadow: `0 4px 12px -8px hsl(${a.shadow} / 0.3)`,
        }}
      >
        <c.icon className="h-3.5 w-3.5" strokeWidth={2.2} style={{ color: `hsl(${a.ink})` }} />
        <span className="whitespace-nowrap text-[11.5px] font-bold" style={{ color: `hsl(${a.ink})` }}>
          {c.title}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-7 pb-6">
      {/* Page header */}
      <header className="px-1 pt-1">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-foreground">
          الأقسام
        </h1>
        <p className="mt-1 text-[12.5px] font-medium text-muted-foreground">
          استكشف ريف المدينة · أقسام مختارة بعناية
        </p>
      </header>

      {/* ═════ Bento Grid: Primary Heroes ═════ */}
      <section className="animate-float-up">
        <div className="grid grid-cols-2 gap-3">
          {/* Village — full row, taller */}
          <HeroTile card={heroPrimary[0]} className="col-span-2 h-[210px]" />
          {/* Supermarket — tall (1 col, 2 rows of 110px = 232px) */}
          <HeroTile card={heroPrimary[1]} className="row-span-2 h-[232px]" />
          {/* Kitchen + Produce — half tiles */}
          <HeroTile card={heroPrimary[2]} className="h-[110px]" />
          <HeroTile card={heroPrimary[3]} className="h-[110px]" />
        </div>

        {/* Pantry rail belongs to Supermarket — placed inline beneath heroes */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-muted-foreground">
              تصنيفات داخل السوبر ماركت
            </span>
            <button
              onClick={() => go("/store/supermarket")}
              className="flex items-center gap-0.5 text-[11px] font-bold text-foreground/70 hover:text-foreground"
            >
              الكل <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x gap-2">
              {pantryRail.map((c) => (
                <RailChip key={c.id} c={c} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════ Bento Grid: Secondary Image Cards ═════ */}
      <section className="animate-float-up" style={{ animationDelay: "120ms" }}>
        <div className="mb-3 flex items-end justify-between px-1">
          <div>
            <h2 className="font-display text-[17px] font-extrabold leading-tight text-foreground">
              تجارب مختارة
            </h2>
            <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
              نكهات وأقسام بهوية مميزة
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {heroSecondary.map((c) => (
            <HeroTile key={c.id} card={c} className="h-[150px]" />
          ))}
        </div>
      </section>

      {/* ═════ Service Cards (small tinted) ═════ */}
      <section className="animate-float-up" style={{ animationDelay: "200ms" }}>
        <div className="mb-3 flex items-end justify-between px-1">
          <div>
            <h2 className="font-display text-[17px] font-extrabold leading-tight text-foreground">
              الخدمات
            </h2>
            <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
              حلول مكمّلة لحياتك اليومية
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {services.map((s) => (
            <ServiceTile key={s.id} s={s} />
          ))}
        </div>
      </section>

      {/* ═════ Personal Care rail ═════ */}
      <section className="animate-float-up" style={{ animationDelay: "260ms" }}>
        <div className="mb-2 flex items-end justify-between px-1">
          <h2 className="font-display text-[15px] font-extrabold leading-tight text-foreground">
            العناية الشخصية والمنزلية
          </h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex snap-x gap-2">
            {personalRail.map((c) => (
              <RailChip key={c.id} c={c} />
            ))}
          </div>
        </div>
      </section>

      <p className="pt-2 text-center text-[11px] font-medium text-muted-foreground">
        ريف المدينة · عبق الريف داخل المدينة
      </p>
    </div>
  );
};

export default Sections;
