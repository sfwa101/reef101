import { useNavigate } from "@tanstack/react-router";
import {
  Sprout,
  Wheat,
  Boxes,
  Cookie,
  Nut,
  CupSoda,
  Baby,
  Sparkles,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

type LargeSection = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  emoji: string;
  bg: string; // flat solid color
  ink?: string; // text color override
  span: "full" | "two" | "one"; // 3=full row, 2=two-thirds, 1=one-third
};

// Bento grid (3 columns). Rows MUST sum to 3 to avoid gaps.
// Palette: vibrant yet refined — jewel tones with depth and life.
const largeSections: LargeSection[] = [
  // Row 1 — full width hero
  { id: "supermarket",   title: "السوبر ماركت",         subtitle: "كل مقاضي البيت في مكان واحد", to: "/store/supermarket",   emoji: "🏪", bg: "#1F7A4D", span: "full" },
  // Row 2 — 2/3 + 1/3
  { id: "kitchen",       title: "مطبخ ريف المدينة",     subtitle: "مشويات وساندوتشات",          to: "/store/kitchen",       emoji: "🍱", bg: "#D85A3C", span: "two" },
  { id: "subscriptions", title: "اشتراكات الطعام",      subtitle: "وفّر شهرياً",                  to: "/store/subscription",  emoji: "🎟️", bg: "#6B4FB8", span: "one" },
  // Row 2.5 — full width chef recipes bar
  { id: "recipes",       title: "وصفات الشيف",          subtitle: "أطباق مختارة بخطوات سهلة",     to: "/store/recipes",       emoji: "👨‍🍳", bg: "#B8341F", span: "full" },
  // Row 3 — 1/3 + 2/3
  { id: "restaurants",   title: "مطاعم",                 subtitle: "مختارة",                     to: "/store/restaurants",   emoji: "🍽️", bg: "#0F4C5C", span: "one" },
  { id: "produce",       title: "الخضراوات والفواكه",  subtitle: "حصاد اليوم من المزرعة",       to: "/store/produce",       emoji: "🥗", bg: "#4E9F3D", span: "two" },
  // Row 4 — 2/3 + 1/3
  { id: "dairy",         title: "منتجات الألبان",       subtitle: "من المزرعة",                  to: "/store/dairy",         emoji: "🥛", bg: "#F2A93B", span: "two" },
  { id: "meat",          title: "اللحوم والمجمدات",    subtitle: "طازجة بأعلى جودة",           to: "/store/meat",          emoji: "🥩", bg: "#A82A2A", span: "one" },
  // Row 5 — 1/3 + 2/3
  { id: "wholesale",     title: "قسم الجملة",           subtitle: "وفّر بالكمية",                 to: "/store/wholesale",     emoji: "📦", bg: "#1E3A8A", span: "one" },
  { id: "baskets",       title: "سلال الريف",           subtitle: "وفّر أسبوعياً",                 to: "/store/baskets",       emoji: "🧺", bg: "#C8862A", span: "two" },
  // Row 6 — 2/3 + 1/3
  { id: "village",       title: "منتجات القرية",        subtitle: "خيرات الريف",                 to: "/store/village",       emoji: "🍯", bg: "#8B6F3E", span: "two" },
  { id: "sweets",        title: "الحلويات والتورتة",   subtitle: "لمسة حلوة لكل مناسبة",         to: "/store/sweets",        emoji: "🎂", bg: "#D14B7E", span: "one" },
  // Row 7 — full width pharmacy bar
  { id: "pharmacy",      title: "الصيدلية",              subtitle: "صحتك أولاً · توصيل سريع",      to: "/store/pharmacy",      emoji: "💊", bg: "#0E8A8C", span: "full" },
  // Row 8 — three equal
  { id: "personal",      title: "العناية الشخصية",      subtitle: "إطلالة وراحة",                 to: "/sub/personal",        emoji: "🧴", bg: "#9B3A6E", span: "one" },
  { id: "kitchenTools",  title: "أدوات المطبخ",         subtitle: "كل ما تحتاجه",                 to: "/sub/kitchen-tools",   emoji: "🍳", bg: "#3D6B7A", span: "one" },
  { id: "paper",         title: "ورقيات ومنظفات",       subtitle: "نظافة ولمعان",                 to: "/sub/paper",           emoji: "🧼", bg: "#2E7DAF", span: "one" },
  // Row 9 — 1/3 + 2/3
  { id: "gifts",         title: "الهدايا والتغليف",     subtitle: "لكل مناسبة هدية مميزة",        to: "/sub/gifts",           emoji: "🎁", bg: "#6E3FA3", span: "one" },
  { id: "library",       title: "مكتبة الطلبة",         subtitle: "قرطاسية · كتب · تصوير",         to: "/store/library",       emoji: "📚", bg: "#1B5E8C", span: "two" },
];

