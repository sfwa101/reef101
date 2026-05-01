import { useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { CalendarDays, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { fmtMoney, toLatin } from "@/lib/format";
import type { Product } from "@/lib/products";
import type { CartLineMeta } from "@/context/CartContext";
import {
  bookingTimeSlots,
  buildBookingDays,
  DEPOSIT_THRESHOLD,
  fulfillmentTypeFor,
  formatBookingShort,
  isSweetsProduct,
} from "@/lib/sweetsFulfillment";
import { NumberFlow } from "./NumberFlow";

/**
 * Swipeable cart line — extracted verbatim from Cart.tsx.
 * Handles inline qty stepper, swipe-to-delete, and the Type-C booking
 * editor for sweets products that require scheduling.
 */
export const CartLineItem = ({
  l,
  setQty,
  remove,
  updateMeta,
}: {
  l: { product: Product; qty: number; meta?: CartLineMeta };
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  updateMeta: (id: string, meta: CartLineMeta) => void;
}) => {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);
  const unitPrice = l.meta?.unitPrice ?? l.product.price;

  const isBooking =
    isSweetsProduct(l.product.source) &&
    fulfillmentTypeFor(l.product.id, l.product.subCategory) === "C";
  const [editOpen, setEditOpen] = useState(false);
  const days = useMemo(() => buildBookingDays(7), []);
  const currentDateIdx = Math.max(
    0,
    days.findIndex((d) => d.toISOString().slice(0, 10) === l.meta?.bookingDate),
  );
  const lineSubtotal = unitPrice * l.qty;
  const depositRequired = isBooking && lineSubtotal >= DEPOSIT_THRESHOLD;
  const payDeposit = isBooking && (depositRequired || (l.meta?.payDeposit ?? true));
  const shipMode = (l.meta?.shipMode ?? "split") as "split" | "wait";

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div
        style={{ opacity: bgOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-start rounded-2xl bg-gradient-to-l from-destructive to-destructive/70 px-5"
      >
        <Trash2 className="h-5 w-5 text-white" />
        <span className="ms-2 text-xs font-extrabold text-white">اسحب للحذف</span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.15}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -90) {
            remove(l.product.id);
          } else {
            animate(x, 0, { type: "spring", damping: 28, stiffness: 320 });
          }
        }}
        className="relative flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.12)] ring-1 ring-border/30"
      >
        <div className="flex gap-3">
          <img
            src={l.product.image}
            alt=""
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-sm font-bold leading-tight">{l.product.name}</h3>
              <button
                onClick={() => remove(l.product.id)}
                className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-destructive/10 text-destructive transition active:scale-90"
                aria-label="حذف"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">{l.product.unit}</p>
            {l.meta?.kind === "borrow" && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
                  📚 استعارة · {toLatin(l.meta.borrowDays ?? 0)} يوم
                </span>
                {l.meta.borrowDeposit ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    تأمين مسترد {fmtMoney(l.meta.borrowDeposit)}
                  </span>
                ) : null}
              </div>
            )}
            {l.meta?.kind === "print" && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">
                  🖨️ طباعة سحابية
                </span>
                {l.meta.prepHours ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    ⏱️ تجهيز {toLatin(l.meta.prepHours)} ساعات
                  </span>
                ) : null}
              </div>
            )}
            {(l.meta?.variantId || l.meta?.addonIds?.length) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {l.meta?.variantId &&
                  (() => {
                    const v = l.product.variants?.find((x) => x.id === l.meta?.variantId);
                    return v ? (
                      <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-extrabold text-violet-700 dark:text-violet-300">
                        {v.label}
                      </span>
                    ) : null;
                  })()}
                {l.meta?.addonIds?.map((id) => {
                  const a = l.product.addons?.find((x) => x.id === id);
                  return a ? (
                    <span
                      key={id}
                      className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[9px] font-extrabold text-foreground/80"
                    >
                      + {a.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="font-display text-base font-extrabold text-primary">
                <NumberFlow value={unitPrice * l.qty} />{" "}
                <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
              </span>
              <div className="flex items-center gap-0.5 rounded-full bg-foreground/[0.06] p-0.5 ring-1 ring-border/40">
                <button
                  onClick={() => setQty(l.product.id, l.qty - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground/70 shadow-sm transition active:scale-90"
                  aria-label="إنقاص"
                >
                  <Minus className="h-2.5 w-2.5" strokeWidth={2.6} />
                </button>
                <span className="w-6 text-center text-[12px] font-extrabold tabular-nums">
                  <NumberFlow value={l.qty} />
                </span>
                <button
                  onClick={() => setQty(l.product.id, l.qty + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition active:scale-90"
                  aria-label="زيادة"
                >
                  <Plus className="h-2.5 w-2.5" strokeWidth={2.8} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {isBooking && (
          <div className="rounded-[14px] bg-violet-500/8 ring-1 ring-violet-500/20">
            <button
              type="button"
              onClick={() => setEditOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-right"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-extrabold text-violet-700 dark:text-violet-300">
                    {l.meta?.bookingDate
                      ? formatBookingShort(new Date(l.meta.bookingDate))
                      : "اختر موعد الاستلام"}
                    {" · "}
                    {bookingTimeSlots.find((s) => s.id === l.meta?.bookingSlot)?.label ?? "—"}
                  </p>
                  <p className="text-[9.5px] font-bold text-foreground/70">
                    {payDeposit
                      ? `عربون ${fmtMoney(Math.round(lineSubtotal * 0.5))} الآن · ${shipMode === "wait" ? "استلام كامل" : "استلام مُجزّأ"}`
                      : `دفع كامل مقدماً · ${shipMode === "wait" ? "استلام كامل" : "استلام مُجزّأ"}`}
                  </p>
                </div>
              </div>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                  editOpen
                    ? "bg-violet-600 text-white"
                    : "bg-violet-600/15 text-violet-700 dark:text-violet-300"
                }`}
                aria-label={editOpen ? "إغلاق التعديل" : "تعديل الموعد"}
              >
                {editOpen ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3 w-3" strokeWidth={2.6} />}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {editOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-violet-500/15 px-3 py-3"
                >
                  <p className="mb-1.5 text-[10px] font-extrabold text-foreground/80">تاريخ الاستلام</p>
                  <div className="-mx-3 mb-3 overflow-x-auto px-3">
                    <div className="flex gap-1.5 pb-1">
                      {days.map((d, i) => {
                        const active = i === currentDateIdx;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              updateMeta(l.product.id, {
                                bookingDate: d.toISOString().slice(0, 10),
                              })
                            }
                            className={`flex w-[58px] shrink-0 flex-col items-center rounded-[10px] border px-1 py-1.5 text-[9.5px] font-extrabold transition ${
                              active
                                ? "border-violet-500 bg-violet-500 text-white"
                                : "border-border bg-background"
                            }`}
                          >
                            <span className="opacity-80">
                              {d.toLocaleDateString("ar-EG", { weekday: "short" })}
                            </span>
                            <span className="font-display text-[13px] tabular-nums">
                              {toLatin(d.getDate())}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="mb-1.5 text-[10px] font-extrabold text-foreground/80">وقت الاستلام</p>
                  <div className="mb-3 grid grid-cols-2 gap-1.5">
                    {bookingTimeSlots.map((s) => {
                      const active = s.id === l.meta?.bookingSlot;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => updateMeta(l.product.id, { bookingSlot: s.id })}
                          className={`rounded-[10px] border px-2 py-1.5 text-[10px] font-extrabold transition ${
                            active
                              ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                              : "border-border bg-background text-foreground"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mb-1.5 text-[10px] font-extrabold text-foreground/80">طريقة الوصول</p>
                  <div className="mb-3 grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: "split", label: "على دفعتين" },
                        { id: "wait", label: "كل الطلب معاً" },
                      ] as const
                    ).map((m) => {
                      const active = shipMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => updateMeta(l.product.id, { shipMode: m.id })}
                          className={`rounded-[10px] border px-2 py-1.5 text-[10px] font-extrabold transition ${
                            active
                              ? "border-violet-500 bg-violet-500 text-white"
                              : "border-border bg-background text-foreground"
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mb-1.5 text-[10px] font-extrabold text-foreground/80">
                    خطة الدفع
                    {depositRequired && (
                      <span className="ms-1 rounded-md bg-amber-500/20 px-1 py-0.5 text-[8.5px] text-amber-800 dark:text-amber-300">
                        عربون إجباري
                      </span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: true, label: `عربون 50٪ · ${toLatin(Math.round(lineSubtotal * 0.5))} ج` },
                        { id: false, label: `كامل المبلغ · ${toLatin(lineSubtotal)} ج` },
                      ] as const
                    ).map((opt) => {
                      const active = payDeposit === opt.id;
                      const disabled = depositRequired && opt.id === false;
                      return (
                        <button
                          key={String(opt.id)}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            !disabled && updateMeta(l.product.id, { payDeposit: opt.id })
                          }
                          className={`rounded-[10px] border px-2 py-1.5 text-[10px] font-extrabold tabular-nums transition ${
                            active
                              ? "border-violet-500 bg-violet-500 text-white"
                              : "border-border bg-background text-foreground"
                          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};
