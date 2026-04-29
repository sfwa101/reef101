import { memo, useEffect, useState } from "react";
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

import { MeshBg, MotifIcon, motifInk, type MotifId } from "@/components/sections/MeshTile";

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
/* Vector-driven cards — no images, pastel SVG backdrops                */
/* ------------------------------------------------------------------ */

type HeroCard = {
  id: string;
  title: string;
  desc: string;
  to: string;
  motif: MotifId;
  badge?: string;
};

const heroPrimary: (HeroCard & { size: "wide" | "tall" | "half" })[] = [
  { id: "village",     title: "منتجات القرية",  desc: "بوتيك المزرعة الفاخر · 150+ منتج طبيعي", to: "/store/village",     motif: "village",     badge: "حصري",        size: "wide" },
  { id: "supermarket", title: "السوبر ماركت",   desc: "كل المقاضي في مكان واحد",                 to: "/store/supermarket", motif: "supermarket", badge: "الأكثر طلباً", size: "tall" },
  { id: "kitchen",     title: "مطبخ ريف",       desc: "وجبات جاهزة طازجة يومياً",                to: "/store/kitchen",     motif: "kitchen",     size: "half" },
  { id: "produce",     title: "الخضار والفواكه", desc: "حصاد اليوم من المزرعة",                  to: "/store/produce",     motif: "produce",     size: "half" },
];

const heroSecondary: HeroCard[] = [
  { id: "dairy",       title: "الألبان",        desc: "من المزرعة مباشرة",     to: "/store/dairy",       motif: "dairy" },
  { id: "meat",        title: "اللحوم",         desc: "طازجة وموثوقة",          to: "/store/meat",        motif: "meat" },
  { id: "restaurants", title: "مطاعم مختارة",   desc: "أفضل مطاعم المدينة",     to: "/store/restaurants", motif: "restaurants" },
  { id: "sweets",      title: "حلويات وتورتة",  desc: "لمسة حلوة لكل مناسبة",   to: "/store/sweets",      motif: "sweets" },
  { id: "baskets",     title: "سلال الريف",     desc: "سلال أسبوعية موفّرة",    to: "/store/baskets",     motif: "baskets", badge: "وفّر 20%" },
  { id: "recipes",     title: "وصفات الشيف",    desc: "أطباق بخطوات سهلة",      to: "/store/recipes",     motif: "recipes" },
];

const specialty: HeroCard[] = [
  { id: "pharmacy", title: "صيدلية ريف",       desc: "صحتك أولاً · فيتامينات وأدوية", to: "/store/pharmacy", motif: "pharmacy" },
  { id: "library",  title: "مكتبة الطلبة",     desc: "قرطاسية وطباعة وأدوات مدرسية",   to: "/store/library",  motif: "library" },
  { id: "home",     title: "أدوات المنزل",     desc: "كل ما يحتاجه بيتك",              to: "/store/home",     motif: "home", badge: "جديد" },
  { id: "gifts",    title: "الهدايا والتغليف", desc: "تغليف فاخر لكل مناسبة",          to: "/sub/gifts",      motif: "gifts" },
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
  motif: MotifId;
  icon: LucideIcon;
};

