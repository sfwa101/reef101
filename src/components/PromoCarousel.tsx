import { useEffect, useState } from "react";
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
  bg: string; // CSS background
};

const slides: Slide[] = [
  {
    id: "recipes",
    badge: "عرض اليوم",
    title: "وفّر 25٪ على وصفات الشيف",
    sub: "عند اشتراكك في باقة الأسبوع الأول",
    cta: "تسوق العرض الآن",
    to: "/store/recipes",
    search: { tag: "" },
    bg: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)) 70%, hsl(var(--accent)))",
  },
  {
    id: "baskets",
    badge: "سلة الأسبوع",
    title: "سلال طازجة بخصم حتى 20٪",
    sub: "اشترك ووفّر على كل توصيلة",
    cta: "اكتشف السلال",
    to: "/store/baskets",
    bg: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary-glow)) 60%, hsl(var(--primary)))",
  },
  {
    id: "meat",
    badge: "طازج اليوم",
    title: "لحوم مذبوحة طازجة على الطلب",
    sub: "اطلب الآن ويصلك خلال ساعة",
    cta: "اطلب من الجزار",
    to: "/store/meat",
    bg: "linear-gradient(135deg, hsl(0 65% 45%), hsl(20 75% 55%) 60%, hsl(36 85% 60%))",
  },
];

const PromoCarousel = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="animate-float-up" style={{ animationDelay: "120ms" }}>
      <div className="relative overflow-hidden rounded-[1.5rem] shadow-tile">
        <div
          className="flex transition-transform duration-700 ease-apple"
          style={{ transform: `translateX(${i * 100}%)` }}
        >
          {slides.map((s) => (
            <div key={s.id} className="relative w-full shrink-0 p-4" style={{ background: s.bg }}>
              <div className="absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex-1">
                  <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                    {s.badge}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-extrabold leading-tight text-white text-balance">
                    {s.title}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-white/85">{s.sub}</p>
                </div>
                <Link
                  to={s.to}
                  search={s.search as never}
                  className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[11px] font-extrabold text-primary shadow-pill"
                >
                  {s.cta}
                  <ChevronLeft className="h-3 w-3" strokeWidth={3} />
                </Link>
              </div>
            </div>
          ))}
        </div>
        {/* Dots */}
        <div className="absolute inset-x-0 bottom-1.5 z-10 flex justify-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`عرض ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-5 bg-white" : "w-1.5 bg-white/55"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoCarousel;