import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowLeftRight, ShoppingBasket } from "lucide-react";
import { detectBasketUpgrade } from "@/lib/baskets";
import { useCart } from "@/context/CartContext";
import { toLatin } from "@/lib/format";
import { toast } from "sonner";
import { fireMiniConfetti } from "@/lib/confetti";

const CartUpgradeBanner = () => {
  const { lines, add, remove } = useCart();
  const [dismissed, setDismissed] = useState(false);

  const suggestion = useMemo(() => {
    if (dismissed) return null;
    return detectBasketUpgrade(
      lines.map((l) => ({ product: l.product, qty: l.qty })),
    );
  }, [lines, dismissed]);

  if (!suggestion) return null;
  const { basket, matchingIds, savings } = suggestion;

  const upgrade = () => {
    matchingIds.forEach((id) => remove(id));
    add(basket, 1);
    fireMiniConfetti();
    toast.success(`تم تحويل عناصرك إلى ${basket.name} · وفّرت ${toLatin(savings)} ج.م`);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="upgrade-banner"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-3.5 text-white shadow-tile ring-1 ring-emerald-400/40"
      >
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <button
          onClick={() => setDismissed(true)}
          aria-label="إغلاق"
          className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white"
        >
          <X className="h-3 w-3" />
        </button>
        <div className="relative flex gap-3">
          <img src={basket.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-white/40" />
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-extrabold backdrop-blur">
              <Sparkles className="h-2.5 w-2.5" /> اقتراح ذكي
            </span>
            <p className="mt-1 font-display text-[13px] font-extrabold leading-tight">
              عربتك تشبه «{basket.name}»
            </p>
            <p className="text-[10.5px] font-bold opacity-90">
              حوّلها للسلة الجاهزة ووفّر {toLatin(savings)} ج.م فوراً
            </p>
            <div className="mt-2 flex gap-1.5">
              <button
                onClick={upgrade}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-emerald-700 shadow-pill transition active:scale-[0.97]"
              >
                <ArrowLeftRight className="h-3 w-3" /> حوّل ووفّر
              </button>
              <Link
                to="/store/baskets"
                className="flex items-center justify-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-extrabold backdrop-blur"
              >
                <ShoppingBasket className="h-3 w-3" /> تصفّح
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartUpgradeBanner;
