import BackHeader from "@/components/BackHeader";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, Trash2, Tag, ShoppingBag, MessageCircle, Truck, Clock, MapPin, Banknote, Smartphone, CreditCard } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fmtMoney, toLatin } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const WA_NUMBER = "201080068689";

type Addr = {
  id: string; label: string; city: string; district: string | null;
  street: string | null; building: string | null; is_default: boolean;
};

const paymentOptions = [
  { id: "cash", label: "كاش عند الاستلام", icon: Banknote },
  { id: "vodafone-cash", label: "فودافون كاش", icon: Smartphone },
  { id: "instapay", label: "إنستا باي", icon: CreditCard },
];

const Cart = () => {
  const { lines, total, count, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; pct: number } | null>(null);
  const [tip, setTip] = useState(0);
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [addrId, setAddrId] = useState<string>("");
  const [guestNotes, setGuestNotes] = useState("");
  const [payment, setPayment] = useState<string>("cash");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { setAddresses([]); setAddrId(""); return; }
    (async () => {
      const { data } = await supabase
        .from("addresses")
        .select("id,label,city,district,street,building,is_default")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      const list = (data as Addr[]) ?? [];
      setAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      if (def) setAddrId(def.id);
    })();
  }, [user]);

  const subtotal = total;
  const discount = appliedPromo ? Math.round(subtotal * appliedPromo.pct) : 0;
  const delivery = subtotal === 0 ? 0 : subtotal >= 300 ? 0 : 25;
  const grand = Math.max(0, subtotal - discount + delivery + tip);

  const suggestions = useMemo(() => {
    const tips: string[] = [];
    if (subtotal > 0 && subtotal < 300) tips.push(`أضف منتجات بقيمة ${toLatin(300 - subtotal)} ج.م لتحصل على توصيل مجاني`);
    if (count >= 5 && !appliedPromo) tips.push("استخدم الكود REEF10 لتوفير 10٪");
    return tips;
  }, [subtotal, count, appliedPromo]);

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (code === "REEF10") { setAppliedPromo({ code, pct: 0.1 }); toast.success("تم تطبيق كود الخصم"); }
    else if (code === "WELCOME25") { setAppliedPromo({ code, pct: 0.25 }); toast.success("تم تطبيق كود الخصم"); }
    else { setAppliedPromo(null); toast.error("كود غير صالح"); }
  };

  const paymentLabel = paymentOptions.find((p) => p.id === payment)?.label ?? "";
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
      if (itemsErr) console.error(itemsErr);

      const lineItems = lines
        .map((l, i) => `${toLatin(i + 1)}. ${l.product.name} × ${toLatin(l.qty)} = ${fmtMoney(l.product.price * l.qty)}`)
        .join("%0A");
      const addrLine = selectedAddr
        ? `العنوان: ${[selectedAddr.label, selectedAddr.street, selectedAddr.district, selectedAddr.city].filter(Boolean).join("، ")}`
        : guestNotes
          ? `العنوان: ${guestNotes}`
          : "";
      const summary = `*طلب جديد — ريف المدينة*%0Aرقم الطلب: RF-${order.id.slice(0, 8).toUpperCase()}%0A%0A${lineItems}%0A%0Aالمجموع: ${fmtMoney(grand)}%0Aطريقة الدفع: ${paymentLabel}${addrLine ? `%0A${encodeURIComponent(addrLine)}` : ""}`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${summary}`, "_blank");

      const orderId = order.id;
      const orderTotal = grand;
      clear();
      toast.success("تم إرسال طلبك إلى واتساب");
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
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft"><ShoppingBag className="h-10 w-10 text-primary" strokeWidth={2} /></div>
          <h2 className="font-display text-2xl font-extrabold">السلة فارغة</h2>
          <p className="text-sm text-muted-foreground">ابدأ التسوق من أقسامنا المختلفة</p>
          <Link to="/sections" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pill">تصفّح الأقسام</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackHeader title="سلتي" subtitle={`${toLatin(count)} منتج`} />
      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div key={s} className="flex items-start gap-2 rounded-2xl bg-accent/15 p-3 text-xs font-bold text-accent-foreground">
              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {s}
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {lines.map((l) => (
          <div key={l.product.id} className="glass-strong flex gap-3 overflow-hidden rounded-2xl p-3 shadow-soft">
            <img src={l.product.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-bold leading-tight">{l.product.name}</h3>
                <button onClick={() => remove(l.product.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <p className="text-[10px] text-muted-foreground">{l.product.unit}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-display text-base font-extrabold text-primary tabular-nums">{fmtMoney(l.product.price * l.qty)}</span>
                <div className="flex items-center gap-1 rounded-full bg-foreground/5 p-0.5">
                  <button onClick={() => setQty(l.product.id, l.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-background"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center text-sm font-bold tabular-nums">{toLatin(l.qty)}</span>
                  <button onClick={() => setQty(l.product.id, l.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="glass-strong rounded-2xl p-4 shadow-soft">
        <div className="mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><p className="text-sm font-bold">عنوان التوصيل</p></div>
        {user ? (
          addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((a) => {
                const active = a.id === addrId;
                return (
                  <button key={a.id} onClick={() => setAddrId(a.id)} className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-right transition ${active ? "border-primary bg-primary-soft" : "border-border bg-background"}`}>
                    <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{a.label}{a.is_default && <span className="ms-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">افتراضي</span>}</p>
                      <p className="text-[11px] text-muted-foreground">{[a.street, a.building, a.district, a.city].filter(Boolean).join("، ")}</p>
                    </div>
                  </button>
                );
              })}
              <Link to="/account/addresses" className="block text-center text-[11px] font-bold text-primary">+ إضافة عنوان جديد</Link>
            </div>
          ) : (
            <Link to="/account/addresses" className="flex items-center justify-center rounded-2xl bg-foreground/5 py-3 text-xs font-bold text-primary">+ أضف عنوانًا للتوصيل</Link>
          )
        ) : (
          <textarea value={guestNotes} onChange={(e) => setGuestNotes(e.target.value)} placeholder="اكتب عنوان التوصيل…" rows={2} className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm outline-none" />
        )}
      </section>

      <section className="glass-strong rounded-2xl p-4 shadow-soft">
        <p className="mb-2 text-sm font-bold">طريقة الدفع</p>
        <div className="space-y-2">
          {paymentOptions.map((m) => {
            const Icon = m.icon;
            const active = payment === m.id;
            return (
              <button key={m.id} onClick={() => setPayment(m.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${active ? "border-primary bg-primary-soft" : "border-border bg-background"}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-foreground/5"}`}><Icon className="h-4 w-4" strokeWidth={2.4} /></div>
                <p className="flex-1 text-sm font-bold">{m.label}</p>
                <div className={`h-4 w-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
              </button>
            );
          })}
        </div>
      </section>

      <div className="glass-strong flex items-center gap-2 rounded-2xl p-2 shadow-soft">
        <Tag className="ms-2 h-4 w-4 text-primary" />
        <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="كود خصم (REEF10، WELCOME25)" className="flex-1 bg-transparent text-sm outline-none" />
        <button onClick={applyPromo} className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background">{appliedPromo ? "✓" : "تطبيق"}</button>
      </div>
      <div className="glass-strong rounded-2xl p-4 shadow-soft">
        <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold">إكرامية المندوب</p><span className="text-xs font-bold text-primary tabular-nums">{tip > 0 ? fmtMoney(tip) : "اختياري"}</span></div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 5, 10, 20].map((t) => (
            <button key={t} onClick={() => setTip(t)} className={`rounded-xl py-2 text-xs font-bold transition tabular-nums ${tip === t ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5"}`}>{t === 0 ? "بدون" : `${toLatin(t)} ج`}</button>
          ))}
        </div>
      </div>
      <div className="glass flex items-center gap-3 rounded-2xl p-3 shadow-soft">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft"><Clock className="h-4 w-4 text-primary" /></div>
        <div className="flex-1"><p className="text-xs font-bold">وقت التوصيل المتوقّع</p><p className="text-[10px] text-muted-foreground">خلال 60 - 90 دقيقة</p></div>
      </div>
      <section className="glass-strong space-y-2 rounded-2xl p-4 shadow-soft">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">المجموع الفرعي</span><span className="font-bold tabular-nums">{fmtMoney(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">خصم ({appliedPromo?.code})</span><span className="font-bold tabular-nums text-primary">-{fmtMoney(discount)}</span></div>}
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">التوصيل</span><span className="font-bold tabular-nums">{delivery === 0 ? "مجاني" : fmtMoney(delivery)}</span></div>
        {tip > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">إكرامية</span><span className="font-bold tabular-nums">{fmtMoney(tip)}</span></div>}
        <div className="my-2 h-px bg-border" />
        <div className="flex items-baseline justify-between"><span className="font-display text-base font-bold">الإجمالي</span><span className="font-display text-2xl font-extrabold text-primary tabular-nums">{fmtMoney(grand)}</span></div>
      </section>
      <button onClick={checkoutWA} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(142_70%_42%)] py-4 font-bold text-white shadow-float transition active:scale-[0.98] disabled:opacity-60">
        <MessageCircle className="h-5 w-5" /> {submitting ? "جارٍ الإرسال…" : "إتمام الشراء عبر واتساب"}
      </button>
      <button onClick={() => clear()} className="w-full rounded-2xl bg-foreground/5 py-3 text-xs font-bold text-muted-foreground">تفريغ السلة</button>
    </div>
  );
};
export default Cart;
