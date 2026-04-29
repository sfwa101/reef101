import { useEffect, useState, memo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

type Slide = {
  id: string;
  badge: string;
  title: string;
  sub: string;
  cta: string;
  to: string;
  search?: Record<string, string>;
  /** CSS-only mesh gradient — zero image weight */
  mesh: string;
  /** Foreground ink color (HSL triple) for legible contrast on the mesh */
  ink: string;
  /** CTA chip background tint (HSL triple) */
  chip: string;
};

const SLIDES: Slide[] = [
  {
    id: "recipes",
    badge: "عرض اليوم",
    title: "وفّر ٢٥٪ على وصفات الشيف",
    sub: "اشتراك الأسبوع الأول بسعر مميز",
    cta: "تسوّق الآن",
    to: "/store/recipes",
    mesh:
      "radial-gradient(at 18% 22%, hsl(142 75% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 18%, hsl(168 65% 78%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 88%, hsl(45 90% 78%) 0px, transparent 60%)," +
      "linear-gradient(135deg, hsl(150 55% 90%), hsl(168 60% 84%))",
    ink: "150 35% 18%",
    chip: "0 0% 100%",
  },
  {
    id: "baskets",
    badge: "سلة الأسبوع",
    title: "سلال طازجة بخصم ٢٠٪",
    sub: "اشترك ووفّر مع كل توصيلة",
    cta: "اكتشف السلال",
    to: "/store/baskets",
    mesh:
      "radial-gradient(at 22% 18%, hsl(36 90% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 78% 28%, hsl(20 85% 82%) 0px, transparent 55%)," +
      "radial-gradient(at 50% 90%, hsl(340 75% 86%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(35 90% 90%), hsl(22 85% 86%))",
    ink: "20 50% 22%",
    chip: "0 0% 100%",
  },
  {
    id: "meat",
    badge: "طازج اليوم",
    title: "لحوم مذبوحة على الطلب",
    sub: "اطلب الآن ويصلك خلال ساعة",
    cta: "اطلب من الجزار",
    to: "/store/meat",
    mesh:
      "radial-gradient(at 20% 20%, hsl(0 75% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 80% 22%, hsl(20 85% 78%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(36 80% 80%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(8 75% 88%), hsl(20 75% 84%))",
    ink: "0 60% 22%",
    chip: "0 0% 100%",
  },
  {
    id: "wallet",
    badge: "محفظتك تكبر",
    title: "كاش باك حتى ٥٪ على كل طلب",
    sub: "ترقّ في مستويات الولاء VIP",
    cta: "افتح المحفظة",
    to: "/wallet",
    mesh:
      "radial-gradient(at 22% 18%, hsl(195 80% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 78% 22%, hsl(265 70% 84%) 0px, transparent 55%)," +
      "radial-gradient(at 50% 92%, hsl(220 80% 82%) 0px, transparent 60%)," +
      "linear-gradient(135deg, hsl(210 80% 92%), hsl(255 70% 88%))",
    ink: "230 45% 22%",
    chip: "0 0% 100%",
  },
];

const Slide = memo(function Slide({ s }: { s: Slide }) {
  return (
    <div
      className="relative w-full shrink-0 px-4 pt-4 pb-5"
      style={{
        background: s.mesh,
        color: `hsl(${s.ink})`,
        contain: "layout paint",
      }}
    >
      {/* Soft noise / glass gloss — pure CSS, very cheap */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -left-10 h-32 w-32 rounded-full bg-white/40 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-14 -right-12 h-36 w-36 rounded-full bg-white/30 blur-3xl"
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold backdrop-blur-md ring-1 ring-white/40"
            style={{ background: `hsl(${s.chip} / 0.55)`, color: `hsl(${s.ink})` }}
          >
            {s.badge}
          </span>
          <h3
            className="mt-2 font-display text-[17px] font-extrabold leading-tight text-balance"
            style={{ color: `hsl(${s.ink})` }}
          >
            {s.title}
          </h3>
          <p className="mt-1 text-[11px] font-medium" style={{ color: `hsl(${s.ink} / 0.78)` }}>
            {s.sub}
          </p>
        </div>
        <Link
          to={s.to}
          search={s.search as never}
          className="shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[11px] font-extrabold shadow-pill transition active:scale-95"
          style={{
            background: `hsl(${s.chip})`,
            color: `hsl(${s.ink})`,
          }}
        >
          {s.cta}
          <ChevronLeft className="h-3 w-3" strokeWidth={3} />
        </Link>
      </div>
    </div>
  );
});

const PromoCarousel = () => {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 4800);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="animate-float-up" style={{ animationDelay: "120ms" }}>
      <div
        className="relative overflow-hidden rounded-[1.5rem] shadow-tile ring-1 ring-border/40"
        style={{ contain: "layout paint" }}
      >
        <div
          className="flex transition-transform duration-700 ease-apple"
          style={{ transform: `translateX(${i * 100}%)`, willChange: "transform" }}
        >
          {SLIDES.map((s) => (
            <Slide key={s.id} s={s} />
          ))}
        </div>
        {/* Dots */}
        <div className="absolute inset-x-0 bottom-1.5 z-10 flex justify-center gap-1.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`عرض ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-5 bg-foreground/70" : "w-1.5 bg-foreground/25"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoCarousel;
