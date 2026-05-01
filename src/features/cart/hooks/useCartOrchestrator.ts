import { useEffect, useMemo, useRef, useState } from "react";
import { placeOrder } from "@/server/checkout.functions";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart, type CartLineMeta } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSharedCartSync } from "./useSharedCartSync";
import { useLocation } from "@/context/LocationContext";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, toLatin } from "@/lib/format";
import { fireConfetti, fireMiniConfetti } from "@/lib/confetti";
import { products as allProducts, type Product } from "@/lib/products";
import {
  vendorForProduct,
  type VendorKey,
} from "@/lib/restaurants";
import {
  computeSweetsRules,
  fulfillmentTypeFor,
  isSweetsProduct,
  bookingTimeSlots,
  formatBookingShort,
  DEPOSIT_THRESHOLD,
} from "@/lib/sweetsFulfillment";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  WA_NUMBER,
  GIFT_BONUS,
  type Addr,
  type AppliedPromo,
  type SweetsBucket,
  type VendorGroup,
} from "../types/cart.types";
import {
  preOpenWindow,
  openWhatsApp,
  isMobileWaContext,
  buildWaUrl,
  type OpenResult,
} from "@/lib/whatsapp";
import type { WaFallbackPayload } from "../components/WhatsAppFallbackDialog";

export const paymentOptions = [
  { id: "wallet", label: "المحفظة الذكية", icon: WalletIcon, sub: "خصم فوري من رصيدك" },
  { id: "cash", label: "كاش عند الاستلام", icon: Banknote, sub: "ادفع للمندوب" },
  { id: "vodafone-cash", label: "فودافون كاش", icon: Smartphone, sub: "تحويل فوري" },
  { id: "instapay", label: "إنستا باي", icon: CreditCard, sub: "تحويل بنكي" },
];

/**
 * Single source of truth for the Cart UI: state, derived totals, fulfillment
 * segmentation, multi-vendor grouping, cross-sell, and the WhatsApp
 * checkout pipeline. Pure refactor of the previous in-page logic — no
 * behavior changes.
 */