const smartShopping: SmartCard[] = [
  { id: "subs",      title: "الاشتراكات الأسبوعية", pitch: "اضمن حصتك أسبوعياً · توصيل تلقائي", saving: "وفّر حتى 15%", to: "/store/subscription", motif: "subs",      icon: Ticket },
  { id: "wholesale", title: "ريف الجملة",            pitch: "اشترِ بالكمية للبيت أو المشروع",   saving: "وفّر حتى 30%", to: "/store/wholesale",    motif: "wholesale", icon: Package },
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
/* Tiles — vector backdrops, defined OUTSIDE the page                  */
/* ------------------------------------------------------------------ */

const TILE_SHADOW =
  "0 1px 2px rgba(15,23,42,.04), 0 6px 18px -10px rgba(15,23,42,.18), 0 22px 40px -28px rgba(15,23,42,.22)";

const HeroTile = memo(({
  card,
  className,
  onPick,
}: {
  card: HeroCard;
  className: string;
  onPick: (to: string) => void;
}) => {
  const ink = motifInk(card.motif);
  return (
    <button
      onClick={() => onPick(card.to)}
      className={`relative overflow-hidden rounded-[24px] text-right ring-1 ring-black/5 transition-transform duration-200 ease-apple active:scale-[0.97] ${className}`}
      style={{ boxShadow: TILE_SHADOW, contain: "layout paint" }}
      aria-label={card.title}
    >
      <MeshBg motif={card.motif} />

      {/* Inline SVG icon — top-left corner */}
      <div
        className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/70 backdrop-blur-md"
        style={{ color: ink, boxShadow: "0 6px 14px -8px rgba(15,23,42,.25)" }}
        aria-hidden
      >
        <MotifIcon motif={card.motif} className="h-5 w-5" />
      </div>

      {card.badge && (
        <span
          className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-white/60"
          style={{ color: ink, boxShadow: "0 4px 10px -6px rgba(15,23,42,.2)" }}
        >
          {card.badge}
        </span>
      )}

      {/* Glass title chip — bottom */}
      <div className="absolute inset-x-3 bottom-3">
        <div
          className="rounded-2xl bg-white/60 px-3.5 py-2.5 ring-1 ring-white/70 backdrop-blur-md"
          style={{ boxShadow: "0 8px 22px -14px rgba(15,23,42,.25)" }}
        >
          <h3
            className="font-display text-[16px] font-extrabold leading-tight"
            style={{ color: ink }}
          >
            {card.title}
          </h3>
          <p
            className="mt-0.5 text-[11.5px] font-medium leading-snug line-clamp-1"
            style={{ color: ink, opacity: 0.72 }}
          >
            {card.desc}
          </p>
        </div>
      </div>
    </button>
  );
});
HeroTile.displayName = "HeroTile";

const SmartTile = memo(({
  s,
  onPick,
}: {
  s: SmartCard;
  onPick: (to: string) => void;
}) => {
  const ink = motifInk(s.motif);
  return (
    <button
      onClick={() => onPick(s.to)}
      className="relative h-[160px] overflow-hidden rounded-[22px] text-right ring-1 ring-black/5 transition-transform duration-200 ease-apple active:scale-[0.97]"
      style={{ boxShadow: TILE_SHADOW, contain: "layout paint" }}
      aria-label={s.title}
    >
      <MeshBg motif={s.motif} />

      <div
        className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/70 backdrop-blur-md"
        style={{ color: ink, boxShadow: "0 6px 14px -8px rgba(15,23,42,.25)" }}
        aria-hidden
      >
        <MotifIcon motif={s.motif} className="h-5 w-5" />
      </div>

      <span
        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-white/60"
        style={{ color: ink, boxShadow: "0 4px 10px -6px rgba(15,23,42,.2)" }}
      >
        💸 {s.saving}
      </span>

      <div className="absolute inset-x-3 bottom-3">
        <div
          className="rounded-2xl bg-white/60 px-3.5 py-2.5 ring-1 ring-white/70 backdrop-blur-md"
          style={{ boxShadow: "0 8px 22px -14px rgba(15,23,42,.25)" }}
        >
          <h3
            className="font-display text-[16px] font-extrabold leading-tight"
            style={{ color: ink }}
          >
            {s.title}
          </h3>
          <p
            className="mt-0.5 text-[11px] font-medium leading-snug line-clamp-1"
            style={{ color: ink, opacity: 0.72 }}
          >
            {s.pitch}
          </p>
          <span
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold"
            style={{ color: ink }}
          >
            ابدأ التوفير <ArrowLeft className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
});
SmartTile.displayName = "SmartTile";

/* `cv` = content-visibility: auto — lets the browser skip painting/layout for
   sections that aren't on screen yet. Big perf win on long pages. */
const cv = {
  contentVisibility: "auto" as const,
  containIntrinsicSize: "1px 360px",
};

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

