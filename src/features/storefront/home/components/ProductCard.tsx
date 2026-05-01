/**
 * ProductCard — single product tile for the Home Goods grid and rails.
 *
 * Verbatim extraction from the legacy `pages/store/Home.tsx`. Stateful
 * (talks to CartContext + CompareContext) but is otherwise leaf-level.
 *
 * The `toCompareItem` helper is exported for re-use by other rails that
 * surface the same domain model.
 */
import {
  CalendarClock,
  Crown,
  Plus,
  Scale,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { useCartActions, useCartLineQty } from "@/context/CartContext";
import { useCompare, type CompareItem } from "@/context/CompareContext";
import { toLatin } from "@/lib/format";

import { fmt } from "../data";
import type { HGProduct } from "../types";

export const toCompareItem = (p: HGProduct): CompareItem => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  image: p.image,
  price: p.price,
  oldPrice: p.oldPrice,
  unit: p.unit,
  rating: p.rating,
  reviews: p.reviews,
  category: p.category,
  fulfillment: p.fulfillment,
  etaDays: p.etaDays,
  warranty: p.warranty,
  badges: p.badges,
  tagline: p.tagline,
});

export const ProductCard = ({
  p,
  onOpen,
}: {
  p: HGProduct;
  onOpen: () => void;
}) => {
  const { add } = useCartActions();
  const qty = useCartLineQty(p.id);
  const compare = useCompare();
  const isPre = p.fulfillment === "preorder";
  const deposit = isPre
    ? Math.round((p.price * (p.depositPct ?? 25)) / 100)
    : 0;
  const inCompare = compare.has(p.id);
  const compareFull = !inCompare && compare.items.length >= compare.max;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPre) {
      add(
        {
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          unit: p.unit,
          category: "أدوات منزلية",
          source: "home",
        } as unknown as import("@/lib/products").Product,
        1,
        {
          payDeposit: true,
          unitPrice: p.price,
          bookingNote: `حجز مسبق · دفعة مقدمة ${toLatin(deposit.toLocaleString("en-US"))} ج.م`,
        },
      );
      toast.success("تم تأكيد الحجز", {
        description: `دفعة مقدمة ${toLatin(deposit.toLocaleString("en-US"))} ج.م`,
      });
      return;
    }
    add({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      unit: p.unit,
      category: "أدوات منزلية",
      source: "home",
    } as unknown as import("@/lib/products").Product);
    toast.success("أُضيف إلى السلة", { description: p.name });
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareFull) {
      toast.error("الحد الأقصى ٤ منتجات للمقارنة");
      return;
    }
    compare.toggle(toCompareItem(p));
    toast.success(inCompare ? "أُزيل من المقارنة" : "أُضيف للمقارنة");
  };

  return (
    <article
      onClick={onOpen}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card text-right shadow-soft ring-1 ring-border/50 transition active:scale-[0.99] ${
        isPre ? "ring-2 ring-amber-300/60" : ""
      }`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "320px 340px" }}
    >
      {isPre && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, hsl(40 90% 60% / 0.07), transparent 40%)",
          }}
        />
      )}

      <div className="relative aspect-square overflow-hidden bg-secondary/40">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          decoding="async"
          width={768}
          height={768}
          className="h-full w-full object-cover"
        />

        {isPre ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-amber-500 to-amber-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-pill">
            <CalendarClock className="h-3 w-3" />
            حجز · {toLatin(p.etaDays ?? 7)} أيام
          </span>
        ) : (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-pill">
            <Truck className="h-3 w-3" />
            يصلك اليوم
          </span>
        )}

        {p.oldPrice && (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground tabular-nums">
            خصم {toLatin(Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100))}٪
          </span>
        )}

        {isPre && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-foreground/85 px-2 py-1 text-[10px] font-bold text-background backdrop-blur">
            <Crown className="h-3 w-3 text-amber-300" />
            Premium
          </span>
        )}

        <button
          onClick={handleCompare}
          aria-label={inCompare ? "إزالة من المقارنة" : "أضف للمقارنة"}
          className={`absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full shadow-soft backdrop-blur transition active:scale-90 ${
            inCompare
              ? "bg-foreground text-background"
              : compareFull
                ? "bg-background/70 text-muted-foreground"
                : "bg-background/90 text-foreground"
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[10px] font-medium text-muted-foreground">{p.brand}</p>
        <h3 className="line-clamp-2 text-[13px] font-extrabold leading-tight text-foreground">
          {p.name}
        </h3>
        <p className="line-clamp-1 text-[10.5px] text-muted-foreground">{p.tagline}</p>

        <div className="mt-1 flex items-center gap-1 text-[10.5px]">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="font-bold tabular-nums">{toLatin(p.rating)}</span>
          <span className="text-muted-foreground">
            ({toLatin(p.reviews.toLocaleString("en-US"))})
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div className="leading-none">
            <span className="font-display text-lg font-extrabold tabular-nums">
              {toLatin(p.price.toLocaleString("en-US"))}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground"> ج.م</span>
            {p.oldPrice && (
              <div className="text-[10px] text-muted-foreground line-through tabular-nums">
                {toLatin(p.oldPrice.toLocaleString("en-US"))} ج.م
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            aria-label={isPre ? "احجز الآن" : "أضف إلى السلة"}
            className={`flex h-9 items-center gap-1 rounded-full px-3 text-[11px] font-extrabold shadow-pill transition active:scale-95 ${
              isPre
                ? "bg-gradient-to-l from-amber-500 to-amber-600 text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isPre ? (
              <>
                <CalendarClock className="h-3.5 w-3.5" />
                احجز الآن
              </>
            ) : qty === 0 ? (
              <>
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                للسلة
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                {toLatin(qty)}
              </>
            )}
          </button>
        </div>

        {isPre && (
          <p className="mt-1.5 text-[9.5px] font-bold text-amber-700">
            ادفع {toLatin(p.depositPct ?? 25)}٪ مقدّم ({fmt(deposit)}) لإتمام الحجز
          </p>
        )}
      </div>
    </article>
  );
};
