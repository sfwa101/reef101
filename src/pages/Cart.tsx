import BackHeader from "@/components/BackHeader";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, Trash2, Tag, ShoppingBag, MessageCircle, Truck, Clock, MapPin, Banknote, Smartphone, CreditCard, Wallet as WalletIcon, Sparkles, Gift, X, Check, PiggyBank, Store, ChefHat, Utensils, CalendarDays, Cake, Pencil, Zap, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fmtMoney, toLatin } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { products as allProducts, type Product } from "@/lib/products";
import { fireConfetti, fireMiniConfetti } from "@/lib/confetti";
import { useLocation } from "@/context/LocationContext";
import { detectZoneFromAddress } from "@/lib/geoZones";
import CartUpgradeBanner from "@/components/baskets/CartUpgradeBanner";
import {
  vendorForProduct,
  vendorLabel,
  vendorBrandHue,
  type VendorKey,
} from "@/lib/restaurants";
import {
  computeSweetsRules,
  fulfillmentTypeFor,
  isSweetsProduct,
  bookingTimeSlots,
  formatBookingShort,
  DEPOSIT_THRESHOLD,
  buildBookingDays,
} from "@/lib/sweetsFulfillment";
import type { CartLineMeta } from "@/context/CartContext";

const WA_NUMBER = "201080068689";
const GIFT_BONUS = 200; // gift threshold = free-delivery + this
/** Mock WhatsApp endpoint for the home-producers desk that handles Type C */
const HOME_PRODUCERS_WA = "201080068690";

type Addr = {
  id: string; label: string; city: string; district: string | null;
  street: string | null; building: string | null; is_default: boolean;
};

const paymentOptions = [
  { id: "wallet", label: "المحفظة الذكية", icon: WalletIcon, sub: "خصم فوري من رصيدك" },
  { id: "cash", label: "كاش عند الاستلام", icon: Banknote, sub: "ادفع للمندوب" },
  { id: "vodafone-cash", label: "فودافون كاش", icon: Smartphone, sub: "تحويل فوري" },
  { id: "instapay", label: "إنستا باي", icon: CreditCard, sub: "تحويل بنكي" },
];

/* -------- Animated number counter -------- */
const NumberFlow = ({ value, className = "" }: { value: number; className?: string }) => {
  const mv = useMotionValue(value);
  const display = useTransform(mv, (v) => toLatin(Math.round(v)));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.35, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [value, mv]);
  return <motion.span className={`tabular-nums ${className}`}>{display}</motion.span>;
};

