import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import { swapsFor, productById } from "@/lib/baskets";
import { toLatin } from "@/lib/format";
import type { Product } from "@/lib/products";

type Props = {
  open: boolean;
  originalId: string;
  currentId: string;
  qty: number;
  onClose: () => void;
  onSwap: (newProductId: string) => void;
};

const SmartSwapSheet = ({ open, originalId, currentId, qty, onClose, onSwap }: Props) => {
  const original = useMemo(() => productById(originalId), [originalId]);
  const current = useMemo(() => productById(currentId), [currentId]);
  const candidates = useMemo<Product[]>(() => {
    if (!original) return [];
    const base = swapsFor(originalId);
    const list = currentId !== originalId ? [original, ...base] : base;
    return list.filter((p) => p.id !== currentId);
  }, [original, originalId, currentId]);

  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => { if (open) setPicked(null); }, [open]);

  if (!current || !original) return null;
  const currentLineCost = current.price * qty;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card shadow-float sm:rounded-[28px]"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border/60 bg-card/95 p-4">
              <div className="min-w-0">
                <p className="text-[10.5px] font-extrabold text-emerald-700 dark:text-emerald-300">
                  استبدال ذكي
                </p>
                <h3 className="truncate font-display text-base font-extrabold">
                  بدائل لـ {current.name}
                </h3>
              </div>
              <button onClick={onClose} aria-label="إغلاق" className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-2 p-4">
              {candidates.length === 0 && (
                <p className="rounded-2xl bg-foreground/5 p-6 text-center text-xs text-muted-foreground">
                  لا توجد بدائل منطقية لهذا الصنف.
                </p>
              )}
              {candidates.map((p) => {
                const lineCost = p.price * qty;
                const diff = lineCost - currentLineCost;
                const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
                const isPicked = picked === p.id;
                const isOriginal = p.id === originalId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPicked(p.id)}
                    className={`flex w-full items-center gap-3 rounded-[16px] border-2 bg-card p-2.5 text-right transition ${
                      isPicked ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-border hover:border-emerald-300"
                    }`}
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="line-clamp-1 text-[12.5px] font-extrabold">{p.name}</span>
                        {isOriginal && (
                          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300">
                            الأصلي
                          </span>
                        )}
                      </span>
                      <span className="block text-[10.5px] text-muted-foreground">{p.unit}</span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-extrabold tabular-nums">
                        <span className="text-foreground">{toLatin(p.price)} ج.م</span>
                        {diff !== 0 && (
                          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${
                            diff > 0 ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          }`}>
                            {diff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                            {sign}{toLatin(Math.abs(diff))} ج.م
                          </span>
                        )}
                      </span>
                    </span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                      isPicked ? "bg-emerald-500 text-white shadow-pill" : "bg-foreground/5 text-foreground"
                    }`}>
                      {isPicked ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-0 border-t border-border/60 bg-card/95 p-4">
              <button
                onClick={() => picked && onSwap(picked)}
                disabled={!picked}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-display text-sm font-extrabold text-white shadow-pill transition active:scale-[0.98] disabled:opacity-50"
              >
                <ArrowRightLeft className="h-4 w-4" />
                {picked ? "تأكيد الاستبدال" : "اختر بديلًا"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SmartSwapSheet;