type SmallSection = {
  id: string;
  title: string;
  to: string;
  icon: LucideIcon;
  tint: string; // soft background
  ink: string; // icon color
};

// Vibrant pastel tints with rich icon colors — lively and refined.
const smallSections: SmallSection[] = [
  { id: "village", title: "منتجات القرية",            to: "/store/village", icon: Sprout,      tint: "95 55% 88%",  ink: "120 55% 28%" },
  { id: "rice",    title: "أرز وبقالة",                to: "/sub/rice",      icon: Wheat,       tint: "38 80% 88%",  ink: "28 75% 38%" },
  { id: "canned",  title: "معلبات",                    to: "/sub/canned",    icon: Boxes,       tint: "200 70% 88%", ink: "210 70% 38%" },
  { id: "bakery",  title: "مخبوزات",                   to: "/sub/bakery",    icon: Cookie,      tint: "22 80% 88%",  ink: "18 75% 40%" },
  { id: "treats",  title: "مفرحات",                    to: "/sub/treats",    icon: PartyPopper, tint: "340 80% 90%", ink: "335 70% 50%" },
  { id: "snacks",  title: "تسالي ومكسرات",            to: "/sub/snacks",    icon: Nut,         tint: "32 75% 87%",  ink: "25 70% 38%" },
  { id: "drinks",  title: "مشروبات",                   to: "/sub/drinks",    icon: CupSoda,     tint: "188 75% 88%", ink: "192 75% 36%" },
  { id: "baby",    title: "العناية بالطفل",            to: "/sub/baby",      icon: Baby,        tint: "205 80% 90%", ink: "210 75% 44%" },
  { id: "women",   title: "عالم المرأة والإكسسوارات", to: "/sub/women",     icon: Sparkles,    tint: "315 70% 90%", ink: "315 60% 48%" },
];

const Sections = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Large sections — bento grid (no top banner) */}
      <section className="animate-float-up">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="font-display text-xl font-extrabold text-foreground">الأقسام الرئيسية</h2>
          <span className="text-[11px] font-medium text-muted-foreground">{largeSections.length} قسم</span>
        </div>

        <div className="grid grid-cols-3 auto-rows-[118px] gap-2.5">
          {largeSections.map((s, idx) => {
            const colSpan =
              s.span === "full" ? "col-span-3" : s.span === "two" ? "col-span-2" : "col-span-1";
            const isLight = ["#FFFFFF", "#F4F1EA", "#EFE7DA"].includes(s.bg.toUpperCase());
            const ink = s.ink ?? (isLight ? "#1F2937" : "#FFFFFF");
            const subInk = isLight ? "rgba(59,42,26,0.65)" : "rgba(255,255,255,0.85)";
            return (
              <button
                key={s.id}
                onClick={() => navigate({ to: s.to as never })}
                className={`group relative overflow-hidden rounded-[20px] text-right shadow-tile ring-1 ring-black/5 transition-transform duration-500 ease-apple hover:-translate-y-1 active:scale-[0.97] animate-float-up ${colSpan}`}
                style={{ animationDelay: `${idx * 45}ms`, background: s.bg }}
                aria-label={s.title}
              >
                {/* soft glossy highlight */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  style={{
                    backgroundImage: isLight
                      ? "radial-gradient(circle at 85% 10%, rgba(0,0,0,0.05), transparent 60%)"
                      : "radial-gradient(circle at 88% 10%, rgba(255,255,255,0.20), transparent 55%), radial-gradient(circle at 5% 100%, rgba(0,0,0,0.22), transparent 65%)",
                  }}
                />

                {s.span !== "one" ? (
                  <div className="relative z-10 flex h-full items-center justify-between gap-3 p-4">
                    <div
                      className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl text-[34px]"
                      style={{ background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.15)" }}
                    >
                      <span className="drop-shadow-sm">{s.emoji}</span>
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="font-display text-[16px] font-extrabold leading-tight" style={{ color: ink }}>
                        {s.title}
                      </h3>
                      <p className="mt-1 text-[11px] font-semibold leading-tight" style={{ color: subInk }}>
                        {s.subtitle}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1.5 p-2 text-center">
                    <span className="text-[36px] drop-shadow-sm">{s.emoji}</span>
                    <h3 className="font-display text-[12.5px] font-extrabold leading-tight" style={{ color: ink }}>
                      {s.title}
                    </h3>
                  </div>
                )}
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