/* -------- Swipeable cart line -------- */
const CartLineItem = ({
  l, setQty, remove, updateMeta,
}: {
  l: { product: Product; qty: number; meta?: CartLineMeta };
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  updateMeta: (id: string, meta: CartLineMeta) => void;
}) => {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);
  const unitPrice = l.meta?.unitPrice ?? l.product.price;

  // Booking edit panel state — only relevant for Type C lines
  const isBooking = isSweetsProduct(l.product.source) &&
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
      {/* Delete swipe background */}
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
        <img src={l.product.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
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
          {/* Selected variant + addons */}
          {(l.meta?.variantId || l.meta?.addonIds?.length) && (
            <div className="mt-1 flex flex-wrap gap-1">
              {l.meta?.variantId && (() => {
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
                  <span key={id} className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[9px] font-extrabold text-foreground/80">
                    + {a.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-display text-base font-extrabold text-primary">
              <NumberFlow value={unitPrice * l.qty} /> <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
            </span>
            {/* Pill-shaped, refined qty stepper */}
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

       {/* Type C booking summary + edit panel */}
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
             {/* Compact pencil icon instead of a wide "تعديل" button */}
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
                 {/* Date row */}
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
                 {/* Slot row */}
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
                 {/* Ship mode */}
                 <p className="mb-1.5 text-[10px] font-extrabold text-foreground/80">طريقة الوصول</p>
                 <div className="mb-3 grid grid-cols-2 gap-1.5">
                   {([
                     { id: "split", label: "على دفعتين" },
                     { id: "wait", label: "كل الطلب معاً" },
                   ] as const).map((m) => {
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
                 {/* Payment plan */}
                 <p className="mb-1.5 text-[10px] font-extrabold text-foreground/80">
                   خطة الدفع
                   {depositRequired && (
                     <span className="ms-1 rounded-md bg-amber-500/20 px-1 py-0.5 text-[8.5px] text-amber-800 dark:text-amber-300">
                       عربون إجباري
                     </span>
                   )}
                 </p>
                 <div className="grid grid-cols-2 gap-1.5">
                   {([
                     { id: true, label: `عربون 50٪ · ${toLatin(Math.round(lineSubtotal * 0.5))} ج` },
                     { id: false, label: `كامل المبلغ · ${toLatin(lineSubtotal)} ج` },
                   ] as const).map((opt) => {
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

const Cart = () => {
  const { lines, total, count, setQty, remove, add, clear, updateMeta } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { zone, setFromAddress } = useLocation();
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; pct: number } | null>(null);
  const [tip, setTip] = useState(0);
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [addrId, setAddrId] = useState<string>("");
  const [guestNotes, setGuestNotes] = useState("");
  const [payment, setPayment] = useState<string>("wallet");
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showRecharge, setShowRecharge] = useState(false);
  const [secondaryPayment, setSecondaryPayment] = useState<string>("cash");
  const [saveChange, setSaveChange] = useState<boolean>(true);
  const [customerName, setCustomerName] = useState<string>("");

  useEffect(() => {
    if (!user) { setAddresses([]); setAddrId(""); setWalletBalance(0); return; }
    (async () => {
      const [{ data: addrData }, { data: balData }, { data: profileData }] = await Promise.all([
        supabase.from("addresses").select("id,label,city,district,street,building,is_default").eq("user_id", user.id).order("is_default", { ascending: false }),
        supabase.from("wallet_balances").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      const list = (addrData as Addr[]) ?? [];
      setAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      if (def) setAddrId(def.id);
      setWalletBalance(Number(balData?.balance ?? 0));
      setCustomerName(((profileData as { full_name?: string } | null)?.full_name ?? "").trim());
    })();
  }, [user]);

  // When the active address changes, sync the global zone
  useEffect(() => {
    const a = addresses.find((x) => x.id === addrId);
    if (a) setFromAddress(a.city, a.district);
  }, [addrId, addresses, setFromAddress]);

  // If the active zone disallows COD, drop "cash" selections silently
  useEffect(() => {
    if (!zone.codAllowed) {
      if (payment === "cash") setPayment("wallet");
      if (secondaryPayment === "cash") setSecondaryPayment("instapay");
    }
  }, [zone.codAllowed, payment, secondaryPayment]);

  const subtotal = total;
  const discount = appliedPromo ? Math.round(subtotal * appliedPromo.pct) : 0;
  const FREE_DELIVERY_THRESHOLD = zone.freeDeliveryThreshold ?? Infinity;
  const GIFT_THRESHOLD = isFinite(FREE_DELIVERY_THRESHOLD) ? FREE_DELIVERY_THRESHOLD + GIFT_BONUS : Infinity;
  const delivery = subtotal === 0
    ? 0
    : subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : zone.deliveryFee;
  const grand = Math.max(0, subtotal - discount + delivery + tip);

  /* ============ Sweets fulfillment segmentation ============
   * Walk every cart line and classify into:
   *   - bookingLines (Type C — pre-order from home producers)
   *   - sameDayFreshLines (Type B — Reef Kitchen same-day)
   *   - instantLines (Type A — ready stock)
   * Used to: render the "split shipment" notice, force COD off when any
   * Type C exists, and decide whether deposit is mandatory.
   */
  type BookingMeta = { date?: string; slot?: string; note?: string };
  type SweetsBucket = {
    type: "A" | "B" | "C";
    lines: { product: Product; qty: number; meta?: BookingMeta }[];
    subtotal: number;
  };
  const sweetsBuckets = useMemo(() => {
    const buckets: Record<"A" | "B" | "C", SweetsBucket> = {
      A: { type: "A", lines: [], subtotal: 0 },
      B: { type: "B", lines: [], subtotal: 0 },
      C: { type: "C", lines: [], subtotal: 0 },
    };
    for (const l of lines) {
      if (!isSweetsProduct(l.product.source)) continue;
      const t = fulfillmentTypeFor(l.product.id, l.product.subCategory);
      buckets[t].lines.push({
        product: l.product,
        qty: l.qty,
        meta: {
          date: l.meta?.bookingDate,
          slot: l.meta?.bookingSlot,
          note: l.meta?.bookingNote,
        },
      });
      buckets[t].subtotal += l.product.price * l.qty;
    }
    return buckets;
  }, [lines]);

  const sweetsRules = useMemo(
    () => computeSweetsRules(sweetsBuckets.C.subtotal, grand),
    [sweetsBuckets.C.subtotal, grand],
  );

  /* Per-line booking choices roll up into cart-level totals */
  const bookingLinesMeta = useMemo(() => {
    return lines
      .filter(
        (l) =>
          isSweetsProduct(l.product.source) &&
          fulfillmentTypeFor(l.product.id, l.product.subCategory) === "C",
      )
      .map((l) => {
        const unit = l.meta?.unitPrice ?? l.product.price;
        const sub = unit * l.qty;
        const lineRequired = sub >= DEPOSIT_THRESHOLD;
        const wantsDeposit = lineRequired || (l.meta?.payDeposit ?? true);
        return {
          id: l.product.id,
          subtotal: sub,
          payDeposit: wantsDeposit,
          shipMode: (l.meta?.shipMode ?? "split") as "split" | "wait",
        };
      });
  }, [lines]);

  /* Aggregated deposit charged now across ALL Type C lines */
  const aggregateDeposit = useMemo(
    () =>
      bookingLinesMeta.reduce(
        (s, b) => s + (b.payDeposit ? Math.round(b.subtotal * 0.5) : b.subtotal),
        0,
      ),
    [bookingLinesMeta],
  );
  const anyWaitForAll = bookingLinesMeta.some((b) => b.shipMode === "wait");
  const hasInstantSweets = sweetsBuckets.A.lines.length > 0;
  const hasFreshSweets = sweetsBuckets.B.lines.length > 0;
  const hasBooking = sweetsBuckets.C.lines.length > 0;
  const hasNonBookingItems =
    hasInstantSweets ||
    hasFreshSweets ||
    lines.some((l) => !isSweetsProduct(l.product.source));

  /* Whether ANY booking line opted into deposit (drives copy in summary) */
  const payDeposit = bookingLinesMeta.some((b) => b.payDeposit);

  /* Final amount the customer pays NOW vs. on delivery (line-level aware) */
  const payNowAmount = sweetsRules.hasBooking
    ? aggregateDeposit + Math.max(0, grand - sweetsRules.bookingSubtotal)
    : grand;
  const payOnDelivery = Math.max(0, grand - payNowAmount);

  /* Auto-disable COD when any Type C booking exists */
  useEffect(() => {
    if (sweetsRules.blockCOD && payment === "cash") {
      setPayment("wallet");
      toast.message("الدفع عند الاستلام غير متاح للحجوزات المسبقة 🍰", {
        description: "تم التحويل إلى المحفظة الذكية",
      });
    }
    if (sweetsRules.blockCOD && secondaryPayment === "cash") {
      setSecondaryPayment("instapay");
    }
  }, [sweetsRules.blockCOD, payment, secondaryPayment]);

  /* Savings on this bill: discount + (free delivery saved) */
  const billSavings = discount + (subtotal >= FREE_DELIVERY_THRESHOLD && subtotal > 0 ? zone.deliveryFee : 0);

  /* Split payment: wallet pays partial, remainder in secondary method */
  const isWalletPay = payment === "wallet";
  const walletShortfall = isWalletPay ? Math.max(0, grand - walletBalance) : 0;
  const walletApplied = isWalletPay ? Math.min(walletBalance, grand) : 0;
  const isSplit = isWalletPay && walletShortfall > 0 && walletBalance > 0;

  /* Smart change-jar: round-up suggestion when paying cash (whole or split-cash) */
  const cashAmount = !isWalletPay ? grand : (isSplit && secondaryPayment === "cash" ? walletShortfall : 0);
  const roundedCash = cashAmount > 0 ? Math.ceil(cashAmount / 10) * 10 : 0;
  const changeRemainder = roundedCash - cashAmount;
  const showChangeJar = changeRemainder > 0 && changeRemainder <= 10 && [3, 5, 10].some((r) => changeRemainder <= r) && cashAmount > 0;

  /* Smart progress bar */
  const progress = useMemo(() => {
    if (!isFinite(FREE_DELIVERY_THRESHOLD)) {
      return { pct: 0, label: `🚚 رسوم التوصيل ${toLatin(zone.deliveryFee)} ج.م لمنطقتك`, done: false };
    }
    if (subtotal >= GIFT_THRESHOLD) {
      return { pct: 100, label: "🎁 طلبك مؤهل لهدية مفاجئة + توصيل مجاني!", done: true };
    }
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      const remain = GIFT_THRESHOLD - subtotal;
      return {
        pct: Math.min(100, ((subtotal - FREE_DELIVERY_THRESHOLD) / (GIFT_THRESHOLD - FREE_DELIVERY_THRESHOLD)) * 50 + 50),
        label: `أضف ${toLatin(remain)} ج.م لتحصل على هدية مفاجئة 🎁`,
        done: false,
      };
    }
    const remain = FREE_DELIVERY_THRESHOLD - subtotal;
    return {
      pct: Math.min(50, (subtotal / FREE_DELIVERY_THRESHOLD) * 50),
      label: `أضف ${toLatin(remain)} ج.م لتحصل على توصيل مجاني 🚚`,
      done: false,
    };
  }, [subtotal, FREE_DELIVERY_THRESHOLD, GIFT_THRESHOLD, zone.deliveryFee]);

  /* Cross-sell: suggest complementary products */
  const crossSell = useMemo<Product[]>(() => {
    if (lines.length === 0) return [];
    const inCart = new Set(lines.map((l) => l.product.id));
    const cartSources = new Set(lines.map((l) => l.product.source));
    const cartCategories = new Set(lines.map((l) => l.product.category));
    // pick complementary: same source/category but different from cart, prefer best/trending and lower price
    const candidates = allProducts.filter((p) => !inCart.has(p.id) && (cartSources.has(p.source) || cartCategories.has(p.category)));
    const ranked = candidates
      .sort((a, b) => {
        const scoreA = (a.badge === "best" ? 3 : a.badge === "trending" ? 2 : 1) - a.price / 200;
        const scoreB = (b.badge === "best" ? 3 : b.badge === "trending" ? 2 : 1) - b.price / 200;
        return scoreB - scoreA;
      })
      .slice(0, 6);
    return ranked;
  }, [lines]);

  /* ============ Multi-vendor segmentation ============
   * Group cart lines by their originating vendor (restaurant / kitchen / store)
   * so we can render a separate visual block per vendor and route a separate
   * WhatsApp message to each vendor's management number on checkout.
   */
  type VendorGroup = {
    key: string;
    vendor: VendorKey;
    lines: { product: Product; qty: number }[];
    subtotal: number;
    cashback: number; // EGP credited to wallet if user pays with wallet
  };
  const vendorGroups = useMemo<VendorGroup[]>(() => {
    const map = new Map<string, VendorGroup>();
    for (const l of lines) {
      const v = vendorForProduct(l.product.id, l.product.source);
      const key =
        v.kind === "restaurant" ? `r:${v.restaurant.id}` : v.kind === "kitchen" ? "k" : "s";
      if (!map.has(key)) {
        map.set(key, { key, vendor: v, lines: [], subtotal: 0, cashback: 0 });
      }
      const g = map.get(key)!;
      g.lines.push(l);
      g.subtotal += l.product.price * l.qty;
    }
    // Cashback = restaurant cashback% applied on its sub-subtotal (only when paying via wallet)
    for (const g of map.values()) {
      if (g.vendor.kind === "restaurant") {
        g.cashback = Math.round((g.subtotal * g.vendor.restaurant.cashbackPct) / 100);
      }
    }
    // Stable order: restaurants first, then kitchen, then store
    return Array.from(map.values()).sort((a, b) => {
      const order = (v: VendorKey) => (v.kind === "restaurant" ? 0 : v.kind === "kitchen" ? 1 : 2);
      return order(a.vendor) - order(b.vendor);
    });
  }, [lines]);

  const isMultiVendor = vendorGroups.length > 1;
  const totalCashback = useMemo(
    () => (payment === "wallet" ? vendorGroups.reduce((s, g) => s + g.cashback, 0) : 0),
    [vendorGroups, payment],
  );

  /* ============ Fulfillment timing classification ============
   * Splits vendor groups into:
   *   - instantGroups   → arrives within ~1 hour (store + kitchen instant + sweets Type A)
   *   - scheduledGroups → arrives by appointment (sweets Type B fresh, Type C bookings)
   * Restaurants ride with "instant" (cooked-to-order, fast delivery).
   * Used for the elegant section headers shown in the cart.
   */
  const groupIsScheduled = (g: VendorGroup) => {
    // a vendor group is scheduled if EVERY line is sweets B/C (booking).
    return (
      g.lines.length > 0 &&
      g.lines.every((l) => {
        if (!isSweetsProduct(l.product.source)) return false;
        const t = fulfillmentTypeFor(l.product.id, l.product.subCategory);
        return t === "B" || t === "C";
      })
    );
  };
  const groupIsMixedScheduled = (g: VendorGroup) =>
    g.lines.some((l) => {
      if (!isSweetsProduct(l.product.source)) return false;
      const t = fulfillmentTypeFor(l.product.id, l.product.subCategory);
      return t === "B" || t === "C";
    });

  const instantGroups = vendorGroups.filter((g) => !groupIsScheduled(g));
  const scheduledGroups = vendorGroups.filter((g) => groupIsScheduled(g));
  const showFulfillmentSections =
    instantGroups.length > 0 && scheduledGroups.length > 0;

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    if (code === "REEF10") {
      setAppliedPromo({ code, pct: 0.1 });
      toast.success("تم تطبيق كود الخصم 🎉");
      fireMiniConfetti();
    } else if (code === "WELCOME25") {
      setAppliedPromo({ code, pct: 0.25 });
      toast.success("خصم 25٪ تم تفعيله! 🎉");
      fireConfetti();
    } else {
      setAppliedPromo(null);
      toast.error("كود غير صالح");
    }
  };

  const paymentLabel = paymentOptions.find((p) => p.id === payment)?.label ?? "";
  const secondaryLabel = paymentOptions.find((p) => p.id === secondaryPayment)?.label ?? "";
  const selectedAddr = addresses.find((a) => a.id === addrId);

  const checkoutWA = async () => {
    if (!user) {
      toast.error("سجّل الدخول أولًا لإتمام الطلب");
      navigate({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    try {
      const noteParts = [
        appliedPromo ? `كود: ${appliedPromo.code}` : null,
        tip > 0 ? `إكرامية: ${tip}` : null,
        !selectedAddr && guestNotes ? `العنوان: ${guestNotes}` : null,
        isSplit ? `دفع مُجزّأ: محفظة ${Math.round(walletApplied)} + ${secondaryLabel} ${Math.round(walletShortfall)}` : null,
        showChangeJar && saveChange ? `ادخار الفكة: ${changeRemainder} ج.م للحصّالة` : null,
        sweetsRules.hasBooking ? `حجوزات: ${fmtMoney(sweetsRules.bookingSubtotal)}` : null,
        sweetsRules.hasBooking ? `يُدفع الآن من الحجوزات: ${fmtMoney(aggregateDeposit)}` : null,
      ].filter(Boolean);

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total: grand,
          payment_method: payment,
          address_id: selectedAddr?.id ?? null,
          status: "pending",
          whatsapp_sent: true,
          notes: noteParts.length ? noteParts.join(" · ") : null,
        })
        .select("id")
        .single();

      if (error || !order) {
        console.error(error);
        toast.error("تعذّر حفظ الطلب، حاول مرة أخرى");
        setSubmitting(false);
        return;
      }

      const items = lines.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        product_name: l.product.name,
        product_image: l.product.image,
        price: l.product.price,
        quantity: l.qty,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) {
        console.error(itemsErr);
        toast.error("تعذّر حفظ تفاصيل الطلب، حاول مرة أخرى");
        setSubmitting(false);
        return;
      }

      const orderNum = `RF-${order.id.slice(0, 8).toUpperCase()}`;

      // Auto-save change to savings jar (only if cash + user opted-in)
      if (showChangeJar && saveChange && changeRemainder > 0) {
        try {
          const { data: jarRow } = await supabase
            .from("savings_jar")
            .select("balance,auto_save_enabled,round_to,goal,goal_label")
            .eq("user_id", user.id)
            .maybeSingle();
          const newBalance = Number(jarRow?.balance ?? 0) + changeRemainder;
          if (jarRow) {
            await supabase.from("savings_jar").update({ balance: newBalance }).eq("user_id", user.id);
          } else {
            await supabase.from("savings_jar").insert({ user_id: user.id, balance: newBalance });
          }
          await supabase.from("savings_transactions").insert({
            user_id: user.id,
            amount: changeRemainder,
            kind: "deposit",
            label: `ادخار فكة طلب ${orderNum}`,
          });
        } catch (e) {
          console.warn("savings jar update skipped", e);
        }
      }

      /* ============ Wallet cashback (only when paying via wallet) ============ */
      if (payment === "wallet" && totalCashback > 0) {
        try {
          const { data: bal } = await supabase
            .from("wallet_balances")
            .select("balance,cashback")
            .eq("user_id", user.id)
            .maybeSingle();
          const newBalance = Number(bal?.balance ?? 0) + totalCashback;
          const newCashback = Number(bal?.cashback ?? 0) + totalCashback;
          if (bal) {
            await supabase
              .from("wallet_balances")
              .update({ balance: newBalance, cashback: newCashback })
              .eq("user_id", user.id);
          } else {
            await supabase
              .from("wallet_balances")
              .insert({ user_id: user.id, balance: newBalance, cashback: newCashback });
          }
          await supabase.from("wallet_transactions").insert({
            user_id: user.id,
            kind: "credit",
            amount: totalCashback,
            label: `كاش باك المطاعم — طلب ${orderNum}`,
            source: "restaurants_cashback",
          });
        } catch (e) {
          console.warn("cashback credit skipped", e);
        }
      }

      const lineItems = lines
        .map((l, i) => {
          const unit = l.meta?.unitPrice ?? l.product.price;
          return `${toLatin(i + 1)}. ${l.product.name} × ${toLatin(l.qty)} = ${fmtMoney(unit * l.qty)}`;
        })
        .join("\n");
      const addrLine = selectedAddr
        ? `${[selectedAddr.label, selectedAddr.street, selectedAddr.building, selectedAddr.district, selectedAddr.city].filter(Boolean).join("، ")}`
        : guestNotes || "—";

      /* ============ Per-vendor WhatsApp routing ============
       * Open ONE main WhatsApp message to the platform (with the full bill),
       * then a separate message for each restaurant vendor with only their
       * items + the platform commission breakdown.
       */
      const mainMessage =
        `🌿 *طلب جديد — ريف المدينة*\n` +
        `━━━━━━━━━━━━━━\n` +
        `🆔 *رقم الطلب:* ${orderNum}\n` +
        `👤 *العميل:* ${user.email ?? "عميل"}\n\n` +
        (isMultiVendor
          ? `🧩 *موردون متعدّدون:* ${toLatin(vendorGroups.length)}\n` +
            vendorGroups.map((g) => `• ${vendorLabel(g.vendor)} — ${fmtMoney(g.subtotal)}`).join("\n") +
            `\n\n`
          : "") +
        `🛒 *المنتجات:*\n${lineItems}\n\n` +
        (sweetsRules.hasBooking
          ? `📅 *حجوزات الحلويات (${toLatin(sweetsBuckets.C.lines.length)}):*\n` +
            sweetsBuckets.C.lines
              .map((l) => {
                const slot = bookingTimeSlots.find((s) => s.id === l.meta?.slot)?.label ?? "—";
                const day = l.meta?.date ? formatBookingShort(new Date(l.meta.date)) : "—";
                return `• ${l.product.name} × ${toLatin(l.qty)} → ${day} · ${slot}`;
              })
              .join("\n") +
            `\n\n`
          : "") +
        `━━━━━━━━━━━━━━\n` +
        `💵 المجموع الفرعي: ${fmtMoney(subtotal)}\n` +
        (discount > 0 ? `🏷️ خصم (${appliedPromo?.code}): -${fmtMoney(discount)}\n` : "") +
        `🚚 التوصيل: ${delivery === 0 ? "مجاني" : fmtMoney(delivery)}\n` +
        (tip > 0 ? `💚 إكرامية: ${fmtMoney(tip)}\n` : "") +
        `\n*💰 الإجمالي:* *${fmtMoney(grand)}*\n\n` +
        (sweetsRules.hasBooking
          ? `🔒 *يُدفع الآن من الحجوزات:* ${fmtMoney(aggregateDeposit)}\n` +
            (payOnDelivery > 0
              ? `📦 *يُحصّل عند التوصيل:* ${fmtMoney(payOnDelivery)}\n\n`
              : "\n")
          : "") +
        (isSplit
          ? `💳 *طريقة الدفع:* مُجزّأ\n   • محفظة: ${fmtMoney(walletApplied)}\n   • ${secondaryLabel}: ${fmtMoney(walletShortfall)}\n`
          : `💳 *طريقة الدفع:* ${paymentLabel}\n`) +
        (payment === "wallet" && totalCashback > 0
          ? `🎁 *كاش باك المحفظة:* +${fmtMoney(totalCashback)} (تمت إضافته لرصيدك)\n`
          : "") +
        (showChangeJar && saveChange ? `🐷 *ادخار الفكة:* ${fmtMoney(changeRemainder)} للحصّالة\n` : "") +
        `📍 *العنوان:* ${addrLine}\n\n` +
        `✅ برجاء تأكيد الطلب`;

      const mainUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mainMessage)}`;
      window.open(mainUrl, "_blank");

      // Per-restaurant routing: each restaurant gets its own message with
      // only its lines + commission breakdown. Stagger window.open calls
      // to avoid popup blocking by browsers.
      const restaurantGroups = vendorGroups.filter(
        (g) => g.vendor.kind === "restaurant",
      );
      restaurantGroups.forEach((g, idx) => {
        if (g.vendor.kind !== "restaurant") return;
        const r = g.vendor.restaurant;
        const commission = Math.round((g.subtotal * r.commissionPct) / 100);
        const netToVendor = g.subtotal - commission;
        const vendorLines = g.lines
          .map((l, i) => {
            const unit = lines.find((x) => x.product.id === l.product.id)?.meta?.unitPrice ?? l.product.price;
            return `${toLatin(i + 1)}. ${l.product.name} × ${toLatin(l.qty)} = ${fmtMoney(unit * l.qty)}`;
          })
          .join("\n");
        const vendorMsg =
          `🍽️ *طلب جديد عبر ريف المدينة*\n` +
          `━━━━━━━━━━━━━━\n` +
          `🆔 *رقم الطلب:* ${orderNum}\n` +
          `🏷️ *المطعم:* ${r.name}\n\n` +
          `🛒 *الأصناف المطلوبة:*\n${vendorLines}\n\n` +
          `━━━━━━━━━━━━━━\n` +
          `💵 إجمالي المطعم: ${fmtMoney(g.subtotal)}\n` +
          `📊 عمولة المنصة (${toLatin(r.commissionPct)}٪): -${fmtMoney(commission)}\n` +
          `💰 *صافي المستحق للمطعم:* *${fmtMoney(netToVendor)}*\n\n` +
          `📍 *عنوان التوصيل:*\n${addrLine}\n\n` +
          `✅ برجاء البدء بالتجهيز`;
        const vUrl = `https://wa.me/${r.whatsapp}?text=${encodeURIComponent(vendorMsg)}`;
        // Stagger to bypass popup blocking
        setTimeout(() => window.open(vUrl, "_blank"), 600 * (idx + 1));
      });

      /* ============ Type C → Home producers WhatsApp routing ============ */
      if (sweetsBuckets.C.lines.length > 0) {
        const producerLines = sweetsBuckets.C.lines
          .map((l, i) => {
            const slot = bookingTimeSlots.find((s) => s.id === l.meta?.slot)?.label ?? "—";
            const day = l.meta?.date ? formatBookingShort(new Date(l.meta.date)) : "—";
            const note = l.meta?.note ? `\n   📝 ملاحظة: ${l.meta.note}` : "";
            const lineUnit = lines.find((x) => x.product.id === l.product.id)?.meta?.unitPrice ?? l.product.price;
            return `${toLatin(i + 1)}. ${l.product.name} × ${toLatin(l.qty)} = ${fmtMoney(lineUnit * l.qty)}\n   📅 ${day} · ${slot}${note}`;
          })
          .join("\n\n");
        const producerMsg =
          `🎂 *حجز جديد — الأسر المنتجة*\n` +
          `━━━━━━━━━━━━━━\n` +
          `🆔 *رقم الطلب:* ${orderNum}\n\n` +
          `🛒 *الحجوزات:*\n${producerLines}\n\n` +
          `━━━━━━━━━━━━━━\n` +
          `💵 إجمالي الحجز: ${fmtMoney(sweetsBuckets.C.subtotal)}\n` +
          `🔒 يُدفع الآن: ${fmtMoney(aggregateDeposit)}\n` +
          `\n📍 *عنوان التوصيل:*\n${addrLine}\n\n` +
          `✅ برجاء البدء بالتجهيز`;
        const pUrl = `https://wa.me/${HOME_PRODUCERS_WA}?text=${encodeURIComponent(producerMsg)}`;
        setTimeout(
          () => window.open(pUrl, "_blank"),
          600 * (restaurantGroups.length + 1),
        );
      }

      const orderId = order.id;
      const orderTotal = grand;
      clear();
      fireConfetti();
      toast.success("تم إرسال طلبك إلى واتساب 🎉");
      navigate({ to: "/order-success", search: { id: orderId, total: orderTotal } });
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ غير متوقّع");
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div>
        <BackHeader title="سلتي" subtitle="جاهز للطلب" />
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-primary-soft"><ShoppingBag className="h-10 w-10 text-primary" strokeWidth={2} /></div>
          <h2 className="font-display text-2xl font-extrabold">السلة فارغة</h2>
          <p className="text-sm text-muted-foreground">ابدأ التسوق من أقسامنا المختلفة</p>
          <Link to="/sections" className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pill">تصفّح الأقسام</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      <BackHeader title="سلتي" subtitle={`${toLatin(count)} منتج`} />

      {/* ============ Smart Progress Bar ============ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-accent/10 to-primary/5 p-3 ring-1 ring-primary/15"
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
            {progress.done ? <Gift className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
          </div>
          <p className="flex-1 text-[11px] font-extrabold text-foreground">{progress.label}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.pct}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </motion.div>

      {/* ============ Smart Basket Upgrade Suggestion ============ */}
      <CartUpgradeBanner />

      {/* ============ Multi-vendor Cart Lines ============ */}
      <div className="space-y-4">
        {isMultiVendor && (
          <div className="flex items-start gap-2 rounded-2xl bg-accent/10 p-2.5 ring-1 ring-accent/20">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
            <p className="text-[11px] font-bold text-foreground">
              طلبك يحتوي على <span className="text-accent-foreground">{toLatin(vendorGroups.length)} موردين</span> — كل قسم سيصل من مصدره الخاص.
            </p>
          </div>
        )}

        {/* Split-shipment notice for sweets bookings */}
        {hasBooking && hasNonBookingItems && !anyWaitForAll && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-violet-400/5 to-fuchsia-500/10 p-3 ring-1 ring-violet-500/25"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-violet-600 text-white">
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <p className="text-[12px] font-extrabold text-foreground">
                طلبك يصل على دفعتين 📦
              </p>
            </div>
            <ul className="space-y-1.5 text-[11px] font-bold text-foreground/85">
              {(hasInstantSweets || lines.some((l) => !isSweetsProduct(l.product.source))) && (
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>المنتجات الفورية تصلك خلال {zone.etaLabel}</span>
                </li>
              )}
              {hasFreshSweets && (
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>حلويات «يُحضّر طازجاً» تصلك خلال 4 ساعات</span>
                </li>
              )}
              {hasBooking && (
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />
                  <span>
                    حجوزات الأسر المنتجة في موعدها المحدّد
                    {sweetsBuckets.C.lines[0]?.meta?.date
                      ? ` (${formatBookingShort(new Date(sweetsBuckets.C.lines[0].meta.date!))})`
                      : ""}
                  </span>
                </li>
              )}
            </ul>
          </motion.div>
        )}

        {vendorGroups.map((g) => {
          const v = g.vendor;
          const hue = vendorBrandHue(v);
          const Icon = v.kind === "restaurant" ? Utensils : v.kind === "kitchen" ? ChefHat : Store;
          return (
            <div
              key={g.key}
              className="overflow-hidden rounded-2xl bg-card/60 ring-1 ring-border/40"
              style={{ borderTop: `3px solid hsl(${hue})` }}
            >
              {/* Vendor header */}
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
        })}
        <p className="px-1 text-center text-[10px] text-muted-foreground">
          💡 اسحب المنتج لليسار للحذف السريع
        </p>
      </div>

      {/* ============ Cross-sell ============ */}
      {crossSell.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="font-display text-sm font-extrabold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> غالباً ما يُشترى مع
            </h2>
            <span className="text-[10px] text-muted-foreground">إضافة سريعة</span>
          </div>
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex gap-2.5 pb-1">
              {crossSell.map((p) => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { add(p, 1); fireMiniConfetti(); toast.success(`تمت إضافة ${p.name}`); }}
                  className="relative flex w-[120px] shrink-0 flex-col rounded-2xl bg-card p-2 text-right shadow-[0_4px_14px_-8px_rgba(0,0,0,0.15)] ring-1 ring-border/30"
                >
                  <img src={p.image} alt="" className="mb-1.5 h-20 w-full rounded-xl object-cover" />
                  <p className="line-clamp-2 text-[11px] font-bold leading-tight">{p.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-display text-[12px] font-extrabold text-primary tabular-nums">{toLatin(p.price)} ج</span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-primary text-primary-foreground shadow-pill">
                      <Plus className="h-3 w-3" strokeWidth={3} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ Address (horizontal cards) ============ */}
      <section className="rounded-2xl bg-card p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
        <div className="mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><p className="text-sm font-bold">عنوان التوصيل</p></div>
        {user ? (
          addresses.length > 0 ? (
            <>
              <div className="-mx-4 overflow-x-auto px-4">
                <div className="flex gap-2 pb-1">
                  {addresses.map((a) => {
                    const active = a.id === addrId;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setAddrId(a.id)}
                        className={`flex w-[200px] shrink-0 flex-col items-start gap-1 rounded-2xl border-2 p-3 text-right transition ${active ? "border-primary bg-primary-soft" : "border-border bg-background"}`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm font-extrabold">{a.label}</p>
                          {active && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></div>}
                        </div>
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">{[a.street, a.building, a.district, a.city].filter(Boolean).join("، ")}</p>
                        {a.is_default && <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">افتراضي</span>}
                      </button>
                    );
                  })}
                  <Link to="/account/addresses" className="flex w-[120px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-background/50 p-3 text-[11px] font-bold text-primary">
                    <Plus className="h-5 w-5" /> عنوان جديد
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <Link to="/account/addresses" className="flex items-center justify-center rounded-2xl bg-foreground/5 py-3 text-xs font-bold text-primary">+ أضف عنوانًا للتوصيل</Link>
          )
        ) : (
          <textarea value={guestNotes} onChange={(e) => setGuestNotes(e.target.value)} placeholder="اكتب عنوان التوصيل…" rows={2} className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm outline-none" />
        )}
      </section>

      {/* ============ Payment ============ */}
      <section className="rounded-2xl bg-card p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold">طريقة الدفع</p>
          {!zone.codAllowed && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
              الدفع عند الاستلام غير متاح في {zone.shortName}
            </span>
          )}
        </div>

        {/* Sweets booking — payment rules notice */}
        {sweetsRules.hasBooking && (
          <div className="mb-3 flex items-start gap-2 rounded-2xl bg-violet-500/10 p-2.5 ring-1 ring-violet-500/25">
            <Cake className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <div className="flex-1 text-[11px] font-bold leading-relaxed text-foreground/90">
              يحتوي طلبك على حجز خاص — يُرجى الدفع مسبقاً (محفظة أو إلكتروني) لتأكيد الحجز.
            </div>
          </div>
        )}

        <div className="space-y-2">
          {paymentOptions
            .filter((m) => zone.codAllowed || m.id !== "cash")
            .filter((m) => !sweetsRules.blockCOD || m.id !== "cash")
            .map((m) => {
            const Icon = m.icon;
            const active = payment === m.id;
            const isWallet = m.id === "wallet";
            return (
              <motion.button
                whileTap={{ scale: 0.99 }}
                key={m.id}
                onClick={() => setPayment(m.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-right transition ${active ? "border-primary bg-primary-soft" : "border-border bg-background"}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${active ? "bg-primary text-primary-foreground" : "bg-foreground/5"}`}>
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">{m.label}</p>
                  {isWallet && user ? (
                    <p className="text-[10px] font-bold text-primary">
                      متاح: {toLatin(Math.round(walletBalance))} ج.م
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                  )}
                </div>
                <div className={`h-4 w-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
              </motion.button>
            );
          })}
        </div>

        {/* Booking deposit summary — derived from per-line choices.
            Each booking line lets the user pick deposit vs full payment
            (and split-vs-wait shipping) directly inside its cart card. */}
        {sweetsRules.hasBooking && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/8 to-fuchsia-500/8 p-3 ring-1 ring-violet-500/25"
          >
            <div className="mb-2 flex items-center gap-2">
              <Cake className="h-4 w-4 text-violet-600" />
              <p className="text-[12px] font-extrabold">ملخّص حجوزات الحلويات</p>
            </div>
            <div className="space-y-1 rounded-[12px] bg-card/70 p-2.5 ring-1 ring-violet-500/20">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-foreground/80">إجمالي الحجوزات</span>
                <span className="font-display font-extrabold tabular-nums">
                  {fmtMoney(sweetsRules.bookingSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-foreground/80">يُدفع الآن (عربون/كامل)</span>
                <span className="font-display font-extrabold text-violet-700 tabular-nums dark:text-violet-300">
                  {fmtMoney(aggregateDeposit)}
                </span>
              </div>
              {payOnDelivery > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground/80">يُحصّل عند التوصيل</span>
                  <span className="font-display font-extrabold tabular-nums">
                    {fmtMoney(payOnDelivery)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] pt-1">
                <span className="text-muted-foreground">طريقة التوصيل</span>
                <span className="font-extrabold text-foreground/85">
                  {anyWaitForAll ? "كل الطلب يصل معاً 📦" : "طلبك يصل على دفعتين 🚚 + 🎂"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              💡 يمكنك تعديل موعد كل حجز وخطة دفعه من زر «تعديل» على بطاقة المنتج بالأعلى.
            </p>
          </motion.div>
        )}

        {/* Split-payment helper when wallet < grand */}
        <AnimatePresence>
          {isSplit && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 p-3 ring-1 ring-accent/20"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-foreground">دفع الباقي عبر</p>
                <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-extrabold text-accent-foreground">
                  {toLatin(Math.round(walletShortfall))} ج.م متبقّية
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {paymentOptions
                  .filter((p) => p.id !== "wallet")
                  .filter((p) => zone.codAllowed || p.id !== "cash")
                  .filter((p) => !sweetsRules.blockCOD || p.id !== "cash")
                  .map((m) => {
                  const Icon = m.icon;
                  const a = secondaryPayment === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSecondaryPayment(m.id)}
                      className={`flex flex-col items-center gap-1 rounded-[12px] border-2 p-2 transition ${a ? "border-primary bg-primary-soft" : "border-border bg-background"}`}
                    >
                      <Icon className={`h-4 w-4 ${a ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2.4} />
                      <span className="text-[10px] font-bold leading-tight">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                <span>محفظة: <span className="text-primary">{fmtMoney(walletApplied)}</span></span>
                <button
                  type="button"
                  onClick={() => setShowRecharge(true)}
                  className="rounded-[8px] bg-accent/20 px-2 py-1 text-[10px] font-extrabold text-accent-foreground"
                >
                  شحن المحفظة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart change-jar (round-up cash) */}
        <AnimatePresence>
          {showChangeJar && (
            <motion.label
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 to-[hsl(45_70%_92%)] p-3 ring-1 ring-primary/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary to-[hsl(45_80%_55%)] text-white shadow-pill">
                <PiggyBank className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-extrabold">ادفع {toLatin(roundedCash)} ج.م رقم صحيح</p>
                <p className="text-[10px] text-muted-foreground">الفكة <span className="font-extrabold text-primary">{toLatin(changeRemainder)} ج.م</span> تدخل حصّالتك تلقائياً</p>
              </div>
              <input
                type="checkbox"
                checked={saveChange}
                onChange={(e) => setSaveChange(e.target.checked)}
                className="h-5 w-5 cursor-pointer accent-primary"
              />
            </motion.label>
          )}
        </AnimatePresence>
      </section>

      {/* ============ Promo code (premium inline) ============ */}
      <motion.div
        layout
        className={`overflow-hidden rounded-2xl bg-card shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 transition ${appliedPromo ? "ring-primary/40" : "ring-border/30"}`}
      >
        <div className="flex items-center gap-2 p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <Tag className="h-4 w-4" />
          </div>
          <input
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPromo()}
            placeholder="كود الخصم (REEF10، WELCOME25)"
            className="flex-1 bg-transparent text-sm font-bold outline-none"
          />
          <button
            onClick={applyPromo}
            className={`rounded-[10px] px-4 py-2 text-xs font-extrabold transition ${appliedPromo ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}
          >
            {appliedPromo ? <Check className="h-4 w-4" /> : "تطبيق"}
          </button>
        </div>
        <AnimatePresence>
          {appliedPromo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-primary/15 bg-primary/5 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-primary">🎉 وفّرت اليوم</p>
                <p className="font-display text-base font-extrabold text-primary">
                  <NumberFlow value={discount} /> ج.م
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ============ Tip ============ */}
      <div className="rounded-2xl bg-card p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold">إكرامية المندوب 💚</p>
          <span className="text-xs font-extrabold text-primary tabular-nums">{tip > 0 ? fmtMoney(tip) : "اختياري"}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 5, 10, 20].map((t) => {
            const active = tip === t;
            return (
              <motion.button
                whileTap={{ scale: 0.94 }}
                key={t}
                onClick={() => setTip(t)}
                className={`relative rounded-[12px] py-2.5 text-xs font-extrabold transition tabular-nums ${
                  active
                    ? "bg-gradient-to-br from-primary to-[hsl(150_55%_38%)] text-primary-foreground shadow-[0_6px_18px_-6px_hsl(150_60%_40%/0.55)]"
                    : "bg-foreground/5"
                }`}
              >
                {t === 0 ? "بدون" : `${toLatin(t)} ج`}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ============ ETA ============ */}
      <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft"><Clock className="h-4 w-4 text-primary" /></div>
        <div className="flex-1">
          <p className="text-xs font-bold">وقت التوصيل لمنطقتك ({zone.shortName})</p>
          <p className="text-[10px] text-muted-foreground">{zone.etaLabel}</p>
        </div>
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-extrabold text-muted-foreground">
          نطاق {zone.id}
        </span>
      </div>

      {/* ============ Summary ============ */}
      <section className="space-y-2 rounded-2xl bg-card p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">المجموع الفرعي</span><span className="font-bold tabular-nums">{fmtMoney(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">خصم ({appliedPromo?.code})</span><span className="font-bold tabular-nums text-primary">-{fmtMoney(discount)}</span></div>}
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">التوصيل</span><span className="font-bold tabular-nums">{delivery === 0 ? <span className="text-primary">مجاني 🚚</span> : fmtMoney(delivery)}</span></div>
        {billSavings > 0 && (
          <div className="flex items-center justify-between rounded-[10px] bg-primary/8 px-2 py-1.5 text-[12px]">
            <span className="flex items-center gap-1 font-extrabold text-primary">
              <Sparkles className="h-3 w-3" /> وفّرت في هذه الفاتورة
            </span>
            <span className="font-display font-extrabold tabular-nums text-primary">{fmtMoney(billSavings)}</span>
          </div>
        )}
        {tip > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">إكرامية</span><span className="font-bold tabular-nums">{fmtMoney(tip)}</span></div>}
        {isSplit && (
          <div className="rounded-[10px] bg-accent/10 p-2 text-[11px]">
            <div className="flex justify-between"><span className="text-muted-foreground">من المحفظة</span><span className="font-extrabold text-primary tabular-nums">{fmtMoney(walletApplied)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{secondaryLabel}</span><span className="font-extrabold tabular-nums">{fmtMoney(walletShortfall)}</span></div>
          </div>
        )}
        <div className="my-2 h-px bg-border" />
        <div className="flex items-baseline justify-between">
          <span className="font-display text-base font-bold">الإجمالي</span>
          <span className="font-display text-2xl font-extrabold text-primary">
            <NumberFlow value={grand} /> <span className="text-sm font-medium text-muted-foreground">ج.م</span>
          </span>
        </div>
      </section>

      <button onClick={() => clear()} className="w-full rounded-2xl bg-foreground/5 py-3 text-xs font-bold text-muted-foreground">تفريغ السلة</button>

      {/* ============ Sticky Bottom Bar ============ */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 240 }}
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <div className="mx-auto max-w-md rounded-[20px] bg-gradient-to-r from-[hsl(142_70%_38%)] via-[hsl(150_65%_42%)] to-[hsl(142_70%_38%)] p-0.5 shadow-[0_10px_30px_-10px_hsl(142_70%_42%/0.55)]">
          <button
            onClick={checkoutWA}
            disabled={submitting}
            className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-[hsl(142_70%_42%)] px-4 py-3.5 font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{submitting ? "جارٍ الإرسال…" : "إتمام عبر واتساب"}</span>
            </span>
            <span className="rounded-[12px] bg-white/15 px-3 py-1.5 text-sm font-extrabold backdrop-blur">
              {fmtMoney(grand)}
            </span>
          </button>
        </div>
      </motion.div>

      {/* ============ Inline Recharge Dialog ============ */}
      <AnimatePresence>
        {showRecharge && user && (
          <RechargeDialog
            onClose={() => setShowRecharge(false)}
            userId={user.id}
            currentBalance={walletBalance}
            shortfall={Math.max(0, grand - walletBalance)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ===================== Inline Recharge ===================== */
const rechargePresets = [200, 500, 1000, 2000];
const RechargeDialog = ({ onClose, userId, currentBalance, shortfall }: { onClose: () => void; userId: string; currentBalance: number; shortfall: number }) => {
  const suggested = Math.max(200, Math.ceil(shortfall / 100) * 100);
  const [amount, setAmount] = useState<number>(suggested);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState("instapay");
  const finalAmount = custom ? Number(custom.replace(/\D/g, "")) : amount;

  const submit = () => {
    if (!finalAmount || finalAmount < 50) { toast.error("الحد الأدنى 50 ج.م"); return; }
    const code = userId.slice(0, 8).toUpperCase();
    const text = `🌿 *ريف المدينة - شحن محفظة*\n\n• كود العميل: ${code}\n• المبلغ: ${finalAmount} ج.م\n• وسيلة الدفع: ${method}\n\nسأرسل إثبات الدفع الآن.`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
    fireConfetti();
    toast.success("تم إرسال طلب الشحن 🎉");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[24px] bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-[24px]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold">شحن المحفظة</h2>
            <p className="text-[11px] text-muted-foreground">رصيدك الحالي: {toLatin(Math.round(currentBalance))} ج.م</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-foreground/5"><X className="h-4 w-4" /></button>
        </div>

        {shortfall > 0 && (
          <div className="mb-4 rounded-2xl bg-accent/15 p-3 text-[11px] font-bold text-accent-foreground">
            تحتاج {toLatin(Math.round(shortfall))} ج.م إضافية لإتمام طلبك
          </div>
        )}

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">قيم سريعة (ج.م)</p>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {rechargePresets.map((p) => {
            const active = !custom && amount === p;
            return (
              <button key={p} onClick={() => { setAmount(p); setCustom(""); }} className={`rounded-[12px] py-2.5 text-xs font-extrabold transition ${active ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5"}`}>
                {toLatin(p)}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-[12px] bg-foreground/5 px-3 py-2.5">
          <input type="text" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} placeholder="مبلغ مخصص" className="flex-1 bg-transparent text-sm font-bold outline-none" dir="ltr" />
          <span className="text-xs font-bold text-muted-foreground">ج.م</span>
        </div>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">طريقة الدفع</p>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {[
            { id: "instapay", label: "إنستا باي" },
            { id: "vodafone-cash", label: "فودافون كاش" },
            { id: "bank", label: "تحويل بنكي" },
            { id: "cash", label: "كاش" },
          ].map((m) => {
            const active = method === m.id;
            return (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`rounded-[12px] border-2 py-2.5 text-xs font-extrabold transition ${active ? "border-primary bg-primary-soft text-primary" : "border-border bg-background"}`}>
                {m.label}
              </button>
            );
          })}
        </div>

        <button onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill active:scale-[0.98]">
          متابعة عبر واتساب · {fmtMoney(finalAmount || 0)}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Cart;
