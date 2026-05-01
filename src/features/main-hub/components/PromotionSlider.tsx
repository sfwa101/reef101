/**
 * PromotionSlider — Phase 26 stem cell.
 * Auto-rotating "Offer of the Day" carousel using pure CSS mesh
 * gradients (zero image assets) for ultra-fast LCP.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

type Slide = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  to: string;
  bg: string;
  ink: string;
};

const SLIDES: Slide[] = [
  {
    id: "flash",
    badge: "⚡ عرض اليوم",
    title: "خصم 30٪ على السوبرماركت",
    subtitle: "حتى منتصف الليل فقط",
    cta: "تسوّق الآن",
    to: "/offers",
    bg: "radial-gradient(at 20% 0%, hsl(45 90% 70% / 0.85), transparent 55%), radial-gradient(at 90% 100%, hsl(20 85% 60% / 0.8), transparent 50%), linear-gradient(135deg, hsl(36 90% 55%), hsl(20 85% 50%))",
    ink: "30 30% 12%",
  },
  {
    id: "wallet",
    badge: "💎 محفظة ريف",
    title: "كاش باك 5٪ على كل طلب",
    subtitle: "اربط محفظتك واستمتع",
    cta: "افتح المحفظة",
    to: "/wallet",
    bg: "radial-gradient(at 80% 20%, hsl(160 65% 65% / 0.85), transparent 55%), radial-gradient(at 10% 90%, hsl(200 70% 55% / 0.8), transparent 50%), linear-gradient(135deg, hsl(155 50% 32%), hsl(180 45% 28%))",
    ink: "150 35% 96%",
  },
  {
    id: "fresh",
    badge: "🌿 طازج اليوم",
    title: "خضار وفاكهة من المزرعة",
    subtitle: "تصل خلال ساعة",
    cta: "اطلب طازج",
    to: "/store/produce",
    bg: "radial-gradient(at 30% 100%, hsl(120 65% 75% / 0.85), transparent 55%), radial-gradient(at 100% 0%, hsl(45 80% 70% / 0.7), transparent 50%), linear-gradient(135deg, hsl(120 50% 45%), hsl(140 45% 38%))",
    ink: "150 35% 96%",
  },
];

export const PromotionSlider = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="animate-float-up" style={{ animationDelay: "120ms" }}>
      <div className="relative overflow-hidden rounded-[1.75rem] shadow-tile ring-1 ring-border/40">
        <div
          className="flex transition-transform duration-700 ease-apple"
          style={{ transform: `translateX(${idx * 100}%)` }}
        >
          {SLIDES.map((s) => (
            <Link
              key={s.id}
              to={s.to}
              className="relative flex w-full shrink-0 flex-col justify-between p-5 min-h-[170px] transition active:scale-[0.99]"
              style={{ background: s.bg, color: `hsl(${s.ink})` }}
            >
              <div>
                <span
                  className="inline-block rounded-full bg-white/30 backdrop-blur-md px-2.5 py-1 text-[10.5px] font-extrabold ring-1 ring-white/40"
                >
                  {s.badge}
                </span>
                <h3 className="mt-2.5 font-display text-2xl font-extrabold leading-tight">
                  {s.title}
                </h3>
                <p className="mt-1 text-[12.5px] font-medium opacity-90">
                  {s.subtitle}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3.5 py-1.5 text-[11.5px] font-extrabold text-foreground shadow-pill">
                  {s.cta}
                  <ChevronLeft className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromotionSlider;
