import { Plus, Minus, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { isPerishable, type Product } from "@/lib/products";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useFavorites } from "@/lib/favorites";
import { toLatin } from "@/lib/format";
import { useLocation } from "@/context/LocationContext";
import {
  fulfillmentMeta,
  fulfillmentTypeFor,
  isSweetsProduct,
} from "@/lib/sweetsFulfillment";
import SweetsProductSheet from "@/components/sweets/SweetsProductSheet";
import ButcherSheet from "@/components/meat/ButcherSheet";
import { isButcheryProduct } from "@/lib/butcheryPrep";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "carousel" | "wide";
}

const badgeStyle: Record<string, { label: string; cls: string }> = {
  best: { label: "الأكثر مبيعًا", cls: "bg-accent/95 text-accent-foreground" },
  trending: { label: "رائج", cls: "bg-primary text-primary-foreground" },
  premium: { label: "مميّز", cls: "bg-foreground text-background" },
  new: { label: "جديد", cls: "bg-primary-soft text-primary" },
};

const ProductCard = ({ product, variant = "grid" }: ProductCardProps) => {
  const { add, setQty, lines } = useCart();
  const { has, toggle } = useFavorites();
  const { zone } = useLocation();
  const badge = product.badge ? badgeStyle[product.badge] : null;
  const line = lines.find((l) => l.product.id === product.id);
  const qty = line?.qty ?? 0;
  const fav = has(product.id);

  const unavailable = !zone.acceptsPerishables && isPerishable(product);

  // Sweets fulfillment metadata: drives the small status badge under the
  // category badge and forces a booking flow for Type C (pre-order) items.
  const sweets = isSweetsProduct(product.source);
  const fType = sweets
    ? fulfillmentTypeFor(product.id, product.subCategory)
    : null;
  const fMeta = fType ? fulfillmentMeta[fType] : null;
  const meat = isButcheryProduct(product.source);
  // Tapping any sweets card opens the unified sheet (full details + booking).
  // Meat / poultry / seafood opens the Butcher's Block sheet.
  // Other product types keep their classic add-to-cart behaviour.
  const opensSheet = sweets || meat;
  const [sheetOpen, setSheetOpen] = useState(false);

  const [pulse, setPulse] = useState(0);
  const lastQtyRef = useRef(qty);
  useEffect(() => {
    if (qty > lastQtyRef.current) setPulse((p) => p + 1);
    lastQtyRef.current = qty;
  }, [qty]);

  const widthCls = variant === "carousel" ? "w-[160px] shrink-0" : "w-full";

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (opensSheet) {
      setSheetOpen(true);
      return;
    }
    add(product);
  };
  const handleInc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (opensSheet) {
      setSheetOpen(true);
      return;
    }
    add(product);
  };
  const handleDec = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty(product.id, Math.max(0, qty - 1));
  };
  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <article className={`glass-strong group relative flex flex-col overflow-hidden rounded-2xl shadow-soft ${widthCls} ${unavailable ? "opacity-95" : ""}`}>
      {unavailable && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-[2px]">
          <span className="rounded-full bg-foreground/85 px-3 py-1.5 text-[10px] font-extrabold text-background shadow-pill">
            قريبًا في منطقتك
          </span>
        </div>
      )}
      {opensSheet ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSheetOpen(true);
          }}
          className="relative block aspect-square w-full overflow-hidden bg-secondary/40 text-right"
          aria-label={product.name}
        >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-apple group-hover:scale-105"
        />
        {badge && (
          <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
            {badge.label}
          </span>
        )}
        {fMeta && (
          <span
            className={`absolute ${badge ? "right-2 top-8" : "right-2 top-2"} inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold shadow-pill ${fMeta.badgeBg} ${fMeta.badgeText}`}
          >
            <span className="text-[10px] leading-none">{fMeta.emoji}</span>
            {fMeta.badge}
          </span>
        )}
        {product.oldPrice && (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground tabular-nums">
            خصم {toLatin(Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100))}٪
          </span>
        )}
        {product.oldPrice && product.oldPrice - product.price >= 5 && (
          <span
            className="absolute left-2 top-9 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold text-accent-foreground shadow-pill tabular-nums"
            style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(36 95% 55%))" }}
          >
            وفّر {toLatin(Math.round(product.oldPrice - product.price))} ج.م
          </span>
        )}
        <span
          onClick={handleFav}
          role="button"
          aria-label="مفضلة"
          className={`absolute bottom-2 left-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full backdrop-blur-md transition ease-apple ${
            fav ? "bg-destructive/90 text-white" : "bg-background/70 text-foreground"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${fav ? "fill-white" : ""}`} strokeWidth={2.4} />
        </span>
        </button>
      ) : (
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          className="relative block aspect-square overflow-hidden bg-secondary/40"
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-apple group-hover:scale-105"
          />
          {badge && (
            <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          {fMeta && (
            <span
              className={`absolute ${badge ? "right-2 top-8" : "right-2 top-2"} inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold shadow-pill ${fMeta.badgeBg} ${fMeta.badgeText}`}
            >
              <span className="text-[10px] leading-none">{fMeta.emoji}</span>
              {fMeta.badge}
            </span>
          )}
          {product.oldPrice && (
            <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground tabular-nums">
              خصم {toLatin(Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100))}٪
            </span>
          )}
        {product.oldPrice && product.oldPrice - product.price >= 5 && (
          <span
            className="absolute left-2 top-9 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold text-accent-foreground shadow-pill tabular-nums"
            style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(36 95% 55%))" }}
          >
            وفّر {toLatin(Math.round(product.oldPrice - product.price))} ج.م
          </span>
        )}
          <button
            onClick={handleFav}
            aria-label="مفضلة"
            className={`absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition ease-apple ${
              fav ? "bg-destructive/90 text-white" : "bg-background/70 text-foreground"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${fav ? "fill-white" : ""}`} strokeWidth={2.4} />
          </button>
        </Link>
      )}

      <div className="flex flex-1 flex-col gap-1 p-3">
        {opensSheet ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSheetOpen(true);
            }}
            className="block text-right"
          >
            <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-foreground">
              {product.name}
            </h3>
            {product.brand && (
              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{product.brand}</p>
            )}
          </button>
        ) : (
          <Link to="/product/$productId" params={{ productId: product.id }} className="block">
            <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-foreground">
              {product.name}
            </h3>
            {product.brand && (
              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{product.brand}</p>
            )}
          </Link>
        )}
        <p className="text-[10px] text-muted-foreground">{product.unit}</p>

        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="leading-none">
            <span className="font-display text-lg font-extrabold text-foreground tabular-nums">{toLatin(product.price)}</span>
            <span className="text-[10px] font-medium text-muted-foreground"> ج.م</span>
            {product.oldPrice && (
              <div className="text-[10px] text-muted-foreground line-through tabular-nums">{toLatin(product.oldPrice)} ج.م</div>
            )}
          </div>

          <div className="relative">
            {pulse > 0 && (
              <span
                key={pulse}
                aria-hidden
                className="animate-plus-one pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-extrabold text-primary-foreground shadow-pill"
              >
                +1
              </span>
            )}

            {qty === 0 ? (
              <button
                onClick={handleAdd}
                aria-label="أضف إلى السلة"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pill transition ease-apple active:scale-90"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            ) : (
              <div className="animate-qty-capsule flex h-9 items-center gap-1 rounded-full bg-primary text-primary-foreground shadow-pill">
                <button
                  onClick={handleDec}
                  aria-label="إنقاص"
                  className="flex h-9 w-8 items-center justify-center rounded-full transition ease-apple active:scale-90"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
                <span className="min-w-[1ch] text-center text-sm font-extrabold tabular-nums">
                  {toLatin(qty)}
                </span>
                <button
                  onClick={handleInc}
                  aria-label="زيادة"
                  className="flex h-9 w-8 items-center justify-center rounded-full transition ease-apple active:scale-90"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {opensSheet && sweets && (
        <SweetsProductSheet
          product={product}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />
      )}
      {opensSheet && meat && (
        <ButcherSheet
          product={product}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </article>
  );
};

export default ProductCard;