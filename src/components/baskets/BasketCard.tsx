import { useState } from "react";
import { Sparkles, Star, Users, Repeat } from "lucide-react";
import type { Product } from "@/lib/products";
import { useAuth } from "@/context/AuthContext";
import { basketMarketing, sumBasketRetail, hydrateBasket } from "@/lib/baskets";
import { toLatin } from "@/lib/format";
import BasketSheet from "./BasketSheet";

const toneClass = (tone?: string) =>
  tone === "amber" ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 ring-amber-500/40"
  : tone === "rose" ? "bg-rose-500/20 text-rose-800 dark:text-rose-200 ring-rose-500/40"
  : tone === "violet" ? "bg-violet-500/20 text-violet-800 dark:text-violet-200 ring-violet-500/40"
  : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-emerald-500/40";

const BasketCard = ({ product }: { product: Product }) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const m = basketMarketing[product.id];
  const retail = sumBasketRetail(hydrateBasket(product.id, {})) || product.oldPrice || product.price;
  const savePct = retail > product.price ? Math.round(((retail - product.price) / retail) * 100) : 0;

  const recommended =
    m?.recommendedFor &&
    profile?.household_size != null &&
    (m.recommendedFor.minHousehold == null || profile.household_size >= m.recommendedFor.minHousehold) &&
    (m.recommendedFor.maxHousehold == null || profile.household_size <= m.recommendedFor.maxHousehold);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-3xl bg-card text-right shadow-tile ring-1 ring-border/60 transition active:scale-[0.99]"
      >
        <div className="relative aspect-[5/3] w-full overflow-hidden">
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          {m && (
            <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-pill ring-1 ${toneClass(m.badgeTone)}`}>
              <Sparkles className="h-3 w-3" />{m.badge}
            </span>
          )}
          {savePct > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-pill tabular-nums">
              وفّر {toLatin(savePct)}٪
            </span>
          )}
          <div className="absolute inset-x-3 bottom-3">
            <h3 className="font-display text-lg font-extrabold leading-tight text-white drop-shadow">
              {product.name}
            </h3>
            <p className="text-[10.5px] font-bold text-white/85">{product.unit}</p>
          </div>
        </div>

        <div className="space-y-2 p-3">
          {recommended && m?.recommendedFor && (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
              <Users className="h-3 w-3" /> موصاة لعائلتك
            </div>
          )}

          {m && (
            <div className="flex items-center justify-between text-[10px] font-extrabold">
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                <Star className="h-2.5 w-2.5 fill-current" /> {toLatin(m.soldThisWeek)} عميل/أسبوع
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300">
                متبقي {toLatin(m.remaining)}
              </span>
            </div>
          )}

          <div className="flex items-end justify-between gap-2">
            <div className="leading-tight">
              {retail > product.price && (
                <span className="block text-[10px] font-bold text-muted-foreground line-through tabular-nums">
                  {toLatin(retail)} ج.م
                </span>
              )}
              <span className="font-display text-xl font-extrabold tabular-nums text-foreground">
                {toLatin(product.price)}
                <span className="text-[11px] font-bold text-muted-foreground"> ج.م</span>
              </span>
            </div>
            <span className="animate-pulse-soft inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1.5 text-[10px] font-extrabold text-white shadow-pill">
              <Repeat className="h-3 w-3" /> اشترك ووفّر +15%
            </span>
          </div>
        </div>
      </button>

      <BasketSheet product={product} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default BasketCard;
