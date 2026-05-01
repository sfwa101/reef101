/**
 * BundleCard — multi-product bundle tile shown in the Bundles rail.
 * Verbatim extraction; talks to CartContext only.
 */
import { Package } from "lucide-react";
import { toast } from "sonner";

import { useCartActions } from "@/context/CartContext";
import { toLatin } from "@/lib/format";

import type { Bundle, HGProduct } from "../types";

export const BundleCard = ({
  bundle,
  items,
  hue,
}: {
  bundle: Bundle;
  items: HGProduct[];
  hue: string;
}) => {
  const { add } = useCartActions();
  const original = items.reduce((s, i) => s + i.price, 0);

  const onBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    items.forEach((p) =>
      add({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        unit: p.unit,
        category: "أدوات منزلية",
        source: "home",
      } as unknown as import("@/lib/products").Product),
    );
    toast.success("أُضيفت الحزمة إلى السلة", { description: bundle.title });
  };

  return (
    <article
      className="relative w-[280px] shrink-0 overflow-hidden rounded-2xl bg-card text-right shadow-tile ring-1 ring-border/50"
      style={{ contentVisibility: "auto", containIntrinsicSize: "280px 280px" }}
    >
      <div className="relative h-[140px] bg-secondary/40">
        <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
          {items.slice(0, 2).map((it) => (
            <img
              key={it.id}
              src={it.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full rounded-xl object-cover"
            />
          ))}
        </div>
        <span
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold text-white shadow-pill"
          style={{ background: `hsl(${hue})` }}
        >
          <Package className="h-3 w-3" /> حزمة ذكية
        </span>
        <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-pill">
          {bundle.badge}
        </span>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 text-[13px] font-extrabold text-foreground">
          {bundle.title}
        </h3>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {bundle.desc}
        </p>

        <div className="mt-2 flex items-end justify-between">
          <div className="leading-none">
            <span className="font-display text-lg font-extrabold tabular-nums">
              {toLatin(bundle.bundlePrice.toLocaleString("en-US"))}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground"> ج.م</span>
            <div className="text-[10px] text-muted-foreground line-through tabular-nums">
              {toLatin(original.toLocaleString("en-US"))} ج.م
            </div>
          </div>
          <button
            onClick={onBuy}
            className="rounded-full bg-foreground px-3 py-2 text-[11px] font-extrabold text-background shadow-pill active:scale-95"
          >
            اشترِ الحزمة
          </button>
        </div>
      </div>
    </article>
  );
};
