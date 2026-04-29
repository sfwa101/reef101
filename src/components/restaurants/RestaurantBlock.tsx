import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Star, Wallet, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { products as ALL_PRODUCTS, type Product } from "@/lib/products";
import { toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import { toast } from "sonner";
import type { Restaurant } from "@/lib/restaurants";
import RestaurantItemSheet from "./RestaurantItemSheet";

const resolve = (ids: string[]): Product[] =>
  ids.map((id) => ALL_PRODUCTS.find((p) => p.id === id)).filter((p): p is Product => !!p);

/** "+" button with floating "+1" capsule animation */
const QuickAdd = ({
  product,
  brandHue,
  onNeedSheet,
}: {
  product: Product;
  brandHue: string;
  onNeedSheet: () => void;
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
    <div className="relative">
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
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (hasOptions) {
            onNeedSheet();
          } else {
            add(product, 1);
            fireMiniConfetti();
            toast.success(`تمت إضافة ${product.name}`, { duration: 1200 });
          }
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_4px_14px_-2px_rgba(0,0,0,0.25)] ring-2 ring-white"
        style={{ background: `hsl(${brandHue})` }}
        aria-label="أضف للسلة"
      >
        <Plus className="h-5 w-5" strokeWidth={3.2} />
      </motion.button>
    </div>
  );
};

interface Props {
  restaurant: Restaurant;
  /** When true, shows a faded "soon in your area" overlay over the whole block. */
  unavailable?: boolean;
}

/**
 * Brand-Block (vertical layout):
 *   ┌────────────────────────────────────────────────┐
 *   │ [LOGO]            HOOK TAGLINE     "شوف أكثر ←" │  ← colored banner (brand hue)
 *   ├────────────────────────────────────────────────┤
 *   │  [card] [card] [card] →                         │  ← horizontal best-sellers
 *   └────────────────────────────────────────────────┘
 */
const RestaurantBlock = ({ restaurant: r, unavailable = false }: Props) => {
  const navigate = useNavigate();
  const dishes = resolve(r.productIds);
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);

  const goToRestaurant = () => {
    if (unavailable) return;
    navigate({ to: "/restaurant/$id", params: { id: r.id } });
  };

  const banner = `linear-gradient(135deg, hsl(${r.brandHue}) 0%, hsl(${r.brandHue} / 0.78) 100%)`;

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

      {/* ===== Banner (top) ===== */}
      <button
        type="button"
        onClick={goToRestaurant}
        className="relative flex w-full items-center gap-3 px-3 py-3 text-right transition active:scale-[0.99]"
        style={{ background: banner }}
      >
        {/* Logo tile */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/95 text-2xl font-extrabold shadow-lg">
          <span style={{ color: `hsl(${r.brandHue})` }}>{r.monogram}</span>
        </div>

        {/* Brand text */}
        <div className="flex-1 min-w-0 text-white">
          <h3 className="font-display text-base font-extrabold leading-tight drop-shadow-sm">
            {r.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11.5px] font-medium text-white/90">
            {r.hook ?? r.tagline}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-white/95">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/25 px-1.5 py-0.5 backdrop-blur">
              <Star className="h-2.5 w-2.5 fill-yellow-300 text-yellow-300" />
              <span className="tabular-nums">{toLatin(r.rating)}</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/25 px-1.5 py-0.5 backdrop-blur">
              <Clock className="h-2.5 w-2.5" />
              {r.etaLabel}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/25 px-1.5 py-0.5 backdrop-blur">
              <Wallet className="h-2.5 w-2.5" />
              {toLatin(r.cashbackPct)}٪
            </span>
          </div>
        </div>

        {/* CTA arrow */}
        <div className="flex shrink-0 flex-col items-center gap-1 text-white">
          <span className="text-[11px] font-extrabold">شوف المنيو</span>
          <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        </div>
      </button>

      {/* ===== Best sellers row ===== */}
      <div className="bg-card px-2 pb-3 pt-2.5">
        <div className="mb-1.5 flex items-center justify-between px-1.5">
          <h4 className="text-[11px] font-extrabold text-muted-foreground">الأكثر طلباً</h4>
          <span className="text-[10px] font-bold text-muted-foreground">
            حد أدنى {toLatin(r.minOrder)} ج.م
          </span>
        </div>

        <div
          className="flex gap-2.5 overflow-x-auto px-1 pb-1 no-scrollbar"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {dishes.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={(e) => {
                e.preventDefault();
                setSheetProduct(p);
              }}
              className="relative flex w-[140px] shrink-0 flex-col rounded-2xl bg-background p-2 text-right shadow-[0_2px_10px_-6px_rgba(0,0,0,0.18)] ring-1 ring-border/30 transition active:scale-[0.97]"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded-xl bg-secondary/40">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {/* "+" button overlay (bottom-right of image) */}
                <div className="absolute -bottom-2 right-2">
                  <QuickAdd
                    product={p}
                    brandHue={r.brandHue}
                    onNeedSheet={() => setSheetProduct(p)}
                  />
                </div>
              </div>
              <p className="line-clamp-2 min-h-[28px] text-[11px] font-bold leading-tight">
                {p.name}
              </p>
              <span className="mt-1 font-display text-[13px] font-extrabold text-foreground tabular-nums">
                {toLatin(p.price)}
                <span className="ms-0.5 text-[9px] font-medium text-muted-foreground">ج.م</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Variant/addon sheet */}
      <RestaurantItemSheet
        product={sheetProduct}
        open={!!sheetProduct}
        onClose={() => setSheetProduct(null)}
        brandHue={r.brandHue}
      />
    </article>
  );
};

export default RestaurantBlock;