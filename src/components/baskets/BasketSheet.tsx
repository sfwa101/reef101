import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Repeat, Gift, ArrowRightLeft, Sparkles, Star, Users, ChevronDown,
  Calendar, Wallet as WalletIcon, Lock, Mail,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { fireMiniConfetti } from "@/lib/confetti";
import { toLatin } from "@/lib/format";
import {
  basketContents, basketMarketing, hydrateBasket, sumBasketRetail,
  subFrequencies, findFrequency, loadSubs, saveSubs,
  type SubFrequencyId, type SubscriptionRecord,
} from "@/lib/baskets";
import SmartSwapSheet from "./SmartSwapSheet";
import AnimatedNumber from "./AnimatedNumber";

type Mode = "oneoff" | "subscribe";
type GiftMeta = {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  message: string;
};

type Props = { product: Product; open: boolean; onClose: () => void };

const BasketSheet = ({ product, open, onClose }: Props) => {
  const { add } = useCart();
  const { profile } = useAuth();
  const marketing = basketMarketing[product.id];
  const baseContents = basketContents[product.id] ?? [];
  const hasContents = baseContents.length > 0;

  // Per-line swaps for THIS sheet session (originalId → replacementId)
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  // Bottom-sheet swap state
  const [swapOpen, setSwapOpen] = useState<{ originalId: string; currentId: string; qty: number } | null>(null);

  const [mode, setMode] = useState<Mode>("oneoff");
  const [freq, setFreq] = useState<SubFrequencyId>("weekly");
  const [gift, setGift] = useState(false);
  const [giftMeta, setGiftMeta] = useState<GiftMeta>({
    recipientName: "", recipientPhone: "", recipientAddress: "", message: "",
  });
  const [showContents, setShowContents] = useState(true);

  useEffect(() => {
    if (!open) return;
    setSwaps({});
    setMode("oneoff");
    setFreq("weekly");
    setGift(false);
  }, [open, product.id]);

  const items = useMemo(() => hydrateBasket(product.id, swaps), [product.id, swaps]);
  const retail = useMemo(() => sumBasketRetail(items), [items]);

  // Apply price difference from swaps as a delta on the basket's published price
  // (preserves the original "savings" framing).
  const baseRetail = useMemo(() => sumBasketRetail(hydrateBasket(product.id, {})), [product.id]);
  const swapDelta = retail - baseRetail;
  const oneoffPrice = Math.max(0, product.price + swapDelta);

  const freqObj = findFrequency(freq);
  const subscribeDiscount = Math.round(oneoffPrice * (freqObj.discountPct / 100));
  const subscribePrice = oneoffPrice - subscribeDiscount;
  const cashbackEarn = Math.round(subscribePrice * (freqObj.cashbackPct / 100));

  const finalPrice = mode === "subscribe" ? subscribePrice : oneoffPrice;

  const isRecommended =
    marketing?.recommendedFor &&
    profile?.household_size != null &&
    (marketing.recommendedFor.minHousehold == null ||
      profile.household_size >= marketing.recommendedFor.minHousehold) &&
    (marketing.recommendedFor.maxHousehold == null ||
      profile.household_size <= marketing.recommendedFor.maxHousehold);

  const requestSwap = (originalId: string) => {
    const currentId = swaps[originalId] ?? originalId;
    const item = baseContents.find((it) => it.productId === originalId);
    setSwapOpen({ originalId, currentId, qty: item?.qty ?? 1 });
  };

  const applySwap = (originalId: string, newProductId: string) => {
    setSwaps((prev) => {
      const next = { ...prev };
      if (newProductId === originalId) delete next[originalId];
      else next[originalId] = newProductId;
      return next;
    });
    setSwapOpen(null);
    toast.success("تم الاستبدال");
  };

  const giftValid = !gift || (
    giftMeta.recipientName.trim().length >= 2 &&
    giftMeta.recipientPhone.replace(/\D/g, "").length >= 10 &&
    giftMeta.recipientAddress.trim().length >= 4
  );

  const handleConfirm = () => {
    if (gift && !giftValid) {
      toast.error("أدخل بيانات المستلم وعنوانه");
      return;
    }
    const noteParts: string[] = [];
    if (Object.keys(swaps).length) {
      const swapTxt = Object.entries(swaps)
        .map(([orig, repl]) => {
          const o = baseContents.find((b) => b.productId === orig);
          if (!o) return "";
          const replItem = items.find((i) => i.originalId === orig);
          return `${orig}→${replItem?.product.name ?? repl}`;
        })
        .filter(Boolean)
        .join(" · ");
      noteParts.push(`استبدالات: ${swapTxt}`);
    }
    if (gift) {
      noteParts.push(
        `هدية إلى ${giftMeta.recipientName} · ${giftMeta.recipientPhone} · ${giftMeta.recipientAddress}`
      );
      if (giftMeta.message.trim()) noteParts.push(`رسالة: ${giftMeta.message.trim()}`);
    }

    if (mode === "subscribe") {
      const subs = loadSubs();
      const next: SubscriptionRecord = {
        id: `sub-${Date.now()}`,
        basketId: product.id,
        basketName: product.name,
        basketImage: product.image,
        basketPrice: subscribePrice,
        frequency: freq,
        nextDelivery: new Date(Date.now() + freqObj.cadenceDays * 86400000).toISOString(),
        swaps,
        paused: false,
        createdAt: new Date().toISOString(),
        giftMode: gift,
      };
      saveSubs([next, ...subs]);
      // Add ONE delivery to cart now, then redirect to Subscriptions dashboard.
      add(product, 1, {
        unitPrice: subscribePrice,
        bookingNote: ["اشتراك " + freqObj.label, ...noteParts].join(" · "),
      });
      toast.success(`تم بدء الاشتراك ${freqObj.shortLabel} · كاشباك ${toLatin(cashbackEarn)} ج.م`);
    } else {
      add(product, 1, {
        unitPrice: oneoffPrice,
        bookingNote: noteParts.join(" · ") || undefined,
      });
      toast.success(`أضيفت ${product.name}`);
    }
    fireMiniConfetti();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 sm:items-center"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card shadow-float sm:rounded-[28px]"
          >
            {/* Hero */}
            <div className="relative h-44 w-full overflow-hidden">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <button
                onClick={onClose} aria-label="إغلاق"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-pill"
              >
                <X className="h-4 w-4" />
              </button>
              {marketing && (
                <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-pill ring-1
                  ${marketing.badgeTone === "amber" ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 ring-amber-500/40" : ""}
                  ${marketing.badgeTone === "emerald" ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-emerald-500/40" : ""}
                  ${marketing.badgeTone === "rose" ? "bg-rose-500/20 text-rose-800 dark:text-rose-200 ring-rose-500/40" : ""}
                  ${marketing.badgeTone === "violet" ? "bg-violet-500/20 text-violet-800 dark:text-violet-200 ring-violet-500/40" : ""}`}>
                  <Sparkles className="h-3 w-3" />{marketing.badge}
                </span>
              )}
              <div className="absolute inset-x-4 bottom-3">
                <h2 className="font-display text-xl font-extrabold leading-tight text-foreground">
                  {product.name}
                </h2>
                <p className="text-[11px] text-muted-foreground">{product.unit}</p>
                {isRecommended && marketing?.recommendedFor && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/40">
                    <Users className="h-3 w-3" /> موصاة لك · {marketing.recommendedFor.reason}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 p-4">
              {marketing && (
                <div className="flex items-center justify-between rounded-2xl bg-foreground/5 px-3 py-2 text-[10.5px] font-extrabold">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <Star className="h-3 w-3 fill-current" /> اشتراها {toLatin(marketing.soldThisWeek)} عميل هذا الأسبوع
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300">
                    متبقي {toLatin(marketing.remaining)} فقط
                  </span>
                </div>
              )}

              {/* Mode tabs */}
              <div className="flex rounded-2xl bg-foreground/5 p-1">
                {(["oneoff", "subscribe"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-xl py-2 text-[12px] font-extrabold transition ${
                      mode === m ? "bg-card text-foreground shadow-pill" : "text-muted-foreground"
                    }`}
                  >
                    {m === "oneoff" ? "شراء لمرة واحدة" : `اشترك ووفر ${toLatin(freqObj.discountPct)}%`}
                  </button>
                ))}
              </div>

              {/* Subscription frequency */}
              {mode === "subscribe" && (
                <section className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-200">
                    تردد التوصيل
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {subFrequencies.map((f) => {
                      const active = f.id === freq;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setFreq(f.id)}
                          className={`rounded-xl px-2 py-2 text-center text-[10.5px] font-extrabold transition ${
                            active ? "bg-emerald-600 text-white shadow-pill" : "bg-background text-foreground"
                          }`}
                        >
                          {f.shortLabel}
                          <span className="block text-[9px] font-bold opacity-80">−{toLatin(f.discountPct)}%</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-card/60 px-3 py-2 text-[10.5px] font-extrabold">
                    <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-200">
                      <WalletIcon className="h-3 w-3" /> كاشباك على كل توصيلة
                    </span>
                    <span className="tabular-nums text-emerald-700 dark:text-emerald-300">
                      +{toLatin(cashbackEarn)} ج.م
                    </span>
                  </div>
                </section>
              )}

              {/* Gift toggle */}
              <button
                onClick={() => setGift((g) => !g)}
                className={`flex w-full items-center justify-between rounded-2xl border-2 p-3 text-right transition ${
                  gift ? "border-violet-500 bg-violet-500/10" : "border-border bg-background"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    gift ? "bg-violet-600 text-white" : "bg-violet-500/15 text-violet-700"
                  }`}>
                    <Gift className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-extrabold">أرسلها كهدية</span>
                    <span className="block text-[10px] font-bold text-muted-foreground">
                      تخفي السعر وتطبع رسالة على كارت أنيق
                    </span>
                  </span>
                </span>
                <span className={`h-5 w-9 rounded-full p-0.5 transition ${gift ? "bg-violet-600" : "bg-foreground/15"}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition ${gift ? "translate-x-[-16px] rtl:translate-x-[-16px]" : ""}`} />
                </span>
              </button>

              {gift && (
                <section className="space-y-2 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-3">
                  <input
                    placeholder="اسم المستلم"
                    value={giftMeta.recipientName}
                    onChange={(e) => setGiftMeta((m) => ({ ...m, recipientName: e.target.value }))}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-[12px] outline-none focus:border-violet-500"
                  />
                  <input
                    placeholder="رقم هاتف المستلم"
                    inputMode="tel"
                    value={giftMeta.recipientPhone}
                    onChange={(e) => setGiftMeta((m) => ({ ...m, recipientPhone: e.target.value }))}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-[12px] outline-none focus:border-violet-500"
                  />
                  <input
                    placeholder="عنوان المستلم بالكامل"
                    value={giftMeta.recipientAddress}
                    onChange={(e) => setGiftMeta((m) => ({ ...m, recipientAddress: e.target.value }))}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-[12px] outline-none focus:border-violet-500"
                  />
                  <textarea
                    placeholder="رسالة الإهداء (تطبع على كارت داخل العلبة)"
                    value={giftMeta.message}
                    rows={2} maxLength={120}
                    onChange={(e) => setGiftMeta((m) => ({ ...m, message: e.target.value }))}
                    className="w-full resize-none rounded-xl border-2 border-border bg-background px-3 py-2 text-[12px] outline-none focus:border-violet-500"
                  />
                  <p className="flex items-start gap-1.5 rounded-xl bg-violet-500/10 px-3 py-2 text-[10.5px] font-bold text-violet-800 dark:text-violet-200">
                    <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                    سيتم إخفاء الفاتورة والسعر تمامًا عن المستلم. الدفع إلكتروني/محفظة فقط — يُعطل الدفع عند الاستلام.
                  </p>
                </section>
              )}

              {/* Contents accordion */}
              {hasContents && (
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
                  <button
                    onClick={() => setShowContents((v) => !v)}
                    className="flex w-full items-center justify-between p-3 text-right"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-extrabold">محتويات السلة ({toLatin(items.length)})</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showContents ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showContents && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }} className="overflow-hidden"
                      >
                        <ul className="divide-y divide-border/50 border-t border-border/50">
                          {items.map((it) => {
                            const swapped = it.product.id !== it.originalId;
                            return (
                              <li key={it.originalId} className="flex items-center gap-2.5 px-3 py-2">
                                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                                  <img src={it.product.image} alt={it.product.name} className="h-full w-full object-cover" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="line-clamp-1 text-[12px] font-extrabold">
                                    {it.product.name}
                                    {swapped && (
                                      <span className="mr-1.5 inline-block rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800 dark:text-amber-200">
                                        مستبدل
                                      </span>
                                    )}
                                  </span>
                                  <span className="block text-[10px] text-muted-foreground">×{toLatin(it.qty)} · {toLatin(it.product.price * it.qty)} ج.م</span>
                                </span>
                                <button
                                  onClick={() => requestSwap(it.originalId)}
                                  aria-label="استبدال"
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )}

              {/* Total card */}
              <section className="space-y-1 rounded-2xl bg-gradient-to-l from-emerald-500/15 via-emerald-500/5 to-transparent p-3 ring-1 ring-emerald-500/30">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-muted-foreground">
                  <span>قيمة المنتجات منفردة</span>
                  <span className="tabular-nums line-through">{toLatin(retail)} ج.م</span>
                </div>
                <div className="flex items-center justify-between text-[11.5px] font-extrabold">
                  <span>سعر السلة</span>
                  <span className="tabular-nums">{toLatin(oneoffPrice)} ج.م</span>
                </div>
                {mode === "subscribe" && (
                  <div className="flex items-center justify-between text-[11.5px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    <span>خصم الاشتراك ({freqObj.shortLabel})</span>
                    <span className="tabular-nums">−{toLatin(subscribeDiscount)} ج.م</span>
                  </div>
                )}
                <div className="mt-1 flex items-end justify-between border-t border-emerald-500/30 pt-2">
                  <span className="text-[11px] font-extrabold text-muted-foreground">الإجمالي</span>
                  <span className="font-display text-2xl font-extrabold tabular-nums text-foreground">
                    <AnimatedNumber value={finalPrice} suffix=" ج.م" />
                  </span>
                </div>
              </section>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 border-t border-border/60 bg-card/95 p-4">
              <button
                onClick={handleConfirm}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-display text-sm font-extrabold text-white shadow-pill transition active:scale-[0.98] ${
                  mode === "subscribe" ? "bg-emerald-600" : "bg-foreground"
                }`}
              >
                {mode === "subscribe" ? <Repeat className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                {mode === "subscribe"
                  ? <>ابدأ الاشتراك · <AnimatedNumber value={finalPrice} suffix=" ج.م" /></>
                  : <>{gift ? <>أرسل كهدية · <Mail className="h-4 w-4" /></> : "أضف للسلة"} · <AnimatedNumber value={finalPrice} suffix=" ج.م" /></>}
              </button>
            </div>

            {swapOpen && (
              <SmartSwapSheet
                open={!!swapOpen}
                originalId={swapOpen.originalId}
                currentId={swapOpen.currentId}
                qty={swapOpen.qty}
                onClose={() => setSwapOpen(null)}
                onSwap={(id) => applySwap(swapOpen.originalId, id)}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BasketSheet;
