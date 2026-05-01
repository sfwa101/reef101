import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChefHat, Store, Utensils, Wallet as WalletIcon } from "lucide-react";
import { fmtMoney, toLatin } from "@/lib/format";
import type { Product } from "@/lib/products";
import type { CartLineMeta } from "@/context/CartContext";
import { vendorBrandHue, vendorLabel, type VendorKey } from "@/lib/restaurants";
import { CartLineItem } from "./CartLineItem";

type VendorGroupCardProps = {
  g: {
    key: string;
    vendor: VendorKey;
    lines: { product: Product; qty: number; meta?: CartLineMeta }[];
    subtotal: number;
    cashback: number;
  };
  payment: string;
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  updateMeta: (id: string, meta: CartLineMeta) => void;
  showScheduledHint?: boolean;
};

export const VendorGroupCard = ({
  g,
  payment,
  setQty,
  remove,
  updateMeta,
  showScheduledHint,
}: VendorGroupCardProps) => {
  const v = g.vendor;
  const hue = vendorBrandHue(v);
  const Icon = v.kind === "restaurant" ? Utensils : v.kind === "kitchen" ? ChefHat : Store;
  return (
    <div
      className="overflow-hidden rounded-2xl bg-card/60 ring-1 ring-border/40"
      style={{ borderTop: `3px solid hsl(${hue})` }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[10px] text-white"
            style={{ background: `hsl(${hue})` }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <p className="text-[12px] font-extrabold">{vendorLabel(v)}</p>
            <p className="text-[9.5px] text-muted-foreground">
              {toLatin(g.lines.length)} منتج · إجمالي {fmtMoney(g.subtotal)}
            </p>
          </div>
        </div>
        {showScheduledHint && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[9.5px] font-extrabold text-violet-700 dark:text-violet-300">
            <CalendarDays className="h-2.5 w-2.5" /> يحتوي حجوزات
          </span>
        )}
        {v.kind === "restaurant" && payment === "wallet" && g.cashback > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold text-white shadow-pill"
            style={{ background: `hsl(${hue})` }}
          >
            <WalletIcon className="h-2.5 w-2.5" />
            +{toLatin(g.cashback)} ج.م
          </span>
        )}
      </div>
      <div className="space-y-2 px-2 pb-2">
        <AnimatePresence initial={false}>
          {g.lines.map((l) => (
            <motion.div
              key={l.product.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
            >
              <CartLineItem l={l} setQty={setQty} remove={remove} updateMeta={updateMeta} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
