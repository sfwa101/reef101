import { Plus, Minus, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/products";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useFavorites } from "@/lib/favorites";
import { toLatin } from "@/lib/format";

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
  const badge = product.badge ? badgeStyle[product.badge] : null;
  const line = lines.find((l) => l.product.id === product.id);
  const qty = line?.qty ?? 0;
  const fav = has(product.id);

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
    add(product);
  };
  const handleInc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <article className={`glass-strong group relative flex flex-col overflow-hidden rounded-2xl shadow-soft ${widthCls}`}>
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
        {product.oldPrice && (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground tabular-nums">
            خصم {toLatin(Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100))}٪
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

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to="/product/$productId" params={{ productId: product.id }} className="block">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-foreground">
            {product.name}
          </h3>
          {product.brand && (
            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{product.brand}</p>
          )}
        </Link>
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
                className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-pill transition ease-apple active:scale-90"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            ) : (
              <div className="animate-qty-capsule flex h-9 items-center gap-1 rounded-md bg-primary text-primary-foreground shadow-pill">
                <button
                  onClick={handleDec}
                  aria-label="إنقاص"
                  className="flex h-9 w-8 items-center justify-center rounded-sm transition ease-apple active:scale-90"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
                <span className="min-w-[1ch] text-center text-sm font-extrabold tabular-nums">
                  {toLatin(qty)}
                </span>
                <button
                  onClick={handleInc}
                  aria-label="زيادة"
                  className="flex h-9 w-8 items-center justify-center rounded-sm transition ease-apple active:scale-90"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;