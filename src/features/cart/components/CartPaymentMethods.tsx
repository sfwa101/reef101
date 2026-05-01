import { motion, AnimatePresence } from "framer-motion";
import { Cake, HandHeart, PiggyBank } from "lucide-react";
import { fmtMoney, toLatin } from "@/lib/format";
import { paymentOptions, type useCartOrchestrator } from "../hooks/useCartOrchestrator";

type O = ReturnType<typeof useCartOrchestrator>;

/**
 * Payment method selector + booking summary + split-payment helper +
 * smart change-jar. Reads everything off the orchestrator state machine.
 */
export const CartPaymentMethods = ({ o }: { o: O }) => {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">طريقة الدفع</p>
        {!o.zone.codAllowed && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
            الدفع عند الاستلام غير متاح في {o.zone.shortName}
          </span>
        )}
      </div>

      {o.sweetsRules.hasBooking && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl bg-violet-500/10 p-2.5 ring-1 ring-violet-500/25">
          <Cake className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
          <div className="flex-1 text-[11px] font-bold leading-relaxed text-foreground/90">
            يحتوي طلبك على حجز خاص — يُرجى الدفع مسبقاً (محفظة أو إلكتروني) لتأكيد الحجز.
          </div>
        </div>
      )}

      <div className="space-y-2">
        {paymentOptions
          .filter((m) => o.zone.codAllowed || m.id !== "cash")
          .filter((m) => !o.sweetsRules.blockCOD || m.id !== "cash")
          .map((m) => {
            const Icon = m.icon;
            const active = o.payment === m.id;
            const isWallet = m.id === "wallet";
            const walletAfter = isWallet ? Math.max(0, o.walletBalance - o.grand) : 0;
            return (
              <motion.button whileTap={{ scale: 0.99 }} key={m.id} onClick={() => o.setPayment(m.id)} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-right transition ${active ? "border-primary bg-primary-soft shadow-[0_0_0_4px_hsl(var(--primary)/0.08),0_8px_24px_-12px_hsl(var(--primary)/0.45)]" : "border-border bg-background hover:border-primary/30"}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${active ? "bg-primary text-primary-foreground" : "bg-foreground/5"}`}>
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">{m.label}</p>
                  {isWallet && o.user ? (
                    <>
                      <p className="text-[10px] font-bold text-primary">
                        متاح: {toLatin(Math.round(o.walletBalance))} ج.م
                        {active && o.walletBalance >= o.grand && o.grand > 0 && (
                          <span className="ms-1 text-foreground/60 font-extrabold">· المتبقي بعد العملية {toLatin(Math.round(walletAfter))} ج.م</span>
                        )}
                      </p>
                      {o.trustLimit > 0 && (
                        <p className="mt-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          🛡️ رصيد ثقة: +{toLatin(o.trustLimit)} ج.م
                          {active && o.trustUsed > 0 && (
                            <span className="ms-1 font-extrabold">· مستخدم {toLatin(Math.round(o.trustUsed))} ج (يُسدَّد لاحقًا)</span>
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                  )}
                </div>
                <div className={`h-4 w-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
              </motion.button>
            );
          })}
      </div>

      {o.sweetsRules.hasBooking && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/8 to-fuchsia-500/8 p-3 ring-1 ring-violet-500/25">
          <div className="mb-2 flex items-center gap-2">
            <Cake className="h-4 w-4 text-violet-600" />
            <p className="text-[12px] font-extrabold">ملخّص حجوزات الحلويات</p>
          </div>
          <div className="space-y-1 rounded-[12px] bg-card/70 p-2.5 ring-1 ring-violet-500/20">
            <div className="flex items-center justify-between text-[11px]"><span className="font-bold text-foreground/80">إجمالي الحجوزات</span><span className="font-display font-extrabold tabular-nums">{fmtMoney(o.sweetsRules.bookingSubtotal)}</span></div>
            <div className="flex items-center justify-between text-[11px]"><span className="font-bold text-foreground/80">يُدفع الآن (عربون/كامل)</span><span className="font-display font-extrabold text-violet-700 tabular-nums dark:text-violet-300">{fmtMoney(o.aggregateDeposit)}</span></div>
            {o.payOnDelivery > 0 && (
              <div className="flex items-center justify-between text-[11px]"><span className="font-bold text-foreground/80">يُحصّل عند التوصيل</span><span className="font-display font-extrabold tabular-nums">{fmtMoney(o.payOnDelivery)}</span></div>
            )}
            <div className="flex items-center justify-between text-[10px] pt-1"><span className="text-muted-foreground">طريقة التوصيل</span><span className="font-extrabold text-foreground/85">{o.anyWaitForAll ? "كل الطلب يصل معاً 📦" : "طلبك يصل على دفعتين 🚚 + 🎂"}</span></div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">💡 يمكنك تعديل موعد كل حجز وخطة دفعه من زر «تعديل» على بطاقة المنتج بالأعلى.</p>
        </motion.div>
      )}

      <AnimatePresence>
        {o.isSplit && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 p-3 ring-1 ring-accent/20">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-foreground">دفع الباقي عبر</p>
              <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-extrabold text-accent-foreground">{toLatin(Math.round(o.walletShortfall))} ج.م متبقّية</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {paymentOptions
                .filter((p) => p.id !== "wallet")
                .filter((p) => o.zone.codAllowed || p.id !== "cash")
                .filter((p) => !o.sweetsRules.blockCOD || p.id !== "cash")
                .map((m) => {
                  const Icon = m.icon;
                  const a = o.secondaryPayment === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => o.setSecondaryPayment(m.id)} className={`flex flex-col items-center gap-1 rounded-[12px] border-2 p-2 transition ${a ? "border-primary bg-primary-soft" : "border-border bg-background"}`}>
                      <Icon className={`h-4 w-4 ${a ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2.4} />
                      <span className="text-[10px] font-bold leading-tight">{m.label}</span>
                    </button>
                  );
                })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
              <span>محفظة: <span className="text-primary">{fmtMoney(o.walletApplied)}</span></span>
              <button type="button" onClick={() => o.setShowRecharge(true)} className="rounded-[8px] bg-accent/20 px-2 py-1 text-[10px] font-extrabold text-accent-foreground">شحن المحفظة</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {o.showChangeJar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 to-[hsl(45_70%_92%)] p-3 ring-1 ring-primary/20"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary to-[hsl(45_80%_55%)] text-white shadow-pill">
                {o.donateChange ? (
                  <HandHeart className="h-5 w-5" strokeWidth={2.2} />
                ) : (
                  <PiggyBank className="h-5 w-5" strokeWidth={2.2} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-extrabold">
                  ادفع {toLatin(o.roundedCash)} ج.م رقم صحيح
                </p>
                <p className="text-[10px] text-muted-foreground">
                  الفكة{" "}
                  <span className="font-extrabold text-primary">
                    {toLatin(o.changeRemainder)} ج.م
                  </span>{" "}
                  {o.donateChange
                    ? "تذهب للصندوق العام للخير ❤"
                    : o.saveChange
                      ? "تدخل حصّالتك تلقائياً"
                      : "تبقى معك"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  o.setSaveChange(false);
                  o.setDonateChange(false);
                }}
                className={`rounded-[10px] px-2 py-1.5 text-[10px] font-extrabold transition ${
                  !o.saveChange && !o.donateChange
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground ring-1 ring-border"
                }`}
              >
                لا شيء
              </button>
              <button
                type="button"
                onClick={() => {
                  o.setSaveChange(true);
                  o.setDonateChange(false);
                }}
                className={`flex items-center justify-center gap-1 rounded-[10px] px-2 py-1.5 text-[10px] font-extrabold transition ${
                  o.saveChange && !o.donateChange
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground ring-1 ring-border"
                }`}
              >
                <PiggyBank className="h-3 w-3" /> حصّالة
              </button>
              <button
                type="button"
                onClick={() => {
                  o.setSaveChange(false);
                  o.setDonateChange(true);
                }}
                className={`flex items-center justify-center gap-1 rounded-[10px] px-2 py-1.5 text-[10px] font-extrabold transition ${
                  o.donateChange
                    ? "bg-rose-500 text-white"
                    : "bg-card text-muted-foreground ring-1 ring-border"
                }`}
              >
                <HandHeart className="h-3 w-3" /> صدقة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
