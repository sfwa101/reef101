import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Plus, Star, Wallet, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { products as ALL_PRODUCTS, type Product } from "@/lib/products";
import { toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import { toast } from "sonner";
import type { Restaurant } from "@/lib/restaurants";

/* Resolve restaurant best-sellers from the global product list */
const resolve = (ids: string[]): Product[] =>
  ids.map((id) => ALL_PRODUCTS.find((p) => p.id === id)).filter((p): p is Product => !!p);

const QuickAdd = ({ product }: { product: Product }) => {
  const { add, lines } = useCart();
  const inCart = lines.find((l) => l.product.id === product.id);
  const [pulse, setPulse] = useState(0);
  const lastQty = useRef(inCart?.qty ?? 0);
  useEffect(() => {
    const q = inCart?.qty ?? 0;
    if (q > lastQty.current) setPulse((n) => n + 1);
    lastQty.current = q;
  }, [inCart?.qty]);

  return (
    <div className="relative">
      {pulse > 0 && (
        <span
          key={pulse}
          aria-hidden
          className="animate-plus-one pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-primary px-2 py-0.5 text-[9px] font-extrabold text-primary-foreground shadow-pill"
        >
          +1
        </span>
      )}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={(e) => {
          e.preventDefault();
          add(product, 1);
          fireMiniConfetti();
          toast.success(`تمت إضافة ${product.name}`, { duration: 1400 });
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pill"
        aria-label="أضف للسلة"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
      </motion.button>
    </div>
  );
};

interface Props {
  restaurant: Restaurant;
  /** When true, shows a faded "soon in your area" overlay over the whole block. */
  unavailable?: boolean;
}

const RestaurantBlock = ({ restaurant: r, unavailable = false }: Props) => {
  const dishes = resolve(r.productIds);
  const headerGradient = `linear-gradient(135deg, hsl(${r.brandSoft}) 0%, hsl(${r.brandHue} / 0.18) 100%)`;

  return (
    <article
      className={`relative overflow-hidden rounded-[1.75rem] bg-card shadow-soft ring-1 ring-border/40 ${
        unavailable ? "opacity-70" : ""
      }`}
    >
      {unavailable && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
          <span className="rounded-full bg-foreground/85 px-3 py-1.5 text-[10px] font-extrabold text-background shadow-pill">
            قريبًا في منطقتك
          </span>
        </div>
      )}

      {/* RTL row: header (right) — dishes (middle) — CTA (left) */}
      <div className="flex items-stretch">
        {/* ===== Right: Brand header ===== */}
        <div
          className="flex w-[120px] shrink-0 flex-col items-center justify-center gap-2 p-3 text-center"
          style={{ background: headerGradient }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold text-white shadow-pill"
            style={{ background: `hsl(${r.brandHue})` }}
          >
            {r.monogram}
          </div>
          <div>
            <h3 className="font-display text-[13px] font-extrabold leading-tight text-foreground">
              {r.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[9.5px] font-medium text-foreground/70">
              {r.tagline}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-extrabold backdrop-blur">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">{toLatin(r.rating)}</span>
            <span className="text-[8.5px] font-medium text-muted-foreground">
              ({toLatin(r.reviews >= 1000 ? `${(r.reviews / 1000).toFixed(1)}k` : r.reviews)})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-foreground/65">
            <Clock className="h-2.5 w-2.5" />
            {r.etaLabel}
          </div>
        </div>

        {/* ===== Middle: Best sellers carousel ===== */}
        <div className="flex flex-1 flex-col gap-1.5 py-2.5">
          {/* Cashback badge */}
          <div className="flex items-center gap-1.5 px-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold text-white shadow-pill"
              style={{
                background: `linear-gradient(135deg, hsl(${r.brandHue}), hsl(${r.brandHue} / 0.75))`,
              }}
            >
              <Wallet className="h-2.5 w-2.5" />
              ادفع بالمحفظة واسترجع {toLatin(r.cashbackPct)}٪
            </span>
          </div>

          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {dishes.map((p) => (
              <div
                key={p.id}
                className="relative flex w-[110px] shrink-0 flex-col rounded-2xl bg-background p-1.5 shadow-[0_2px_10px_-6px_rgba(0,0,0,0.18)] ring-1 ring-border/30"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="relative mb-1 aspect-square w-full overflow-hidden rounded-xl bg-secondary/40">
                  <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <p className="line-clamp-2 text-[10.5px] font-bold leading-tight">{p.name}</p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="font-display text-[12px] font-extrabold text-foreground tabular-nums">
                    {toLatin(p.price)}
                    <span className="ms-0.5 text-[8.5px] font-medium text-muted-foreground">ج</span>
                  </span>
                  <QuickAdd product={p} />
                </div>
              </div>
            ))}
          </div>
          <p className="px-2 text-[9px] text-muted-foreground">
            الحد الأدنى للطلب {toLatin(r.minOrder)} ج.م
          </p>
        </div>

        {/* ===== Left: CTA ===== */}
        <Link
          to="/sub/$slug"
          params={{ slug: r.id }}
          className="group flex w-10 shrink-0 flex-col items-center justify-center gap-2 border-r border-border/40 transition active:scale-[0.97]"
          style={{ background: `hsl(${r.brandHue} / 0.08)` }}
          onClick={(e) => {
            // Sub route may not be wired for restaurants — fall back to /store/restaurants
            // We keep it as a hint; safe-guarded by router 404 component.
            e.preventDefault();
            window.location.href = `/store/restaurants?r=${r.id}`;
          }}
        >
          <span
            className="writing-mode-vertical text-[10.5px] font-extrabold tracking-wide"
            style={{ writingMode: "vertical-rl", color: `hsl(${r.brandHue})` }}
          >
            تصفّح المنيو الكامل
          </span>
          <ChevronLeft
            className="h-4 w-4 transition group-hover:-translate-x-0.5"
            style={{ color: `hsl(${r.brandHue})` }}
            strokeWidth={2.5}
          />
        </Link>
      </div>
    </article>
  );
};

export default RestaurantBlock;