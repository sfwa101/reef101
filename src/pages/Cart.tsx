import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Cake,
  Check,
  Clock,
  Gift,
  PiggyBank,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import BackHeader from "@/components/BackHeader";
import CartUpgradeBanner from "@/components/baskets/CartUpgradeBanner";
import { fmtMoney, toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import { paymentOptions, useCartOrchestrator } from "@/features/cart/hooks/useCartOrchestrator";
import { CartAddressSelector } from "@/features/cart/components/CartAddressSelector";
import { CartCheckoutActions } from "@/features/cart/components/CartCheckoutActions";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { NumberFlow } from "@/features/cart/components/NumberFlow";
import { RechargeDialog } from "@/features/cart/components/RechargeDialog";
import { VendorGroupCard } from "@/features/cart/components/VendorGroupCard";

const Cart = () => {
  const o = useCartOrchestrator();

  if (o.lines.length === 0) {
    return (
      <div>
        <BackHeader title="سلتي" subtitle="جاهز للطلب" />
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-primary-soft">
            <ShoppingBag className="h-10 w-10 text-primary" strokeWidth={2} />
          </div>
          <h2 className="font-display text-2xl font-extrabold">السلة فارغة</h2>
          <p className="text-sm text-muted-foreground">ابدأ التسوق من أقسامنا المختلفة</p>
          <Link to="/sections" className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pill">
            تصفّح الأقسام
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      <BackHeader title="سلتي" subtitle={`${toLatin(o.count)} منتج`} />

      {/* Smart Progress Bar */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-accent/10 to-primary/5 p-3 ring-1 ring-primary/15">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
            {o.progress.done ? <Gift className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
          </div>
          <p className="flex-1 text-[11px] font-extrabold text-foreground">{o.progress.label}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
          <motion.div initial={{ width: 0 }} animate={{ width: `${o.progress.pct}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
        </div>
      </motion.div>

      <CartUpgradeBanner />

      {/* Multi-vendor segmented lines */}
      <div className="space-y-4">
        {o.isMultiVendor && (
          <div className="flex items-start gap-2 rounded-2xl bg-accent/10 p-2.5 ring-1 ring-accent/20">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
            <p className="text-[11px] font-bold text-foreground">
              طلبك يحتوي على <span className="text-accent-foreground">{toLatin(o.vendorGroups.length)} موردين</span> — كل قسم سيصل من مصدره الخاص.
            </p>
          </div>
        )}

        {o.showFulfillmentSections && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <Zap className="h-3 w-3" strokeWidth={2.6} />
            </div>
            <h3 className="font-display text-[13px] font-extrabold text-foreground">
              يصلك فوراً
              <span className="ms-1.5 text-[10px] font-bold text-muted-foreground">خلال {o.zone.etaLabel}</span>
            </h3>
          </div>
        )}

        {(o.showFulfillmentSections ? o.instantGroups : o.vendorGroups).map((g) => (
          <VendorGroupCard key={g.key} g={g} payment={o.payment} setQty={o.setQty} remove={o.remove} updateMeta={o.updateMeta} showScheduledHint={!o.showFulfillmentSections && o.groupIsMixedScheduled(g)} />
        ))}

        {o.showFulfillmentSections && (
          <>
            <div className="mt-2 flex items-center gap-2 px-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300">
                <CalendarDays className="h-3 w-3" strokeWidth={2.6} />
              </div>
              <h3 className="font-display text-[13px] font-extrabold text-foreground">
                حجوزات مجدولة
                <span className="ms-1.5 text-[10px] font-bold text-muted-foreground">حسب الموعد</span>
              </h3>
            </div>
            {o.scheduledGroups.map((g) => (
              <VendorGroupCard key={g.key} g={g} payment={o.payment} setQty={o.setQty} remove={o.remove} updateMeta={o.updateMeta} />
            ))}
          </>
        )}
        <p className="px-1 text-center text-[10px] text-muted-foreground">💡 اسحب المنتج لليسار للحذف السريع</p>
      </div>

      {/* Cross-sell rail */}
      {o.crossSell.length > 0 && (
        <section className="-mx-4 rounded-none bg-primary/[0.04] px-4 py-3 ring-1 ring-primary/10 sm:mx-0 sm:rounded-2xl">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="font-display text-[12px] font-extrabold flex items-center gap-1.5 text-foreground/90">
              <Sparkles className="h-3 w-3 text-accent" /> غالباً ما يُشترى مع
            </h2>
            <span className="text-[10px] text-muted-foreground">إضافات سريعة</span>
          </div>
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex gap-2 pb-1">
              {o.crossSell.map((p) => (
                <motion.button key={p.id} whileTap={{ scale: 0.95 }} onClick={() => { o.add(p, 1); fireMiniConfetti(); toast.success(`تمت إضافة ${p.name}`); }} className="relative flex w-[100px] shrink-0 flex-col rounded-xl bg-card p-1.5 text-right shadow-[0_3px_10px_-6px_rgba(0,0,0,0.12)] ring-1 ring-border/30">
                  <img src={p.image} alt="" className="mb-1 h-16 w-full rounded-lg object-cover" />
                  <p className="line-clamp-2 text-[10px] font-bold leading-tight">{p.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-display text-[11px] font-extrabold text-primary tabular-nums">{toLatin(p.price)} ج</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pill">
                      <Plus className="h-2.5 w-2.5" strokeWidth={3} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      <CartAddressSelector user={o.user} addresses={o.addresses} addrId={o.addrId} setAddrId={o.setAddrId} guestNotes={o.guestNotes} setGuestNotes={o.setGuestNotes} />

      {/* Payment */}
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
            <motion.label initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 to-[hsl(45_70%_92%)] p-3 ring-1 ring-primary/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary to-[hsl(45_80%_55%)] text-white shadow-pill">
                <PiggyBank className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-extrabold">ادفع {toLatin(o.roundedCash)} ج.م رقم صحيح</p>
                <p className="text-[10px] text-muted-foreground">الفكة <span className="font-extrabold text-primary">{toLatin(o.changeRemainder)} ج.م</span> تدخل حصّالتك تلقائياً</p>
              </div>
              <input type="checkbox" checked={o.saveChange} onChange={(e) => o.setSaveChange(e.target.checked)} className="h-5 w-5 cursor-pointer accent-primary" />
            </motion.label>
          )}
        </AnimatePresence>
      </section>

      {/* Promo */}
      <motion.div layout className={`overflow-hidden rounded-2xl bg-card shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 transition ${o.appliedPromo ? "ring-primary/40" : "ring-border/30"}`}>
        <div className="flex items-center gap-2 p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary"><Tag className="h-4 w-4" /></div>
          <input value={o.promo} onChange={(e) => o.setPromo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && o.applyPromo()} placeholder="كود الخصم (REEF10، WELCOME25)" className="flex-1 bg-transparent text-sm font-bold outline-none" />
          <button onClick={o.applyPromo} className={`rounded-[10px] px-4 py-2 text-xs font-extrabold transition ${o.appliedPromo ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}>
            {o.appliedPromo ? <Check className="h-4 w-4" /> : "تطبيق"}
          </button>
        </div>
        <AnimatePresence>
          {o.appliedPromo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-primary/15 bg-primary/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-primary">🎉 وفّرت اليوم</p>
                <p className="font-display text-base font-extrabold text-primary"><NumberFlow value={o.discount} /> ج.م</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tip */}
      <div className="rounded-2xl bg-card p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold">إكرامية المندوب 💚</p>
          <span className="text-xs font-extrabold text-primary tabular-nums">{o.tip > 0 ? fmtMoney(o.tip) : "اختياري"}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 5, 10, 20].map((t) => {
            const active = o.tip === t;
            return (
              <motion.button whileTap={{ scale: 0.94 }} key={t} onClick={() => o.setTip(t)} className={`relative rounded-[12px] py-2.5 text-xs font-extrabold transition tabular-nums ${active ? "bg-gradient-to-br from-primary to-[hsl(150_55%_38%)] text-primary-foreground shadow-[0_6px_18px_-6px_hsl(150_60%_40%/0.55)]" : "bg-foreground/5"}`}>
                {t === 0 ? "بدون" : `${toLatin(t)} ج`}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ETA */}
      <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft"><Clock className="h-4 w-4 text-primary" /></div>
        <div className="flex-1">
          <p className="text-xs font-bold">وقت التوصيل لمنطقتك ({o.zone.shortName})</p>
          <p className="text-[10px] text-muted-foreground">{o.zone.etaLabel}</p>
        </div>
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-extrabold text-muted-foreground">نطاق {o.zone.id}</span>
      </div>

      <CartSummary subtotal={o.subtotal} discount={o.discount} appliedPromo={o.appliedPromo} delivery={o.delivery} billSavings={o.billSavings} tip={o.tip} isSplit={o.isSplit} walletApplied={o.walletApplied} walletShortfall={o.walletShortfall} secondaryLabel={o.secondaryLabel} grand={o.grand} />

      <button onClick={() => o.clear()} className="w-full rounded-2xl bg-foreground/5 py-3 text-xs font-bold text-muted-foreground">تفريغ السلة</button>

      {/* Guest checkout */}
      {!o.user && (
        <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-extrabold">إتمام الطلب كضيف</p>
              <p className="text-[11px] text-muted-foreground">أو <Link to="/auth" className="font-bold text-primary underline">سجّل الدخول</Link> لحفظ طلباتك</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">سريع</span>
          </div>
          <div className="space-y-2">
            <input type="text" value={o.guestName} onChange={(e) => o.setGuestName(e.target.value)} placeholder="الاسم بالكامل" maxLength={80} className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            <input type="tel" inputMode="tel" value={o.guestPhone} onChange={(e) => o.setGuestPhone(e.target.value)} placeholder="رقم الهاتف" maxLength={20} className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            <textarea value={o.guestAddress} onChange={(e) => o.setGuestAddress(e.target.value)} placeholder="عنوان التوصيل بالتفصيل" maxLength={300} rows={2} className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </section>
      )}

      <CartCheckoutActions grand={o.grand} minOrderTotal={o.minOrderTotal} submitting={o.submitting} onCheckout={o.checkoutWA} />

      <AnimatePresence>
        {o.showRecharge && o.user && (
          <RechargeDialog onClose={() => o.setShowRecharge(false)} userId={o.user.id} currentBalance={o.walletBalance} shortfall={Math.max(0, o.grand - o.walletBalance)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
