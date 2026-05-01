/**
 * DepartmentGrid — Phase 26 stem cell.
 * Bento-style grid of all Reef Al Madina departments. The first tile
 * is "featured" (spans 2 columns) for a magazine-grade asymmetric feel.
 *
 * Honors zone availability (perishables hidden in remote zones) and
 * scales tile copy in Elderly Mode.
 */
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLocation } from "@/context/LocationContext";
import { useUI } from "@/context/UIContext";

type Dept = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  to: string;
  tint: string;          // "H S% L%" hsl tuple
  perishable?: boolean;
  featured?: boolean;
};

const DEPARTMENTS: Dept[] = [
  { id: "supermarket", title: "السوبرماركت",   subtitle: "كل احتياجاتك اليومية", emoji: "🛒", to: "/store/supermarket", tint: "142 50% 92%", featured: true },
  { id: "produce",     title: "خضار وفاكهة",   subtitle: "طازج من المزرعة",      emoji: "🥬", to: "/store/produce",      tint: "100 55% 90%", perishable: true },
  { id: "dairy",       title: "الألبان",       subtitle: "كل صباح",                emoji: "🥛", to: "/store/dairy",        tint: "210 70% 94%", perishable: true },
  { id: "meat",        title: "الجزارة",       subtitle: "تقطيع حسب الطلب",       emoji: "🥩", to: "/store/meat",         tint: "8 70% 92%",   perishable: true },
  { id: "kitchen",     title: "مطبخ ريف",      subtitle: "طبخ بيتي جاهز",         emoji: "🍳", to: "/store/kitchen",      tint: "30 85% 92%",  perishable: true },
  { id: "sweets",      title: "الحلويات",      subtitle: "تورتات ومخبوزات",       emoji: "🍰", to: "/store/sweets",       tint: "330 70% 94%" },
  { id: "village",     title: "من القرية",     subtitle: "منتجات بلدية",          emoji: "🌾", to: "/store/village",      tint: "36 80% 90%" },
  { id: "wholesale",   title: "ريف الجملة",    subtitle: "أسعار الكميات",         emoji: "📦", to: "/store/wholesale",    tint: "36 80% 90%" },
  { id: "pharmacy",    title: "الصيدلية",      subtitle: "دواؤك بأمان",            emoji: "💊", to: "/store/pharmacy",     tint: "200 70% 94%" },
  { id: "library",     title: "مكتبة الطلبة",  subtitle: "كل ما يلزم للدراسة",    emoji: "📚", to: "/store/library",      tint: "50 80% 90%" },
  { id: "homegoods",   title: "الأدوات المنزلية", subtitle: "تجهيزات البيت",      emoji: "🏠", to: "/store/home",         tint: "265 70% 94%" },
  { id: "restaurants", title: "المطاعم",        subtitle: "ألذ الأطباق",            emoji: "🍽️", to: "/store/restaurants",  tint: "20 80% 92%" },
];

export const DepartmentGrid = () => {
  const { zone } = useLocation();
  const { viewMode } = useUI();

  const items = useMemo(
    () =>
      DEPARTMENTS.map((d) => ({
        ...d,
        unavailable: !zone.acceptsPerishables && d.perishable,
      })),
    [zone.acceptsPerishables],
  );

  const titleSize = viewMode === "simplified" ? "text-[15px]" : "text-[13px]";
  const subSize   = viewMode === "simplified" ? "text-[12px]" : "text-[10.5px]";

  return (
    <section className="animate-float-up" style={{ animationDelay: "180ms" }}>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-xl font-extrabold tracking-tight">
          أقسام ريف المدينة
        </h2>
        <Link to="/sections" className="text-[11px] font-bold text-primary">
          الكل
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((d) => {
          const cls = `group relative flex flex-col justify-end overflow-hidden rounded-3xl shadow-soft ring-1 ring-border/40 transition ease-apple ${
            d.unavailable ? "opacity-50 pointer-events-none" : "hover:-translate-y-0.5 hover:shadow-tile active:scale-[0.97]"
          } ${d.featured ? "col-span-2 row-span-2 min-h-[180px]" : "min-h-[112px]"}`;
          return (
            <Link
              key={d.id}
              to={d.to}
              className={cls}
              style={{
                background: `linear-gradient(155deg, hsl(${d.tint}) 0%, hsl(var(--card)) 90%)`,
              }}
            >
              {/* Soft glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-50"
                style={{ background: `hsl(${d.tint})` }}
              />
              <div className="relative z-10 p-3.5">
                <div
                  className={`mb-2 inline-flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm ring-1 ring-white/60 ${
                    d.featured ? "h-14 w-14 text-3xl" : "h-10 w-10 text-xl"
                  }`}
                >
                  <span aria-hidden>{d.emoji}</span>
                </div>
                <p className={`font-display font-extrabold text-foreground ${titleSize}`}>
                  {d.title}
                </p>
                <p className={`mt-0.5 font-medium text-muted-foreground ${subSize}`}>
                  {d.unavailable ? "غير متاح في منطقتك" : d.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default DepartmentGrid;
