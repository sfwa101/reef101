import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CalendarDays,
  Clock,
  MessageSquare,
  Check,
  ShoppingBag,
  Sparkles,
  Star,
  Wallet,
  Truck,
  PackageCheck,
  Banknote,
  Info,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { fmtMoney, toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import type { Product } from "@/lib/products";
import {
  buildBookingDays,
  bookingTimeSlots,
  fulfillmentMeta,
  fulfillmentTypeFor,
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
 * Unified premium product sheet for sweets. Opens on tap of the product card
 * and exposes (in one polished flow):
 *   - hero + description + rating
 *   - variants (size/weight) — single-select with live price
 *   - addons (gift wrap, candles…) — multi-select with live price
 *   - quantity stepper
 *   - For Type C only: pickup date + time slot + custom note,
 *     deposit choice (50% now vs full on delivery),
 *     shipment choice (split with instant items vs deliver everything together)
 */
const SweetsProductSheet = ({ product, open, onClose }: Props) => {
  const { add } = useCart();
  const fType = fulfillmentTypeFor(product.id, product.subCategory);
  const fMeta = fulfillmentMeta[fType];
  const isBooking = fType === "C";

  const variants = product.variants ?? [];
  const addons = product.addons ?? [];

  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  // Booking-only state
  const days = useMemo(() => buildBookingDays(7), []);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string>(bookingTimeSlots[1].id);
  const [shipMode, setShipMode] = useState<"split" | "wait">("split");
  const [payDeposit, setPayDeposit] = useState<boolean>(true);

  // Reset on each open
  useEffect(() => {
    if (!open) return;
    setVariantId(variants[0]?.id ?? "");
    setAddonIds([]);
    setQty(1);
    setNote("");
    setDayIdx(0);
    setSlot(bookingTimeSlots[1].id);
    setShipMode("split");
    setPayDeposit(true);
  }, [open, product.id, variants]);

  const variantDelta =
    variants.find((v) => v.id === variantId)?.priceDelta ?? 0;
  const addonsSum = addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((s, a) => s + a.price, 0);
  const unitPrice = product.price + variantDelta + addonsSum;
  const lineTotal = unitPrice * qty;

  // Deposit math (only meaningful when isBooking)
  const depositRequired = isBooking && lineTotal >= DEPOSIT_THRESHOLD;
  const effectivePayDeposit = isBooking && (depositRequired || payDeposit);
  const depositAmount = isBooking
    ? Math.round(lineTotal * DEPOSIT_PCT)
    : 0;
  const remainderOnDelivery =
    effectivePayDeposit && lineTotal > 0 ? lineTotal - depositAmount : 0;

  const toggleAddon = (id: string) =>
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const confirm = () => {
    const date = days[dayIdx];
    add(product, qty, {
      variantId: variantId || undefined,
      addonIds: addonIds.length ? addonIds : undefined,
      unitPrice,
      bookingDate: isBooking ? date.toISOString().slice(0, 10) : undefined,
      bookingSlot: isBooking ? slot : undefined,
      bookingNote: note.trim() || undefined,
      payDeposit: isBooking ? effectivePayDeposit : undefined,
      shipMode: isBooking ? shipMode : undefined,
    });
    fireMiniConfetti();
    toast.success(
      isBooking
        ? `تم حجز ${product.name} ليوم ${formatBookingShort(date)} 🎂`
        : `تمت إضافة ${product.name} إلى السلة`,
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card shadow-float ring-1 ring-border/40 sm:rounded-[28px]"
          >
            {/* Hero */}
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-pill"
              >
                <X className="h-4 w-4" />
              </button>
              <span
                className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${fMeta.badgeBg} ${fMeta.badgeText} shadow-pill`}
              >
                {fMeta.emoji} {fMeta.badge}
              </span>
              <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-extrabold leading-tight text-foreground">
                    {product.name}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {product.unit}
                  </p>
                </div>
                {product.rating && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/85 px-2 py-1 text-[10px] font-extrabold text-background">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {toLatin(product.rating)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 p-4">
              {/* Description */}
              <div
                className={`rounded-2xl p-3 ring-1 ${
                  isBooking
                    ? "bg-violet-500/10 ring-violet-500/20"
                    : "bg-foreground/5 ring-border/40"
                }`}
              >
                <p className="flex items-start gap-2 text-[12px] font-bold leading-relaxed text-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                  {fMeta.description}
                </p>
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <h3 className="text-sm font-extrabold">اختر الحجم</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {variants.map((v) => {
                      const active = v.id === variantId;
                      const delta = v.priceDelta;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setVariantId(v.id)}
                          className={`flex items-center justify-between gap-3 rounded-[14px] border-2 px-3 py-2.5 text-right transition ${
                            active
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                              : "border-border bg-background"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-[12px] font-extrabold">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                active
                                  ? "border-violet-500 bg-violet-500"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {active && (
                                <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
                              )}
                            </span>
                            {v.label}
                          </span>
                          <span className="text-[11px] font-extrabold tabular-nums text-violet-700 dark:text-violet-300">
                            {delta === 0
                              ? "السعر الأساسي"
                              : delta > 0
                                ? `+${toLatin(delta)} ج.م`
                                : `${toLatin(delta)} ج.م`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Addons */}
              {addons.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-violet-600" />
                    <h3 className="text-sm font-extrabold">
                      إضافات{" "}
                      <span className="text-[10px] font-bold text-muted-foreground">
                        (اختياري)
                      </span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {addons.map((a) => {
                      const active = addonIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggleAddon(a.id)}
                          className={`flex items-center justify-between gap-3 rounded-[14px] border-2 px-3 py-2.5 text-right transition ${
                            active
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                              : "border-border bg-background"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-[12px] font-extrabold">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-[5px] border-2 ${
                                active
                                  ? "border-violet-500 bg-violet-500"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {active && (
                                <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
                              )}
                            </span>
                            {a.label}
                          </span>
                          <span className="text-[11px] font-extrabold tabular-nums text-violet-700 dark:text-violet-300">
                            +{toLatin(a.price)} ج.م
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Booking-only sections */}
              {isBooking && (
                <>
                  {/* Day picker */}
                  <section>
                    <div className="mb-2 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-violet-600" />
                      <h3 className="text-sm font-extrabold">
                        تاريخ الاستلام
                      </h3>
                    </div>
                    <div className="-mx-4 overflow-x-auto px-4">
                      <div className="flex gap-2 pb-1">
                        {days.map((d, i) => {
                          const active = i === dayIdx;
                          const weekday = d.toLocaleDateString("ar-EG", {
                            weekday: "short",
                          });
                          const day = d.toLocaleDateString("ar-EG", {
                            day: "numeric",
                          });
                          const month = d.toLocaleDateString("ar-EG", {
                            month: "short",
                          });
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
                              <span className="text-[10px] font-bold opacity-80">
                                {weekday}
                              </span>
                              <span className="font-display text-lg font-extrabold leading-none tabular-nums">
                                {toLatin(Number(day))}
                              </span>
                              <span className="text-[9px] font-bold opacity-80">
                                {month}
                              </span>
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

                  {/* Shipment mode */}
                  <section>
                    <div className="mb-2 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-violet-600" />
                      <h3 className="text-sm font-extrabold">
                        طريقة وصول الطلب
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          id: "split" as const,
                          title: "وصول على دفعتين",
                          desc: "المنتجات الفورية تصلك الآن، والحجز في موعده.",
                          icon: Truck,
                        },
                        {
                          id: "wait" as const,
                          title: "استلام كل الطلب مرة واحدة",
                          desc: "ننتظر تجهيز الحجز ونوصّل كل شيء معاً في الموعد.",
                          icon: PackageCheck,
                        },
                      ].map((m) => {
                        const active = shipMode === m.id;
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setShipMode(m.id)}
                            className={`flex items-start gap-3 rounded-[14px] border-2 p-3 text-right transition ${
                              active
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                                : "border-border bg-background"
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${
                                active
                                  ? "bg-violet-500 text-white"
                                  : "bg-foreground/5 text-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4" strokeWidth={2.4} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-extrabold">{m.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {m.desc}
                              </p>
                            </div>
                            <span
                              className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                                active
                                  ? "border-violet-500 bg-violet-500"
                                  : "border-muted-foreground/40"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Payment plan */}
                  <section>
                    <div className="mb-2 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-violet-600" />
                      <h3 className="text-sm font-extrabold">
                        خطة الدفع
                        {depositRequired && (
                          <span className="ms-2 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800 dark:text-amber-300">
                            عربون إجباري
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          id: "deposit",
                          title: `ادفع عربون 50٪ الآن (${fmtMoney(depositAmount)})`,
                          desc: `والباقي ${fmtMoney(remainderOnDelivery || Math.round(lineTotal * 0.5))} عند الاستلام.`,
                          icon: Wallet,
                          on: effectivePayDeposit,
                          onClick: () => !depositRequired && setPayDeposit(true),
                        },
                        {
                          id: "full",
                          title: "ادفع المبلغ كاملاً مقدماً",
                          desc: `${fmtMoney(lineTotal)} الآن — ولا شيء عند الاستلام.`,
                          icon: Banknote,
                          on: !effectivePayDeposit && !depositRequired,
                          onClick: () => !depositRequired && setPayDeposit(false),
                        },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const disabled = depositRequired && opt.id === "full";
                        return (
                          <button
                            key={opt.id}
                            onClick={opt.onClick}
                            disabled={disabled}
                            className={`flex items-start gap-3 rounded-[14px] border-2 p-3 text-right transition ${
                              opt.on
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                                : "border-border bg-background"
                            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${
                                opt.on
                                  ? "bg-violet-500 text-white"
                                  : "bg-foreground/5 text-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4" strokeWidth={2.4} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-extrabold">{opt.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {opt.desc}
                              </p>
                            </div>
                            <span
                              className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                                opt.on
                                  ? "border-violet-500 bg-violet-500"
                                  : "border-muted-foreground/40"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}

              {/* Note */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-violet-600" />
                  <h3 className="text-sm font-extrabold">
                    ملاحظة خاصة{" "}
                    <span className="text-[10px] font-bold text-muted-foreground">
                      (اختياري)
                    </span>
                  </h3>
                </div>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    isBooking
                      ? "مثال: اكتب «عيد ميلاد سعيد - أحمد» على التورتة"
                      : "أي طلب خاص؟"
                  }
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

              {/* Summary (booking only) */}
              {isBooking && (
                <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/50 p-3 ring-1 ring-violet-200 dark:from-violet-500/10 dark:to-violet-500/5 dark:ring-violet-500/20">
                  <p className="mb-1 text-[10px] font-bold text-muted-foreground">
                    موعد الاستلام
                  </p>
                  <p className="text-sm font-extrabold text-violet-700 dark:text-violet-300">
                    {formatBookingDate(days[dayIdx])} —{" "}
                    {bookingTimeSlots.find((s) => s.id === slot)?.label}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky CTA */}
            <div
              className="sticky bottom-0 border-t border-border/40 bg-card/95 p-3"
              style={{
                paddingBottom:
                  "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
              }}
            >
              {isBooking && effectivePayDeposit && (
                <div className="mb-2 flex items-center justify-between rounded-[12px] bg-violet-500/10 px-3 py-1.5 text-[10px] font-extrabold text-violet-700 dark:text-violet-300">
                  <span>عربون الآن</span>
                  <span className="tabular-nums">{fmtMoney(depositAmount)}</span>
                </div>
              )}
              <button
                onClick={confirm}
                className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 font-extrabold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.55)] transition active:scale-[0.98]"
              >
                <span className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="h-5 w-5" />
                  {isBooking ? "تأكيد الحجز" : "أضف إلى السلة"}
                </span>
                <span className="rounded-[12px] bg-white/15 px-3 py-1.5 text-sm tabular-nums">
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

export default SweetsProductSheet;