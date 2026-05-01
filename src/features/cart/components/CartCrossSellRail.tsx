import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import type { Product } from "@/lib/products";
import type { CartLineMeta } from "@/context/CartContext";

type Props = {
  items: Product[];
  add: (p: Product, qty?: number, meta?: CartLineMeta) => void;
};

/** "Frequently bought with" rail rendered below the cart lines. */
export const CartCrossSellRail = ({ items, add }: Props) => {
  if (items.length === 0) return null;
  return (
    <section className="-mx-4 rounded-none bg-primary/[0.04] px-4 py-3 ring-1 ring-primary/10 sm:mx-0 sm:rounded-2xl">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="font-display text-[12px] font-extrabold flex items-center gap-1.5 text-foreground/90">
          <Sparkles className="h-3 w-3 text-accent" /> غالباً ما يُشترى مع
        </h2>
        <span className="text-[10px] text-muted-foreground">إضافات سريعة</span>
      </div>
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {items.map((p) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                add(p, 1);
                fireMiniConfetti();
                toast.success(`تمت إضافة ${p.name}`);
              }}
              className="relative flex w-[100px] shrink-0 flex-col rounded-xl bg-card p-1.5 text-right shadow-[0_3px_10px_-6px_rgba(0,0,0,0.12)] ring-1 ring-border/30"
            >
              <img src={p.image} alt="" className="mb-1 h-16 w-full rounded-lg object-cover" />
              <p className="line-clamp-2 text-[10px] font-bold leading-tight">{p.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-display text-[11px] font-extrabold text-primary tabular-nums">
                  {toLatin(p.price)} ج
                </span>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pill">
                  <Plus className="h-2.5 w-2.5" strokeWidth={3} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
