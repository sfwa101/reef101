import { useNavigate } from "@tanstack/react-router";

import {
  Wheat,
  Boxes,
  Cookie,
  Nut,
  CupSoda,
  Baby,
  PartyPopper,
  SprayCan,
  Crown,
  Sparkles,
  ChevronLeft,
  Ticket,
  Package,
  ArrowLeft,
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
import tilePharmacy from "@/assets/tile-pharmacy.jpg";
import tileLibrary from "@/assets/tile-library.jpg";
import tileHome from "@/assets/tile-home.jpg";
import tileGifts from "@/assets/tile-gifts.jpg";

/* ------------------------------------------------------------------ */
/* Adaptive accent palette (kept for chips + smart-shopping cards)     */
/* ------------------------------------------------------------------ */

type Accent = { surface: string; ink: string; shadow: string };

const accents = {
  sand:  { surface: "40 45% 93%",  ink: "32 38% 30%", shadow: "32 35% 30%" },
  steel: { surface: "215 22% 92%", ink: "215 28% 28%", shadow: "215 25% 28%" },
  honey: { surface: "45 65% 90%",  ink: "35 65% 36%",  shadow: "35 60% 36%" },
  amber: { surface: "38 65% 92%",  ink: "30 60% 36%",  shadow: "30 55% 36%" },
  ocean: { surface: "200 42% 92%", ink: "205 50% 30%", shadow: "205 45% 30%" },
  rose:  { surface: "350 50% 94%", ink: "345 45% 40%", shadow: "345 45% 40%" },
  plum:  { surface: "295 32% 93%", ink: "290 35% 36%", shadow: "290 35% 36%" },
  mint:  { surface: "162 38% 92%", ink: "168 42% 28%", shadow: "168 40% 28%" },
} as const satisfies Record<string, Accent>;

type AccentKey = keyof typeof accents;

/* ------------------------------------------------------------------ */
/* Image-driven cards                                                  */
/* ------------------------------------------------------------------ */

type HeroCard = {
  id: string;
  title: string;
  desc: string;
  to: string;
  image: string;
  overlay: string;
  badge?: string;
};

const heroPrimary: (HeroCard & { size: "wide" | "tall" | "half" })[] = [
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

const heroSecondary: HeroCard[] = [
  { id: "dairy",       title: "الألبان",        desc: "من المزرعة مباشرة",     to: "/store/dairy",       image: tileDairy,       overlay: "32 45% 16%" },
  { id: "meat",        title: "اللحوم",         desc: "طازجة وموثوقة",          to: "/store/meat",        image: tileMeat,        overlay: "5 50% 12%" },
  { id: "restaurants", title: "مطاعم مختارة",   desc: "أفضل مطاعم المدينة",     to: "/store/restaurants", image: tileRestaurants, overlay: "200 45% 12%" },
  { id: "sweets",      title: "حلويات وتورتة",  desc: "لمسة حلوة لكل مناسبة",   to: "/store/sweets",      image: tileSweets,      overlay: "335 40% 18%" },
  { id: "baskets",     title: "سلال الريف",     desc: "سلال أسبوعية موفّرة",    to: "/store/baskets",     image: tileBaskets,     overlay: "28 45% 16%", badge: "وفّر 20%" },
  { id: "recipes",     title: "وصفات الشيف",    desc: "أطباق بخطوات سهلة",      to: "/store/recipes",     image: tileRecipes,     overlay: "15 45% 16%" },
];

/* Specialty stores — promoted from "services" to image hero cards */
const specialty: HeroCard[] = [
  { id: "pharmacy", title: "صيدلية ريف",      desc: "صحتك أولاً · فيتامينات وأدوية", to: "/store/pharmacy",  image: tilePharmacy, overlay: "168 40% 14%" },
  { id: "library",  title: "مكتبة الطلبة",    desc: "قرطاسية وطباعة وأدوات مدرسية",   to: "/store/library",   image: tileLibrary,  overlay: "205 45% 14%" },
  { id: "home",     title: "أدوات المنزل",    desc: "كل ما يحتاجه بيتك",              to: "/store/home",      image: tileHome,     overlay: "215 25% 14%", badge: "جديد" },
  { id: "gifts",    title: "الهدايا والتغليف",desc: "تغليف فاخر لكل مناسبة",          to: "/sub/gifts",       image: tileGifts,    overlay: "345 40% 18%" },
];

/* ------------------------------------------------------------------ */
/* Smart shopping (subscriptions + wholesale)                          */
/* ------------------------------------------------------------------ */

type SmartCard = {
  id: string;
  title: string;
  pitch: string;
  saving: string;
  to: string;
  image: string;
  gradient: string;
  icon: LucideIcon;
};

const smartShopping: SmartCard[] = [
  {
    id: "subs",
    title: "الاشتراكات الأسبوعية",
    pitch: "اضمن حصتك أسبوعياً · توصيل تلقائي",
    saving: "وفّر حتى 15%",
    to: "/store/subscription",
    image: tileSubscription,
    gradient: "linear-gradient(135deg, hsl(150 50% 28%) 0%, hsl(165 45% 22%) 100%)",
    icon: Ticket,
  },
  {
    id: "wholesale",
    title: "ريف الجملة",
    pitch: "اشترِ بالكمية للبيت أو المشروع",
    saving: "وفّر حتى 30%",
    to: "/store/wholesale",
    image: tileWholesale,
    gradient: "linear-gradient(135deg, hsl(28 65% 32%) 0%, hsl(18 60% 24%) 100%)",
    icon: Package,
  },
];

/* ------------------------------------------------------------------ */
/* Sub-rails                                                            */
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
/* Lazy image — native lazy, no React state churn                      */
/* ------------------------------------------------------------------ */

const LazyImg = ({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    width={1024}
    height={768}
    className={className}
  />
);

/* ------------------------------------------------------------------ */
/* Tiles — defined OUTSIDE the page so they don't re-create per render */
/* ------------------------------------------------------------------ */

const TILE_SHADOW = "0 8px 22px -14px rgba(0,0,0,.22)";

const HeroTile = ({
  card,
  className,
  onPick,
}: {
  card: HeroCard;
  className: string;
  onPick: (to: string) => void;
}) => (
  <button
    onClick={() => onPick(card.to)}
    className={`relative overflow-hidden rounded-[24px] text-right ring-1 ring-black/5 transition-transform duration-200 ease-apple active:scale-[0.97] ${className}`}
    style={{ boxShadow: TILE_SHADOW, contain: "layout paint" }}
    aria-label={card.title}
  >
    <LazyImg
      src={card.image}
      className="absolute inset-0 h-full w-full object-cover"
    />
    <span
      aria-hidden
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg, hsl(${card.overlay} / 0.05) 0%, hsl(${card.overlay} / 0.45) 55%, hsl(${card.overlay} / 0.88) 100%)`,
      }}
    />
    {card.badge && (
      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-foreground shadow-sm">
        {card.badge}
      </span>
    )}
    <div className="relative flex h-full w-full flex-col justify-end p-4">
      <h3 className="font-display text-[19px] font-extrabold leading-tight text-white drop-shadow-sm">
        {card.title}
      </h3>
      <p className="mt-1 text-[12px] font-medium leading-snug text-white/85 line-clamp-2">
        {card.desc}
      </p>
    </div>
  </button>
);

const SmartTile = ({
  s,
  onPick,
}: {
  s: SmartCard;
  onPick: (to: string) => void;
}) => (
  <button
    onClick={() => onPick(s.to)}
    className="relative h-[150px] overflow-hidden rounded-[22px] text-right ring-1 ring-black/5 transition-transform duration-200 ease-apple active:scale-[0.97]"
    style={{ boxShadow: TILE_SHADOW, contain: "layout paint" }}
    aria-label={s.title}
  >
    <LazyImg
      src={s.image}
      className="absolute inset-0 h-full w-full object-cover opacity-50"
    />
    <span aria-hidden className="absolute inset-0" style={{ background: s.gradient, opacity: 0.85 }} />
    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-foreground shadow-sm">
      💸 {s.saving}
    </span>
    <div className="relative flex h-full w-full flex-col justify-between p-4">
      <s.icon className="h-6 w-6 text-white/95" strokeWidth={2.2} />
      <div>
        <h3 className="font-display text-[18px] font-extrabold leading-tight text-white drop-shadow-sm">
          {s.title}
        </h3>
        <p className="mt-1 text-[11.5px] font-medium leading-snug text-white/85 line-clamp-2">
          {s.pitch}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-white/95">
          ابدأ التوفير <ArrowLeft className="h-3 w-3" />
        </span>
      </div>
    </div>
  </button>
);

const RailChip = ({
  c,
  onPick,
}: {
  c: PantryChip;
  onPick: (to: string) => void;
}) => {
  const a = accents[c.accent];
  return (
    <button
      onClick={() => onPick(c.to)}
      className="flex shrink-0 snap-start items-center gap-2 rounded-full px-3.5 py-2 ring-1 ring-border/50 transition-transform duration-150 ease-apple active:scale-95"
      style={{ background: `hsl(${a.surface})` }}
    >
      <c.icon className="h-3.5 w-3.5" strokeWidth={2.2} style={{ color: `hsl(${a.ink})` }} />
      <span className="whitespace-nowrap text-[11.5px] font-bold" style={{ color: `hsl(${a.ink})` }}>
        {c.title}
      </span>
    </button>
  );
};

/* ------------------------------------------------------------------ */

const Sections = () => {
  const navigate = useNavigate();
  const go = (to: string) => navigate({ to: to as never });

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
      <section>
        <div className="grid grid-cols-2 gap-3">
          <HeroTile card={heroPrimary[0]} onPick={go} className="col-span-2 h-[210px]" />
          <HeroTile card={heroPrimary[1]} onPick={go} className="row-span-2 h-[232px]" />
          <HeroTile card={heroPrimary[2]} onPick={go} className="h-[110px]" />
          <HeroTile card={heroPrimary[3]} onPick={go} className="h-[110px]" />
        </div>

        {/* Pantry rail */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-muted-foreground">
              تصنيفات داخل السوبر ماركت
            </span>
            <button
              onClick={() => go("/store/supermarket")}
              className="flex items-center gap-0.5 text-[11px] font-bold text-foreground/70"
            >
              الكل <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x gap-2">
              {pantryRail.map((c) => (
                <RailChip key={c.id} c={c} onPick={go} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════ Curated Experiences ═════ */}
      <section>
        <div className="mb-3 px-1">
          <h2 className="font-display text-[17px] font-extrabold leading-tight text-foreground">
            تجارب مختارة
          </h2>
          <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
            نكهات وأقسام بهوية مميزة
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {heroSecondary.map((c) => (
            <HeroTile key={c.id} card={c} onPick={go} className="h-[150px]" />
          ))}
        </div>
      </section>

      {/* ═════ Specialty Stores ═════ */}
      <section>
        <div className="mb-3 px-1">
          <h2 className="font-display text-[17px] font-extrabold leading-tight text-foreground">
            متاجر متخصصة
          </h2>
          <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
            أقسام كبرى لكل احتياج
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {specialty.map((c) => (
            <HeroTile key={c.id} card={c} onPick={go} className="h-[150px]" />
          ))}
        </div>
      </section>

      {/* ═════ Personal Care rail ═════ */}
      <section>
        <div className="mb-2 px-1">
          <h2 className="font-display text-[15px] font-extrabold leading-tight text-foreground">
            العناية الشخصية والمنزلية
          </h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex snap-x gap-2">
            {personalRail.map((c) => (
              <RailChip key={c.id} c={c} onPick={go} />
            ))}
          </div>
        </div>
      </section>

      {/* ═════ Smart Shopping ═════ */}
      <section>
        <div className="mb-3 px-1">
          <h2 className="font-display text-[17px] font-extrabold leading-tight text-foreground">
            طرق تسوّق ذكية
          </h2>
          <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
            توفير مستمر وراحة بال
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {smartShopping.map((s) => (
            <SmartTile key={s.id} s={s} onPick={go} />
          ))}
        </div>
      </section>

      <p className="pt-2 text-center text-[11px] font-medium text-muted-foreground">
        ريف المدينة · عبق الريف داخل المدينة
      </p>
    </div>
  );
};

export default Sections;

