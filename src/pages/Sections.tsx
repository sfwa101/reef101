import { useNavigate } from "@tanstack/react-router";
import {
  Gift,
  Sprout,
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
// Palette: refined earthy/forest tones — no clashing saturated colors.
const largeSections: LargeSection[] = [
  // Row 1 — full width hero
  { id: "supermarket", title: "السوبر ماركت",       subtitle: "كل مقاضي البيت في مكان واحد", to: "/store/supermarket", emoji: "🏪", bg: "#2F6E3F", span: "full" },
  // Row 2 — 2/3 + 1/3
  { id: "kitchen",     title: "مطبخ ريف المدينة",  subtitle: "مشويات وساندوتشات",            to: "/store/kitchen",     emoji: "🍱", bg: "#C2553F", span: "two" },
  { id: "village",     title: "منتجات القرية",      subtitle: "خيرات الريف",                  to: "/store/village",     emoji: "🍯", bg: "#F4F1EA", ink: "#3B2A1A", span: "one" },
  // Row 3 — 1/3 + 2/3
  { id: "wholesale",   title: "قسم الجملة",          subtitle: "وفّر بالكمية",                 to: "/store/wholesale",   emoji: "📦", bg: "#EFE7DA", ink: "#3B2A1A", span: "one" },
  { id: "baskets",     title: "سلال الريف",           subtitle: "وفّر أسبوعياً",                 to: "/store/baskets",     emoji: "🧺", bg: "#D89B3C", span: "two" },
  // Row 4 — 2/3 + 1/3
  { id: "produce",     title: "الخضراوات والفواكه", subtitle: "حصاد اليوم من المزرعة",        to: "/store/produce",     emoji: "🥗", bg: "#3F8F4D", span: "two" },
  { id: "dairy",       title: "منتجات الألبان",       subtitle: "من المزرعة",                   to: "/store/dairy",       emoji: "🥛", bg: "#E8B547", span: "one" },
  // Row 5 — 1/3 + 2/3
  { id: "restaurants", title: "مطاعم",                 subtitle: "مختارة",                       to: "/store/restaurants", emoji: "🍽️", bg: "#1F4E5A", span: "one" },
  { id: "meat",        title: "اللحوم والمجمدات",    subtitle: "طازجة بأعلى جودة",             to: "/store/meat",        emoji: "🥩", bg: "#8E2F2F", span: "two" },
  // Row 6 — 2/3 + 1/3
  { id: "sweets",      title: "الحلويات والتورتة",   subtitle: "لكل مناسبة لمسة حلوة",         to: "/store/sweets",      emoji: "🎂", bg: "#C76B8E", span: "two" },
  { id: "pharmacy",    title: "الصيدلية",              subtitle: "صحتك أولاً",                   to: "/store/pharmacy",    emoji: "💊", bg: "#2E8C9A", span: "one" },
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
