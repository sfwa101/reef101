import BackHeader from "@/components/BackHeader";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, Trash2, Tag, ShoppingBag, MessageCircle, Truck, Clock, MapPin, Banknote, Smartphone, CreditCard, Wallet as WalletIcon, Sparkles, Gift, X, Check } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { fmtMoney, toLatin } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { products as allProducts, type Product } from "@/lib/products";
import { fireConfetti, fireMiniConfetti } from "@/lib/confetti";

const WA_NUMBER = "201080068689";
const FREE_DELIVERY_THRESHOLD = 300;
const GIFT_THRESHOLD = 500;

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
  l, setQty, remove,
}: {
  l: { product: Product; qty: number };
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
}) => {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);

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
        className="relative flex gap-3 rounded-2xl bg-card p-3 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.12)] ring-1 ring-border/30"
      >
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
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-display text-base font-extrabold text-primary">
              <NumberFlow value={l.product.price * l.qty} /> <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
            </span>
            <div className="flex items-center gap-1 rounded-[12px] bg-foreground/5 p-0.5">
              <button
                onClick={() => setQty(l.product.id, l.qty - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-background shadow-sm transition active:scale-90"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-7 text-center text-sm font-extrabold">
                <NumberFlow value={l.qty} />
              </span>
              <button
                onClick={() => setQty(l.product.id, l.qty + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm transition active:scale-90"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Cart = () => {
  const { lines, total, count, setQty, remove, add, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!user) { setAddresses([]); setAddrId(""); setWalletBalance(0); return; }
    (async () => {
      const [{ data: addrData }, { data: balData }] = await Promise.all([
        supabase.from("addresses").select("id,label,city,district,street,building,is_default").eq("user_id", user.id).order("is_default", { ascending: false }),
        supabase.from("wallet_balances").select("balance").eq("user_id", user.id).maybeSingle(),
      ]);
      const list = (addrData as Addr[]) ?? [];
      setAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      if (def) setAddrId(def.id);
      setWalletBalance(Number(balData?.balance ?? 0));
    })();
  }, [user]);

  const subtotal = total;
  const discount = appliedPromo ? Math.round(subtotal * appliedPromo.pct) : 0;
  const delivery = subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 25;
  const grand = Math.max(0, subtotal - discount + delivery + tip);

  /* Smart progress bar */
  const progress = useMemo(() => {
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
  }, [subtotal]);

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
  const selectedAddr = addresses.find((a) => a.id === addrId);
  const walletInsufficient = payment === "wallet" && walletBalance < grand;

  const checkoutWA = async () => {
    if (!user) {
      toast.error("سجّل الدخول أولًا لإتمام الطلب");
      navigate({ to: "/auth" });
      return;
    }
    if (walletInsufficient) {
      toast.error("رصيد المحفظة غير كافٍ، اشحن أو اختر طريقة دفع أخرى");
      setShowRecharge(true);
      return;
    }
    setSubmitting(true);
    try {
      const noteParts = [
        appliedPromo ? `كود: ${appliedPromo.code}` : null,
        tip > 0 ? `إكرامية: ${tip}` : null,
        !selectedAddr && guestNotes ? `العنوان: ${guestNotes}` : null,
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
      const lineItems = lines
        .map((l, i) => `${toLatin(i + 1)}. ${l.product.name} × ${toLatin(l.qty)} = ${fmtMoney(l.product.price * l.qty)}`)
        .join("\n");
      const addrLine = selectedAddr
        ? `${[selectedAddr.label, selectedAddr.street, selectedAddr.building, selectedAddr.district, selectedAddr.city].filter(Boolean).join("، ")}`
        : guestNotes || "—";

      const message =
        `🌿 *طلب جديد — ريف المدينة*\n` +
        `━━━━━━━━━━━━━━\n` +
        `🆔 *رقم الطلب:* ${orderNum}\n` +
        `👤 *العميل:* ${user.email ?? "عميل"}\n\n` +
        `🛒 *المنتجات:*\n${lineItems}\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `💵 المجموع الفرعي: ${fmtMoney(subtotal)}\n` +
        (discount > 0 ? `🏷️ خصم (${appliedPromo?.code}): -${fmtMoney(discount)}\n` : "") +
        `🚚 التوصيل: ${delivery === 0 ? "مجاني" : fmtMoney(delivery)}\n` +
        (tip > 0 ? `💚 إكرامية: ${fmtMoney(tip)}\n` : "") +
        `\n*💰 الإجمالي:* *${fmtMoney(grand)}*\n\n` +
        `💳 *طريقة الدفع:* ${paymentLabel}\n` +
        `📍 *العنوان:* ${addrLine}\n\n` +
        `✅ برجاء تأكيد الطلب`;

      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");

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

      {/* ============ Cart Lines (swipe) ============ */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.div
              key={l.product.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
            >
              <CartLineItem l={l} setQty={setQty} remove={remove} />
            </motion.div>
          ))}
        </AnimatePresence>
        <p className="px-1 text-center text-[10px] text-muted-foreground">💡 اسحب المنتج لليسار للحذف السريع</p>
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
        <p className="mb-2 text-sm font-bold">طريقة الدفع</p>
        <div className="space-y-2">
          {paymentOptions.map((m) => {
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
                      {walletInsufficient && active && <span className="ms-1 text-destructive"> · غير كافٍ</span>}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                  )}
                </div>
                {isWallet && walletInsufficient && active && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowRecharge(true); }}
                    className="rounded-[10px] bg-accent px-2.5 py-1.5 text-[10px] font-extrabold text-accent-foreground shadow-pill"
                  >
                    شحن الآن
                  </button>
                )}
                <div className={`h-4 w-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
              </motion.button>
            );
          })}
        </div>
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
        <div className="flex-1"><p className="text-xs font-bold">وقت التوصيل المتوقّع</p><p className="text-[10px] text-muted-foreground">خلال 60 - 90 دقيقة</p></div>
      </div>

      {/* ============ Summary ============ */}
      <section className="space-y-2 rounded-2xl bg-card p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">المجموع الفرعي</span><span className="font-bold tabular-nums">{fmtMoney(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">خصم ({appliedPromo?.code})</span><span className="font-bold tabular-nums text-primary">-{fmtMoney(discount)}</span></div>}
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">التوصيل</span><span className="font-bold tabular-nums">{delivery === 0 ? <span className="text-primary">مجاني 🚚</span> : fmtMoney(delivery)}</span></div>
        {tip > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">إكرامية</span><span className="font-bold tabular-nums">{fmtMoney(tip)}</span></div>}
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
