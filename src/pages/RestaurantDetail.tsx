import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock, Star, Wallet, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { getRestaurant } from "@/lib/restaurants";
import { products as ALL_PRODUCTS, type Product } from "@/lib/products";
import { toLatin, fmtMoney } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { fireMiniConfetti } from "@/lib/confetti";
import { toast } from "sonner";
import RestaurantItemSheet from "@/components/restaurants/RestaurantItemSheet";

const RestaurantDetail = () => {
  const { id } = useParams({ from: "/_app/restaurant/$id" });
  const navigate = useNavigate();
  const r = getRestaurant(id);
  const tabsRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeTab, setActiveTab] = useState<string>(r?.menu?.[0]?.id ?? "popular");
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);

  // Pre-resolve menu sections to actual products
  const sections = useMemo(() => {
    if (!r?.menu) return [];
    return r.menu.map((cat) => ({
      ...cat,
      products: cat.productIds
        .map((pid) => ALL_PRODUCTS.find((p) => p.id === pid))
        .filter((p): p is Product => !!p),
    }));
  }, [r]);

  // Scroll-spy: highlight the tab whose section is in view
  useEffect(() => {
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          const top = visible.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
          const id = top.target.getAttribute("data-cat");
          if (id) setActiveTab(id);
        }
      },
      { rootMargin: "-160px 0px -60% 0px", threshold: [0, 0.1, 0.5] },
    );
    sections.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  if (!r) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">المطعم غير موجود.</p>
      </div>
    );
  }

  const banner = `linear-gradient(135deg, hsl(${r.brandHue}) 0%, hsl(${r.brandHue} / 0.78) 100%)`;
  const accent = `hsl(${r.brandHue})`;

  const scrollToCat = (catId: string) => {
    const el = sectionRefs.current[catId];
    if (el) {
      const tabsH = tabsRef.current?.offsetHeight ?? 0;
      const top = el.getBoundingClientRect().top + window.scrollY - tabsH - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="-mx-4 -mt-4 pb-12 sm:mx-0 sm:mt-0">
      {/* ===== Brand hero header ===== */}
      <header className="relative px-4 pb-6 pt-4 text-white" style={{ background: banner }}>
        <button
          onClick={() => navigate({ to: "/store/restaurants" })}
          className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/25 transition active:scale-95"
          aria-label="رجوع"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl">
            <span className="text-3xl font-extrabold" style={{ color: accent }}>
              {r.monogram}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-extrabold drop-shadow-sm">{r.name}</h1>
            <p className="mt-0.5 text-[12px] font-medium text-white/90">{r.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5">
                <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                {toLatin(r.rating)} ({toLatin(r.reviews)})
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5">
                <Clock className="h-3 w-3" />
                {r.etaLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5">
                <Wallet className="h-3 w-3" />
                كاش باك {toLatin(r.cashbackPct)}٪
              </span>
            </div>
          </div>
        </div>
        {r.hook && (
          <p className="mt-3 rounded-2xl bg-white/15 px-3 py-2 text-[12px] font-bold">
            ✨ {r.hook}
          </p>
        )}
      </header>

      {/* ===== Sticky tabs ===== */}
      <div
        ref={tabsRef}
        className="sticky top-14 z-40 border-b border-border/40 bg-background/95"
      >
        <div
          className="flex gap-2 overflow-x-auto px-4 py-2.5 no-scrollbar"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {sections.map((s) => {
            const active = activeTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveTab(s.id);
                  scrollToCat(s.id);
                }}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition"
                style={{
                  background: active ? accent : "hsl(var(--secondary))",
                  color: active ? "white" : "hsl(var(--foreground))",
                  scrollSnapAlign: "start",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Sections ===== */}
      <div className="space-y-8 px-4 pt-5">
        {sections.map((s) => (
          <section
            key={s.id}
            data-cat={s.id}
            ref={(el: HTMLElement | null) => {
              sectionRefs.current[s.id] = el;
            }}
          >
            <h2
              className="mb-3 inline-block border-b-2 pb-1 font-display text-base font-extrabold"
              style={{ borderColor: accent }}
            >
              {s.label}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {s.products.map((p) => (
                <MenuCard
                  key={p.id}
                  product={p}
                  brandHue={r.brandHue}
                  onOpen={() => setSheetProduct(p)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <RestaurantItemSheet
        product={sheetProduct}
        open={!!sheetProduct}
        onClose={() => setSheetProduct(null)}
        brandHue={r.brandHue}
      />
    </div>
  );
};

/* ============ MenuCard ============ */
const MenuCard = ({
  product,
  brandHue,
  onOpen,
}: {
  product: Product;
  brandHue: string;
  onOpen: () => void;
}) => {
  const { add, lines } = useCart();
  const inCart = lines.find((l) => l.product.id === product.id);
  const [pulse, setPulse] = useState(0);
  const lastQty = useRef(inCart?.qty ?? 0);
  useEffect(() => {
    const q = inCart?.qty ?? 0;
    if (q > lastQty.current) setPulse((n) => n + 1);
    lastQty.current = q;
  }, [inCart?.qty]);

  const hasOptions =
    (product.variants && product.variants.length > 0) ||
    (product.addons && product.addons.length > 0);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col rounded-2xl bg-card p-2 text-right shadow-soft ring-1 ring-border/40 transition active:scale-[0.97]"
    >
      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl bg-secondary/40">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        <div className="absolute -bottom-2 right-2">
          {pulse > 0 && (
            <span
              key={pulse}
              aria-hidden
              className="animate-plus-one pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white shadow-pill"
              style={{ background: `hsl(${brandHue})` }}
            >
              +1
            </span>
          )}
          <motion.span
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (hasOptions) {
                onOpen();
              } else {
                add(product, 1);
                fireMiniConfetti();
                toast.success(`تمت إضافة ${product.name}`, { duration: 1200 });
              }
            }}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_4px_14px_-2px_rgba(0,0,0,0.25)] ring-2 ring-white"
            style={{ background: `hsl(${brandHue})` }}
            aria-label="أضف للسلة"
          >
            <Plus className="h-5 w-5" strokeWidth={3.2} />
          </motion.span>
        </div>
      </div>
      <p className="line-clamp-2 min-h-[32px] text-[12px] font-bold leading-tight">{product.name}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{product.unit}</p>
      <span className="mt-1 font-display text-sm font-extrabold tabular-nums">
        {fmtMoney(product.price)}
      </span>
    </button>
  );
};

export default RestaurantDetail;