export const useCartOrchestrator = (opts?: { sharedCartId?: string | null }) => {
  const sharedCartId = opts?.sharedCartId ?? null;
  const local = useCart();
  const shared = useSharedCartSync(sharedCartId);
  const isSharedMode = !!sharedCartId;

  // Adapt shared items into local-shaped lines so all downstream derivations
  // (vendor groups, sweets buckets, totals, cross-sell) keep working unchanged.
  const sharedLines = useMemo(() => {
    if (!isSharedMode) return [] as { product: Product; qty: number; meta?: CartLineMeta }[];
    const out: { product: Product; qty: number; meta?: CartLineMeta }[] = [];
    for (const it of shared.items) {
      const product = allProducts.find((p) => p.id === it.product_id);
      if (!product) continue;
      out.push({ product, qty: it.quantity, meta: it.meta as CartLineMeta | undefined });
    }
    return out;
  }, [isSharedMode, shared.items]);

  const lines = isSharedMode ? sharedLines : local.lines;
  const count = isSharedMode ? sharedLines.reduce((s, l) => s + l.qty, 0) : local.count;
  const total = isSharedMode
    ? sharedLines.reduce((s, l) => s + l.product.price * l.qty, 0)
    : local.total;

  const setQty: typeof local.setQty = isSharedMode
    ? async (productId, qty) => {
        const it = shared.items.find((i) => i.product_id === productId);
        if (it) await shared.updateItemQty(it.id, qty);
      }
    : local.setQty;

  const remove: typeof local.remove = isSharedMode
    ? async (productId) => {
        const it = shared.items.find((i) => i.product_id === productId);
        if (it) await shared.removeItem(it.id);
      }
    : local.remove;

  const add: typeof local.add = isSharedMode
    ? async (product, qty = 1, meta) => {
        const existing = shared.items.find((i) => i.product_id === product.id);
        if (existing) await shared.updateItemQty(existing.id, existing.quantity + qty);
        else
          await shared.addItem({
            product_id: product.id,
            product_name: product.name,
            unit_price: product.price,
            quantity: qty,
            meta: (meta ?? {}) as Record<string, unknown>,
          });
      }
    : local.add;

  const clear: typeof local.clear = isSharedMode
    ? async () => {
        await Promise.all(shared.items.map((i) => shared.removeItem(i.id)));
      }
    : local.clear;

  const updateMeta: typeof local.updateMeta = isSharedMode
    ? () => {
        // Itemized meta updates in shared mode are deferred to a follow-up phase.
      }
    : local.updateMeta;

  const { user } = useAuth();
  const navigate = useNavigate();
  const { zone, setFromAddress } = useLocation();

  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo>(null);
  const [tip, setTip] = useState(0);
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [addrId, setAddrId] = useState<string>("");
  const [guestNotes, setGuestNotes] = useState("");
  const [payment, setPayment] = useState<string>("wallet");
  const [submitting, setSubmitting] = useState(false);
  // Double-submit guard — synchronous flag that beats React batching
  const submittingRef = useRef(false);
  // WhatsApp fallback dialog (shown when popup is blocked)
  const [waFallback, setWaFallback] = useState<WaFallbackPayload | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [trustLimit, setTrustLimit] = useState<number>(0);
  const [showRecharge, setShowRecharge] = useState(false);
  const [secondaryPayment, setSecondaryPayment] = useState<string>("cash");
  const [saveChange, setSaveChange] = useState<boolean>(true);
  const [donateChange, setDonateChange] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [minOrderTotal, setMinOrderTotal] = useState<number>(0);
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestAddress, setGuestAddress] = useState<string>("");

  // Finance settings (min order total)
  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("value")
        .eq("key", "finance")
        .maybeSingle();
      const raw = (data?.value as { min_order_total?: number | string } | null)?.min_order_total;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) setMinOrderTotal(n);
    })();
  }, []);

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setAddrId("");
      setWalletBalance(0);
      return;
    }
    (async () => {
      const [
        { data: addrData },
        { data: balData },
        { data: profileData },
        { data: trustData },
      ] = await Promise.all([
        supabase
          .from("addresses")
          .select("id,label,city,district,street,building,is_default")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false }),
        supabase.from("wallet_balances").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.rpc("user_trust_limit", { _user_id: user.id }),
      ]);
      const list = (addrData as Addr[]) ?? [];
      setAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      if (def) setAddrId(def.id);
      setWalletBalance(Number(balData?.balance ?? 0));
      setTrustLimit(Number(trustData ?? 0));
      setCustomerName(((profileData as { full_name?: string } | null)?.full_name ?? "").trim());
    })();
  }, [user]);

  useEffect(() => {
    const a = addresses.find((x) => x.id === addrId);
    if (a) setFromAddress(a.city, a.district);
  }, [addrId, addresses, setFromAddress]);

  useEffect(() => {
    if (!zone.codAllowed) {
      if (payment === "cash") setPayment("wallet");
      if (secondaryPayment === "cash") setSecondaryPayment("instapay");
    }
  }, [zone.codAllowed, payment, secondaryPayment]);

  const subtotal = total;
  const discount = appliedPromo ? Math.round(subtotal * appliedPromo.pct) : 0;
  const FREE_DELIVERY_THRESHOLD = zone.freeDeliveryThreshold ?? Infinity;
  const GIFT_THRESHOLD = isFinite(FREE_DELIVERY_THRESHOLD)
    ? FREE_DELIVERY_THRESHOLD + GIFT_BONUS
    : Infinity;
  const delivery =
    subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : zone.deliveryFee;
  const grand = Math.max(0, subtotal - discount + delivery + tip);

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

  const payDeposit = bookingLinesMeta.some((b) => b.payDeposit);

  const payNowAmount = sweetsRules.hasBooking
    ? aggregateDeposit + Math.max(0, grand - sweetsRules.bookingSubtotal)
    : grand;
  const payOnDelivery = Math.max(0, grand - payNowAmount);

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

  const billSavings =
    discount +
    (subtotal >= FREE_DELIVERY_THRESHOLD && subtotal > 0 ? zone.deliveryFee : 0);

  const isWalletPay = payment === "wallet";
  const effectiveWallet = walletBalance + trustLimit;
  const walletShortfall = isWalletPay ? Math.max(0, grand - effectiveWallet) : 0;
  const walletApplied = isWalletPay ? Math.min(effectiveWallet, grand) : 0;
  const trustUsed = isWalletPay ? Math.max(0, walletApplied - walletBalance) : 0;
  const isSplit = isWalletPay && walletShortfall > 0 && effectiveWallet > 0;

  const cashAmount = !isWalletPay
    ? grand
    : isSplit && secondaryPayment === "cash"
      ? walletShortfall
      : 0;
  const roundedCash = cashAmount > 0 ? Math.ceil(cashAmount / 10) * 10 : 0;
  const changeRemainder = roundedCash - cashAmount;
  const showChangeJar =
    changeRemainder > 0 &&
    changeRemainder <= 10 &&
    [3, 5, 10].some((r) => changeRemainder <= r) &&
    cashAmount > 0;

  const progress = useMemo(() => {
    if (!isFinite(FREE_DELIVERY_THRESHOLD)) {
      return {
        pct: 0,
        label: `🚚 رسوم التوصيل ${toLatin(zone.deliveryFee)} ج.م لمنطقتك`,
        done: false,
      };
    }
    if (subtotal >= GIFT_THRESHOLD) {
      return { pct: 100, label: "🎁 طلبك مؤهل لهدية مفاجئة + توصيل مجاني!", done: true };
    }
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      const remain = GIFT_THRESHOLD - subtotal;
      return {
        pct: Math.min(
          100,
          ((subtotal - FREE_DELIVERY_THRESHOLD) /
            (GIFT_THRESHOLD - FREE_DELIVERY_THRESHOLD)) *
            50 +
            50,
        ),
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

  const [coPurchaseIds, setCoPurchaseIds] = useState<string[]>([]);
  useEffect(() => {
    if (lines.length === 0) {
      setCoPurchaseIds([]);
      return;
    }
    const ids = lines.map((l) => l.product.id);
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc("frequently_bought_together", {
        _product_ids: ids,
        _limit: 6,
      });
      if (!cancelled && Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCoPurchaseIds((data as any[]).map((r) => r.product_id));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.map((l) => l.product.id).join(",")]);

  const crossSell = useMemo<Product[]>(() => {
    if (lines.length === 0) return [];
    const inCart = new Set(lines.map((l) => l.product.id));
    const cartSources = new Set(lines.map((l) => l.product.source));
    const cartCategories = new Set(lines.map((l) => l.product.category));
    const coReal = coPurchaseIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => !!p && !inCart.has(p.id));
    const heur = allProducts
      .filter(
        (p) =>
          !inCart.has(p.id) &&
          !coReal.find((c) => c.id === p.id) &&
          (cartSources.has(p.source) || cartCategories.has(p.category)),
      )
      .sort((a, b) => {
        const scoreA = (a.badge === "best" ? 3 : a.badge === "trending" ? 2 : 1) - a.price / 200;
        const scoreB = (b.badge === "best" ? 3 : b.badge === "trending" ? 2 : 1) - b.price / 200;
        return scoreB - scoreA;
      });
    return [...coReal, ...heur].slice(0, 6);
  }, [lines, coPurchaseIds]);

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
    for (const g of map.values()) {
      if (g.vendor.kind === "restaurant") {
        g.cashback = Math.round((g.subtotal * g.vendor.restaurant.cashbackPct) / 100);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const order = (v: VendorKey) =>
        v.kind === "restaurant" ? 0 : v.kind === "kitchen" ? 1 : 2;
      return order(a.vendor) - order(b.vendor);
    });
  }, [lines]);

  const isMultiVendor = vendorGroups.length > 1;
  const totalCashback = useMemo(
    () => (payment === "wallet" ? vendorGroups.reduce((s, g) => s + g.cashback, 0) : 0),
    [vendorGroups, payment],
  );

  const groupIsScheduled = (g: VendorGroup) =>
    g.lines.length > 0 &&
    g.lines.every((l) => {
      if (!isSweetsProduct(l.product.source)) return false;
      const t = fulfillmentTypeFor(l.product.id, l.product.subCategory);
      return t === "B" || t === "C";
    });
  const groupIsMixedScheduled = (g: VendorGroup) =>
    g.lines.some((l) => {
      if (!isSweetsProduct(l.product.source)) return false;
      const t = fulfillmentTypeFor(l.product.id, l.product.subCategory);
      return t === "B" || t === "C";
    });

  const instantGroups = vendorGroups.filter((g) => !groupIsScheduled(g));
  const scheduledGroups = vendorGroups.filter((g) => groupIsScheduled(g));
  const showFulfillmentSections = instantGroups.length > 0 && scheduledGroups.length > 0;

  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    if (code === "REEF10") {
      setAppliedPromo({ code, pct: 0.1 });
      toast.success("تم تطبيق كود الخصم 🎉");
      fireMiniConfetti();
      return;
    }
    if (code === "WELCOME25") {
      setAppliedPromo({ code, pct: 0.25 });
      toast.success("خصم 25٪ تم تفعيله! 🎉");
      fireConfetti();
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("validate_coupon", {
        _code: code,
        _order_total: subtotal,
      });
      if (error) throw error;
      const disc = Number(data?.discount ?? 0);
      if (disc <= 0) throw new Error("invalid");
      const pct = subtotal > 0 ? disc / subtotal : 0;
      setAppliedPromo({ code, pct });
      toast.success(`تم تطبيق ${code} — خصم ${Math.round(disc)} ج 🎉`);
      fireMiniConfetti();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setAppliedPromo(null);
      const msg = String(e?.message ?? "");
      if (msg.includes("level_too_low")) toast.error("هذا الكود حصري لمستويات أعلى");
      else if (msg.includes("expired")) toast.error("الكود منتهي");
      else if (msg.includes("exhausted")) toast.error("نفد رصيد الكود");
      else if (msg.includes("per_user_limit")) toast.error("تم استخدام الكود من قبل");
      else if (msg.includes("below_minimum")) toast.error("الطلب أقل من الحد الأدنى");
      else toast.error("كود غير صالح");
    }
  };

  const paymentLabel = paymentOptions.find((p) => p.id === payment)?.label ?? "";
  const secondaryLabel = paymentOptions.find((p) => p.id === secondaryPayment)?.label ?? "";
  const selectedAddr = addresses.find((a) => a.id === addrId);

  const checkoutWA = async () => {
    // Double-submit protection — runs synchronously, beats setState batching
    if (submittingRef.current) {
      console.warn("[checkout] duplicate submit blocked");
      return;
    }

    const source = "CartCheckoutActions:onCheckout→useCartOrchestrator.checkoutWA";
    const onMobile = isMobileWaContext();
    const preOpened: Window | null = onMobile ? null : preOpenWindow(source);
    console.info("[checkout] WhatsApp checkout invoked", {
      source,
      mode: onMobile ? "mobile-location" : "desktop-preopen",
      preOpened: !!preOpened,
      cartLines: lines.length,
    });
    submittingRef.current = true;
    setSubmitting(true);
    const minLoading = new Promise<void>((r) => setTimeout(r, 1000));
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = (user ?? session?.user) || null;
      const isGuest = !currentUser;

      if (isGuest) {
        const n = guestName.trim();
        const p = guestPhone.trim();
        const a = guestAddress.trim();
        if (!n || !p || !a) {
          toast.error("من فضلك اكتب الاسم ورقم الهاتف وعنوان التوصيل");
          setSubmitting(false);
          submittingRef.current = false;
          try { preOpened?.close(); } catch { /* noop */ }
          return;
        }
      }

      if (minOrderTotal > 0 && grand < minOrderTotal) {
        toast.error(`الحد الأدنى للطلب هو ${toLatin(minOrderTotal)} ج.م`);
        setSubmitting(false);
        submittingRef.current = false;
        try { preOpened?.close(); } catch { /* noop */ }
        return;
      }

      const noteParts = [
        appliedPromo ? `كود: ${appliedPromo.code}` : null,
        tip > 0 ? `إكرامية: ${tip}` : null,
        !selectedAddr && guestNotes ? `العنوان: ${guestNotes}` : null,
        isSplit
          ? `دفع مُجزّأ: محفظة ${Math.round(walletApplied)} + ${secondaryLabel} ${Math.round(walletShortfall)}`
          : null,
        showChangeJar && saveChange && !donateChange
          ? `ادخار الفكة: ${changeRemainder} ج.م للحصّالة`
          : null,
        showChangeJar && donateChange
          ? `تبرع بالفكة: ${changeRemainder} ج.م للصندوق العام`
          : null,
        sweetsRules.hasBooking ? `حجوزات: ${fmtMoney(sweetsRules.bookingSubtotal)}` : null,
        sweetsRules.hasBooking
          ? `يُدفع الآن من الحجوزات: ${fmtMoney(aggregateDeposit)}`
          : null,
      ].filter(Boolean);

      const orderNum = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      let savedOrderId: string | null = null;

      if (!isGuest && currentUser) {
        const result = await placeOrder({
          data: {
            total: grand,
            payment_method: payment,
            address_id: selectedAddr?.id ?? null,
            notes: noteParts.length ? noteParts.join(" · ") : null,
            service_type: "delivery",
            delivery_zone: zone.id ?? null,
            items: lines.map((l) => ({
              product_id: l.product.id,
              product_name: l.product.name,
              product_image: l.product.image ?? null,
              price: l.meta?.unitPrice ?? l.product.price,
              quantity: l.qty,
            })),
          },
        });

        if (!result.ok) {
          console.error("[checkout] placeOrder failed:", result);
          toast.error(result.error);
          setSubmitting(false);
          submittingRef.current = false;
          try { preOpened?.close(); } catch { /* noop */ }
          return;
        }
        savedOrderId = result.order_id;

        // Best-effort multi-warehouse allocation (non-blocking)
        try {
          const { error: allocErr } = await supabase.rpc(
            "allocate_order_inventory",
            { _order_id: savedOrderId, _zone: zone.id },
          );
          if (allocErr) console.warn("[allocation] failed", allocErr);
        } catch (e) {
          console.warn("[allocation] exception", e);
        }
      }

      if (!isGuest && currentUser && isWalletPay && walletApplied > 0) {
        try {
          const { data: bal } = await supabase
            .from("wallet_balances")
            .select("balance")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          const newBalance = Number(bal?.balance ?? 0) - walletApplied;
          await supabase
            .from("wallet_balances")
            .update({ balance: newBalance })
            .eq("user_id", currentUser.id);
          await supabase.from("wallet_transactions").insert({
            user_id: currentUser.id,
            kind: "debit",
            amount: walletApplied,
            label:
              trustUsed > 0
                ? `طلب ${orderNum} (شامل ${Math.round(trustUsed)} ج رصيد ثقة)`
                : `طلب ${orderNum}`,
            source: trustUsed > 0 ? "wallet_bnpl" : "wallet_pay",
          });
        } catch (e) {
          console.warn("wallet debit skipped", e);
        }
      }

      if (
        !isGuest &&
        currentUser &&
        showChangeJar &&
        saveChange &&
        !donateChange &&
        changeRemainder > 0
      ) {
        try {
          const { data: jarRow } = await supabase
            .from("savings_jar")
            .select("balance,auto_save_enabled,round_to,goal,goal_label")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          const newBalance = Number(jarRow?.balance ?? 0) + changeRemainder;
          if (jarRow) {
            await supabase
              .from("savings_jar")
              .update({ balance: newBalance })
              .eq("user_id", currentUser.id);
          } else {
            await supabase
              .from("savings_jar")
              .insert({ user_id: currentUser.id, balance: newBalance });
          }
          await supabase.from("savings_transactions").insert({
            user_id: currentUser.id,
            amount: changeRemainder,
            kind: "deposit",
            label: `ادخار فكة طلب ${orderNum}`,
          });
        } catch (e) {
          console.warn("savings jar update skipped", e);
        }
      }

      // Phase 8 — route spare change to General Charity Pool when toggled.
      if (
        !isGuest &&
        currentUser &&
        showChangeJar &&
        donateChange &&
        changeRemainder > 0
      ) {
        try {
          await supabase.rpc("donate_to_campaign", {
            _campaign_id: null as unknown as string,
            _amount: changeRemainder,
            _source: "spare_change",
          });
        } catch (e) {
          console.warn("charity spare-change donation skipped", e);
        }
      }

      if (!isGuest && currentUser && payment === "wallet" && totalCashback > 0) {
        try {
          const { data: bal } = await supabase
            .from("wallet_balances")
            .select("balance,cashback")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          const newBalance = Number(bal?.balance ?? 0) + totalCashback;
          const newCashback = Number(bal?.cashback ?? 0) + totalCashback;
          if (bal) {
            await supabase
              .from("wallet_balances")
              .update({ balance: newBalance, cashback: newCashback })
              .eq("user_id", currentUser.id);
          } else {
            await supabase
              .from("wallet_balances")
              .insert({
                user_id: currentUser.id,
                balance: newBalance,
                cashback: newCashback,
              });
          }
          await supabase.from("wallet_transactions").insert({
            user_id: currentUser.id,
            kind: "credit",
            amount: totalCashback,
            label: `كاش باك المطاعم — طلب ${orderNum}`,
            source: "restaurants_cashback",
          });
        } catch (e) {
          console.warn("cashback credit skipped", e);
        }
      }

      const isBookingLine = (lid: string, src: string, sub?: string) =>
        isSweetsProduct(src) && fulfillmentTypeFor(lid, sub) === "C";
      const instantItems = lines.filter(
        (l) => !isBookingLine(l.product.id, l.product.source, l.product.subCategory),
      );
      const bookingItems = lines.filter((l) =>
        isBookingLine(l.product.id, l.product.source, l.product.subCategory),
      );
      const fmtInstantLine = (l: (typeof lines)[number]) => {
        const unit = l.meta?.unitPrice ?? l.product.price;
        return `▪️ ${toLatin(l.qty)}x ${l.product.name} (${fmtMoney(unit * l.qty)})`;
      };
      const fmtBookingLine = (l: (typeof lines)[number]) => {
        const unit = l.meta?.unitPrice ?? l.product.price;
        const day = l.meta?.bookingDate
          ? formatBookingShort(new Date(l.meta.bookingDate))
          : "—";
        return `▪️ ${toLatin(l.qty)}x ${l.product.name} — استلام ${day} (${fmtMoney(unit * l.qty)})`;
      };
      const addrLine = isGuest
        ? guestAddress.trim()
        : selectedAddr
          ? `${[selectedAddr.label, selectedAddr.street, selectedAddr.building, selectedAddr.district, selectedAddr.city]
              .filter(Boolean)
              .join("، ")}`
          : guestNotes || "—";
      const etaLine =
        bookingItems.length > 0 && instantItems.length === 0
          ? "مجدول"
          : `خلال ${zone.etaLabel}`;
      const customerLabel = isGuest
        ? guestName.trim()
        : customerName || (currentUser?.email ?? "عميل").split("@")[0];
      const payShort =
        payment === "wallet"
          ? "محفظة"
          : payment === "cash"
            ? "كاش"
            : payment === "instapay"
              ? "انستاباي"
              : payment === "vodafone-cash"
                ? "فودافون كاش"
                : paymentLabel;

      const guestHeader = isGuest
        ? `👤 *الاسم:* ${guestName.trim()}\n📞 *الهاتف:* ${guestPhone.trim()}\n📍 *العنوان:* ${guestAddress.trim()}\n\n`
        : "";
      const mainMessage =
        `مرحباً ريف المدينة 👋\n\n` +
        (isGuest
          ? `طلب جديد (ضيف):\n\n${guestHeader}`
          : `أنا ${customerLabel}، وأريد تأكيد طلبي الجديد.\n\n`) +
        `📝 *رقم الطلب:* #${orderNum}\n` +
        (isGuest ? "" : `📍 *العنوان:* ${addrLine}\n`) +
        `🛵 *وقت التوصيل المتوقع:* ${etaLine}\n\n` +
        (instantItems.length > 0
          ? `🛒 *تفاصيل الطلب:*\n${instantItems.map(fmtInstantLine).join("\n")}\n\n`
          : "") +
        (bookingItems.length > 0
          ? `📅 *حجوزات خاصة:*\n${bookingItems.map(fmtBookingLine).join("\n")}\n\n`
          : "") +
        `💳 *طريقة الدفع:* ${
          isSplit
            ? `محفظة (${fmtMoney(walletApplied)}) + ${secondaryLabel} (${fmtMoney(walletShortfall)})`
            : payShort
        }\n\n` +
        `📊 *ملخص الحساب:*\n` +
        `الإجمالي الفرعي: ${toLatin(subtotal)} ج.م\n` +
        `التوصيل: ${delivery === 0 ? "مجاني" : `${toLatin(delivery)} ج.م`}\n` +
        (billSavings > 0 ? `وفرت معنا: 🟢 ${toLatin(billSavings)} ج.م\n` : "") +
        (tip > 0 ? `إكرامية المندوب: ${toLatin(tip)} ج.م\n` : "") +
        (sweetsRules.hasBooking
          ? `\n🔒 يُدفع الآن من الحجوزات: ${toLatin(aggregateDeposit)} ج.م\n` +
            (payOnDelivery > 0
              ? `📦 يُحصّل عند التوصيل: ${toLatin(payOnDelivery)} ج.م\n`
              : "")
          : "") +
        `\n------------------------\n\n` +
        `💰 *الإجمالي النهائي المطلوب:* *${toLatin(grand)} ج.م*\n\n` +
        (payment === "wallet" && totalCashback > 0
          ? `🎁 كاش باك المحفظة: +${toLatin(totalCashback)} ج.م (سيُضاف لرصيدك)\n\n`
          : "") +
        `في انتظار تأكيدكم، شكراً لكم! 🍃`;

      await minLoading;

      // Open the main customer→admin WhatsApp message.
      // - Desktop: redirect the pre-opened tab (gesture-safe).
      // - Mobile: navigate the current tab via location.href.
      // - If everything fails (popup blocked, no JS handler), surface a
      //   fallback dialog with copy-to-clipboard + a manual link.
      const mainPhone = WA_NUMBER;
      const orderId = savedOrderId ?? orderNum;
      const orderTotal = grand;
      const waUrl = buildWaUrl({ phone: mainPhone, text: mainMessage });
      console.log("[checkout] attempting WhatsApp checkout URL", { source, url: waUrl });
      const openResult: OpenResult = onMobile
        ? ((): OpenResult => {
            try {
              console.log("[checkout] mobile window.location.href", { source, url: waUrl });
              window.location.href = waUrl;
              return { ok: true, method: "location" };
            } catch (e) {
              console.warn("[checkout] mobile location.href failed", { source, error: e });
              return { ok: false, url: waUrl, text: mainMessage, reason: "location_failed" };
            }
          })()
        : openWhatsApp(
            { phone: mainPhone, text: mainMessage },
            { preOpened, preferLocation: false, source },
          );

      if (!openResult.ok) {
        console.warn("[checkout] WhatsApp open blocked, success fallback armed", {
          source,
          reason: openResult.reason,
          preOpened: !!preOpened,
          onMobile,
        });
        try {
          sessionStorage.setItem(
            "reef:checkout:wa-fallback",
            JSON.stringify({ phone: mainPhone, text: mainMessage, orderId, total: orderTotal }),
          );
        } catch (e) {
          console.warn("[checkout] failed to persist WhatsApp fallback", e);
        }
        setWaFallback({ phone: mainPhone, text: mainMessage, orderId, total: orderTotal });
        toast.message("اضغط على فتح واتساب لإكمال الطلب", {
          description: "منع المتصفح الفتح التلقائي",
        });
      } else {
        console.info("[checkout] WhatsApp opened", { source, method: openResult.method });
        try {
          sessionStorage.removeItem("reef:checkout:wa-fallback");
        } catch {
          /* noop */
        }
      }

      // NOTE: Multiple sequential `window.open` calls (vendors, producers)
      // cannot survive popup blockers and were previously silently dropped
      // on most browsers. Vendor + producer notifications are already sent
      // through the database (vendor_notifications / admin notifications
      // via `place_order_atomic`), so there is no functional regression.
      // We log the intended messages for debugging only.
      const restaurantGroups = vendorGroups.filter((g) => g.vendor.kind === "restaurant");
      if (restaurantGroups.length > 0) {
        console.info(
          "[checkout] vendor messages prepared (delivered via DB notifications):",
          restaurantGroups.map((g) =>
            g.vendor.kind === "restaurant" ? g.vendor.restaurant.name : "?",
          ),
        );
      }
      if (sweetsBuckets.C.lines.length > 0) {
        console.info("[checkout] producer booking present (DB-routed)");
      }

      clear();
      fireConfetti();
      if (openResult.ok) {
        toast.success("تم إرسال طلبك إلى واتساب 🎉");
        navigate({ to: "/order-success", search: { id: orderId, total: orderTotal } });
      }
      setSubmitting(false);
      submittingRef.current = false;
    } catch (err) {
      console.error("[checkout] unexpected error:", err);
      toast.error("حدث خطأ غير متوقّع");
      setSubmitting(false);
      submittingRef.current = false;
      try { preOpened?.close(); } catch { /* noop */ }
    }
  };

  /** Called by the Cart page when the WhatsApp fallback dialog closes. */
  const dismissWaFallback = () => {
    setWaFallback(null);
  };

  return {
    // cart context passthrough
    lines,
    count,
    setQty,
    remove,
    add,
    clear,
    updateMeta,
    user,
    zone,
    // address state
    addresses,
    addrId,
    setAddrId,
    selectedAddr,
    guestNotes,
    setGuestNotes,
    // guest fields
    guestName,
    setGuestName,
    guestPhone,
    setGuestPhone,
    guestAddress,
    setGuestAddress,
    customerName,
    // promo / tip
    promo,
    setPromo,
    appliedPromo,
    applyPromo,
    tip,
    setTip,
    // payments
    payment,
    setPayment,
    secondaryPayment,
    setSecondaryPayment,
    paymentLabel,
    secondaryLabel,
    walletBalance,
    trustLimit,
    walletApplied,
    walletShortfall,
    trustUsed,
    isWalletPay,
    isSplit,
    showRecharge,
    setShowRecharge,
    saveChange,
    setSaveChange,
    donateChange,
    setDonateChange,
    showChangeJar,
    roundedCash,
    changeRemainder,
    // totals
    subtotal,
    discount,
    delivery,
    grand,
    tipAmount: tip,
    billSavings,
    minOrderTotal,
    progress,
    FREE_DELIVERY_THRESHOLD,
    // sweets / fulfillment
    sweetsBuckets,
    sweetsRules,
    aggregateDeposit,
    payOnDelivery,
    payDeposit,
    anyWaitForAll,
    hasBooking,
    hasNonBookingItems,
    hasInstantSweets,
    hasFreshSweets,
    // vendor segmentation
    vendorGroups,
    instantGroups,
    scheduledGroups,
    showFulfillmentSections,
    isMultiVendor,
    totalCashback,
    groupIsMixedScheduled,
    // cross-sell
    crossSell,
    // checkout
    submitting,
    checkoutWA,
    // WhatsApp fallback dialog
    waFallback,
    dismissWaFallback,
    // shared cart (Phase 6)
    isSharedMode,
    sharedCartId,
    sharedCart: shared.cart,
    sharedParticipants: shared.participants,
    sharedItems: shared.items,
    sharedIsOwner: shared.isOwner,
    sharedMyParticipant: shared.myParticipant,
    sharedRequestApprovals: shared.requestApprovals,
    sharedReopenForEdits: shared.reopenForEdits,
    sharedApprove: shared.approve,
    sharedReject: shared.reject,
    sharedCancel: shared.cancelCart,
    sharedMarkCompleted: shared.markCompleted,
  };
};

export type CartOrchestrator = ReturnType<typeof useCartOrchestrator>;
