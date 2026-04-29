import { useNavigate } from "@tanstack/react-router";
import {
  ShoppingBasket,
  ChefHat,
  Sprout,
  Apple,
  Milk,
  Beef,
  Snowflake,
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
  Soap,
  Crown,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Premium adaptive palette — soft pastel tints in light, neon-muted   */
/* in dark. Each entry exposes (tint, ink) pairs read by the cards.    */
/* ------------------------------------------------------------------ */

type Accent = {
  /** soft circular halo behind icon (light mode) */
  tint: string;
  /** icon + accent stroke color */
  ink: string;
  /** subtle colored shadow tint for the card on hover */
  shadow: string;
};

const accents: Record<string, Accent> = {
  sage:    { tint: "140 40% 92%", ink: "150 45% 32%", shadow: "150 40% 30%" },
  olive:   { tint: "75 35% 88%",  ink: "85 35% 30%",  shadow: "85 35% 28%" },
  amber:   { tint: "38 70% 90%",  ink: "30 60% 38%",  shadow: "30 55% 38%" },
  terra:   { tint: "18 60% 90%",  ink: "14 55% 38%",  shadow: "14 50% 38%" },
  rose:    { tint: "350 55% 92%", ink: "345 45% 42%", shadow: "345 45% 42%" },
  plum:    { tint: "295 35% 92%", ink: "290 35% 38%", shadow: "290 35% 38%" },
  ocean:   { tint: "200 45% 90%", ink: "205 50% 32%", shadow: "205 45% 32%" },
  mint:    { tint: "165 40% 90%", ink: "170 40% 30%", shadow: "170 40% 30%" },
  sand:    { tint: "40 45% 90%",  ink: "32 35% 32%",  shadow: "32 35% 32%" },
  steel:   { tint: "215 25% 90%", ink: "215 25% 30%", shadow: "215 25% 30%" },
  brick:   { tint: "8 50% 90%",   ink: "5 50% 38%",   shadow: "5 50% 38%" },
  honey:   { tint: "45 70% 88%",  ink: "35 65% 38%",  shadow: "35 60% 38%" },
};

type Item = {
  id: string;
  title: string;
  desc: string;
  to: string;
  icon: LucideIcon;
  accent: keyof typeof accents;
};

type Group = {
  id: string;
  title: string;
  caption: string;
  items: Item[];
};

const groups: Group[] = [
  {
    id: "essentials",
    title: "الأساسيات",
    caption: "كل ما تحتاجه يومياً",
    items: [
      { id: "supermarket", title: "السوبر ماركت", desc: "كل المقاضي في مكان واحد", to: "/store/supermarket", icon: ShoppingBasket, accent: "sage" },
      { id: "kitchen",     title: "مطبخ ريف",     desc: "وجبات جاهزة طازجة",        to: "/store/kitchen",     icon: ChefHat,        accent: "terra" },
      { id: "village",     title: "منتجات القرية", desc: "150+ منتج طبيعي",         to: "/store/village",     icon: Sprout,         accent: "olive" },
      { id: "produce",     title: "الخضار والفواكه", desc: "حصاد اليوم",            to: "/store/produce",     icon: Apple,          accent: "mint" },
      { id: "dairy",       title: "الألبان",       desc: "من المزرعة مباشرة",       to: "/store/dairy",       icon: Milk,           accent: "sand" },
      { id: "meat",        title: "اللحوم",        desc: "طازجة وموثوقة",           to: "/store/meat",        icon: Beef,           accent: "brick" },
    ],
  },
  {
    id: "experiences",
    title: "تجارب الطعام",
    caption: "نكهات مختارة بعناية",
    items: [
      { id: "recipes",     title: "وصفات الشيف",   desc: "أطباق بخطوات سهلة",      to: "/store/recipes",     icon: Sparkles,       accent: "honey" },
      { id: "restaurants", title: "مطاعم مختارة",  desc: "أفضل المطاعم",            to: "/store/restaurants", icon: UtensilsCrossed, accent: "ocean" },
      { id: "sweets",      title: "حلويات وتورتة", desc: "لمسة حلوة لكل مناسبة",    to: "/store/sweets",      icon: Cake,           accent: "rose" },
      { id: "frozen",      title: "المجمدات",      desc: "وجبات سريعة جاهزة",       to: "/sub/canned",        icon: Snowflake,      accent: "steel" },
    ],
  },
  {
    id: "value",
    title: "وفّر أكثر",
    caption: "اشتراكات وعروض الجملة",
    items: [
      { id: "subscriptions", title: "الاشتراكات", desc: "وفّر شهرياً",               to: "/store/subscription", icon: Ticket,        accent: "plum" },
      { id: "baskets",       title: "سلال الريف", desc: "سلال أسبوعية موفرة",       to: "/store/baskets",      icon: ShoppingBag,   accent: "amber" },
      { id: "wholesale",     title: "ريف الجملة", desc: "وفّر بالكمية",              to: "/store/wholesale",    icon: Package,       accent: "steel" },
    ],
  },
  {
    id: "services",
    title: "الخدمات",
    caption: "حلول لحياتك اليومية",
    items: [
      { id: "library",  title: "مكتبة الطلبة", desc: "قرطاسية · كتب · طباعة",     to: "/store/library",   icon: GraduationCap, accent: "ocean" },
      { id: "pharmacy", title: "الصيدلية",     desc: "صحتك أولاً",                 to: "/store/pharmacy",  icon: Pill,          accent: "mint" },
      { id: "gifts",    title: "الهدايا",       desc: "تغليف لكل مناسبة",           to: "/sub/gifts",       icon: Gift,          accent: "rose" },
      { id: "home",     title: "أدوات المنزل", desc: "كل ما يحتاجه البيت",        to: "/store/home",      icon: Wrench,        accent: "steel" },
    ],
  },
  {
    id: "pantry",
    title: "البقالة والمؤن",
    caption: "أساسيات المطبخ",
    items: [
      { id: "rice",   title: "أرز وبقالة",     desc: "حبوب ومؤن",         to: "/sub/rice",   icon: Wheat,       accent: "sand" },
      { id: "canned", title: "معلبات",         desc: "جاهزة دائماً",       to: "/sub/canned", icon: Boxes,       accent: "steel" },
      { id: "bakery", title: "مخبوزات",        desc: "طازجة يومياً",       to: "/sub/bakery", icon: Cookie,      accent: "honey" },
      { id: "snacks", title: "تسالي ومكسرات", desc: "خفيفة وممتعة",       to: "/sub/snacks", icon: Nut,         accent: "amber" },
      { id: "drinks", title: "مشروبات",        desc: "بارد ومنعش",         to: "/sub/drinks", icon: CupSoda,     accent: "ocean" },
      { id: "treats", title: "مفرحات",         desc: "هدايا وحلويات",      to: "/sub/treats", icon: PartyPopper, accent: "rose" },
    ],
  },
  {
    id: "personal",
    title: "العناية الشخصية",
    caption: "لك ولعائلتك",
    items: [
      { id: "personal", title: "العناية الشخصية", desc: "إطلالة وراحة",        to: "/sub/personal", icon: Crown, accent: "plum" },
      { id: "baby",     title: "العناية بالطفل",  desc: "كل ما يحتاجه طفلك",  to: "/sub/baby",     icon: Baby,  accent: "ocean" },
      { id: "women",    title: "عالم المرأة",      desc: "إكسسوارات وأكثر",    to: "/sub/women",    icon: Sparkles, accent: "rose" },
      { id: "paper",    title: "ورقيات ومنظفات",  desc: "نظافة ولمعان",        to: "/sub/paper",    icon: Soap,  accent: "mint" },
    ],
  },
];

const Sections = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-6">
      {/* Page header */}
      <header className="px-1 pt-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          الأقسام
        </h1>
        <p className="mt-1 text-[12.5px] font-medium text-muted-foreground">
          استكشف كل ما يقدمه ريف المدينة بأناقة
        </p>
      </header>

      {groups.map((group, gIdx) => (
        <section
          key={group.id}
          className="animate-float-up"
          style={{ animationDelay: `${gIdx * 70}ms` }}
        >
          {/* Group header — refined typographic hierarchy */}
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <h2 className="font-display text-[17px] font-extrabold leading-tight text-foreground">
                {group.title}
              </h2>
              <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
                {group.caption}
              </p>
            </div>
            <span className="rounded-full bg-foreground/[0.04] px-2.5 py-1 text-[10.5px] font-bold text-muted-foreground ring-1 ring-border/40">
              {group.items.length}
            </span>
          </div>

          {/* Premium cards grid — glass surface, colored only on the icon halo */}
          <div className="grid grid-cols-2 gap-3">
            {group.items.map((item, idx) => {
              const Icon = item.icon;
              const a = accents[item.accent];
              return (
                <button
                  key={item.id}
                  onClick={() => navigate({ to: item.to as never })}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-[20px] bg-card/80 p-3.5 text-right ring-1 ring-border/50 backdrop-blur-xl transition-all duration-200 ease-apple hover:-translate-y-0.5 active:scale-[0.97] dark:bg-card/40"
                  style={{
                    animationDelay: `${idx * 35}ms`,
                    boxShadow: `0 1px 2px hsl(${a.shadow} / 0.05), 0 10px 24px -14px hsl(${a.shadow} / 0.18)`,
                  }}
                  aria-label={item.title}
                >
                  {/* faint colored aura that intensifies on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
                    style={{ background: `hsl(${a.tint})` }}
                  />

                  {/* Icon halo — the only colored block */}
                  <div
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `hsl(${a.tint})`,
                      // @ts-expect-error CSS var
                      "--ring": `hsl(${a.ink} / 0.12)`,
                      boxShadow: `inset 0 0 0 1px hsl(${a.ink} / 0.08)`,
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={2.1}
                      style={{ color: `hsl(${a.ink})` }}
                    />
                  </div>

                  {/* Text block */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-[13.5px] font-extrabold leading-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <p className="pt-2 text-center text-[11px] font-medium text-muted-foreground">
        ريف المدينة · عبق الريف داخل المدينة
      </p>
    </div>
  );
};

export default Sections;
