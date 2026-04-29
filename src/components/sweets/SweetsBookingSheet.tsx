import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, Clock, MessageSquare, Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { fmtMoney, toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import type { Product } from "@/lib/products";
import {
  buildBookingDays,
  bookingTimeSlots,
  fulfillmentMeta,
  formatBookingShort,
  formatBookingDate,
  DEPOSIT_PCT,
  DEPOSIT_THRESHOLD,
} from "@/lib/sweetsFulfillment";

type Props = {
  product: Product;
  open: boolean;
  onClose: () => void;
};

/**
 * Type C "pre-order" picker. Prompts the customer for a pickup date, slot,
 * and an optional note, then adds the product to the cart with that booking
 * meta attached so the cart and WhatsApp routing can split shipments.
 */
const SweetsBookingSheet = ({ product, open, onClose }: Props) => {
  const { add } = useCart();
  const meta = fulfillmentMeta.C;
  const days = buildBookingDays(7);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string>(bookingTimeSlots[1].id);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  // Reset form on each open
  useEffect(() => {
    if (open) {
      setDayIdx(0);
      setSlot(bookingTimeSlots[1].id);
      setQty(1);
      setNote("");
    }
  }, [open, product.id]);

  const lineTotal = product.price * qty;
  const depositRequired = lineTotal >= DEPOSIT_THRESHOLD;
  const deposit = Math.round(lineTotal * DEPOSIT_PCT);

  const confirm = () => {
    const date = days[dayIdx];
    const iso = date.toISOString().slice(0, 10);
    add(product, qty, {
      bookingDate: iso,
      bookingSlot: slot,
      bookingNote: note.trim() || undefined,
    });
    fireMiniConfetti();
    toast.success(
      `تم حجز ${product.name} ليوم ${formatBookingShort(date)} 🎂`,
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card shadow-float ring-1 ring-border/40 sm:rounded-[28px]"
          >
            {/* Hero */}
            <div className="relative h-44 w-full overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-pill backdrop-blur"
              >
                <X className="h-4 w-4" />
              </button>
              <span
                className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${meta.badgeBg} ${meta.badgeText} shadow-pill`}
              >
                {meta.emoji} {meta.badge}
              </span>
              <div className="absolute inset-x-4 bottom-3">
                <h2 className="font-display text-xl font-extrabold text-foreground">
                  {product.name}
                </h2>
                <p className="text-[11px] text-muted-foreground">{product.unit}</p>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {/* Description */}
              <div className="rounded-2xl bg-violet-500/10 p-3 ring-1 ring-violet-500/20">
                <p className="text-[12px] font-bold leading-relaxed text-foreground">
                  {meta.description}
                </p>
              </div>

              {/* Day picker */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-violet-600" />
                  <h3 className="text-sm font-extrabold">اختر تاريخ الاستلام</h3>
                </div>
                <div className="-mx-4 overflow-x-auto px-4">
                  <div className="flex gap-2 pb-1">
                    {days.map((d, i) => {
                      const active = i === dayIdx;
                      const weekday = d.toLocaleDateString("ar-EG", { weekday: "short" });
                      const day = d.toLocaleDateString("ar-EG", { day: "numeric" });
                      const month = d.toLocaleDateString("ar-EG", { month: "short" });
                      return (
                        <button
                          key={i}
                          onClick={() => setDayIdx(i)}
                          className={`flex w-[72px] shrink-0 flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-2.5 transition ${
                            active
                              ? "border-violet-500 bg-violet-500 text-white shadow-pill"
                              : "border-border bg-background text-foreground"
                          }`}
                        >
                          <span className="text-[10px] font-bold opacity-80">{weekday}</span>
                          <span className="font-display text-lg font-extrabold leading-none tabular-nums">
                            {toLatin(Number(day))}
                          </span>
                          <span className="text-[9px] font-bold opacity-80">{month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Time slot */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600" />
                  <h3 className="text-sm font-extrabold">وقت الاستلام</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {bookingTimeSlots.map((s) => {
                    const active = s.id === slot;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSlot(s.id)}
                        className={`flex items-center justify-between rounded-[14px] border-2 px-3 py-2.5 text-[11px] font-extrabold transition ${
                          active
                            ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        <span>{s.label}</span>
                        {active && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Note */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-violet-600" />
                  <h3 className="text-sm font-extrabold">
                    ملاحظة خاصة <span className="text-[10px] font-bold text-muted-foreground">(اختياري)</span>
                  </h3>
                </div>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثال: اكتب «عيد ميلاد سعيد - أحمد» على التورتة"
                  className="w-full rounded-[14px] bg-foreground/5 px-3 py-2.5 text-sm outline-none ring-1 ring-border/40 transition focus:ring-violet-500"
                />
              </section>

              {/* Quantity */}
              <section className="flex items-center justify-between rounded-2xl bg-foreground/5 p-3">
                <span className="text-sm font-extrabold">الكمية</span>
                <div className="flex items-center gap-2 rounded-full bg-background p-0.5 shadow-pill">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-foreground active:scale-90"
                    aria-label="إنقاص"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm font-extrabold tabular-nums">
                    {toLatin(qty)}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white active:scale-90"
                    aria-label="زيادة"
                  >
                    +
                  </button>
                </div>
              </section>

              {/* Deposit hint */}
              {depositRequired && (
                <div className="rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/30">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    ⚠️ هذا الحجز يتطلب دفع عربون <strong>{fmtMoney(deposit)}</strong>
                    {" "}عند تأكيد الطلب لتحضيره خصيصاً لك.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/50 p-3 ring-1 ring-violet-200 dark:from-violet-500/10 dark:to-violet-500/5 dark:ring-violet-500/20">
                <p className="mb-1 text-[10px] font-bold text-muted-foreground">
                  موعد الاستلام
                </p>
                <p className="text-sm font-extrabold text-violet-700 dark:text-violet-300">
                  {formatBookingDate(days[dayIdx])} —{" "}
                  {bookingTimeSlots.find((s) => s.id === slot)?.label}
                </p>
              </div>
            </div>

            {/* Sticky CTA */}
            <div
              className="sticky bottom-0 border-t border-border/40 bg-card/95 p-3 backdrop-blur"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
            >
              <button
                onClick={confirm}
                className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 font-extrabold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.55)] transition active:scale-[0.98]"
              >
                <span className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="h-5 w-5" />
                  تأكيد الحجز
                </span>
                <span className="rounded-[12px] bg-white/15 px-3 py-1.5 text-sm tabular-nums backdrop-blur">
                  {fmtMoney(lineTotal)}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SweetsBookingSheet;