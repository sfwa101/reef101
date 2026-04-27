import { Wallet as WalletIcon, Plus, ArrowDownRight, ArrowUpRight, Gift, CreditCard, Loader2, X, Banknote, Smartphone, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toLatin, fmtMoney } from "@/lib/format";
import { toast } from "sonner";

type WalletBalance = { balance: number; points: number; coupons: number; cashback: number };
type Tx = { id: string; label: string; amount: number; kind: string; created_at: string };

const iconFor = (kind: string) => (kind === "credit" ? ArrowDownRight : kind === "reward" ? Gift : ArrowUpRight);
const isPositive = (kind: string) => kind === "credit" || kind === "reward";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 36e5;
  if (diffH < 24) return `اليوم · ${toLatin(d.getHours().toString().padStart(2, "0"))}:${toLatin(d.getMinutes().toString().padStart(2, "0"))}`;
  if (diffH < 48) return "أمس";
  return toLatin(d.toLocaleDateString("en-GB"));
};

const Wallet = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showTopup, setShowTopup] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      if (!mounted) return;
      setUserId(user.id);
      const [{ data: bal }, { data: tx }] = await Promise.all([
        supabase.from("wallet_balances").select("balance,points,coupons,cashback").eq("user_id", user.id).maybeSingle(),
        supabase.from("wallet_transactions").select("id,label,amount,kind,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (!mounted) return;
      setBalance(bal ?? { balance: 0, points: 0, coupons: 0, cashback: 0 });
      setTxs((tx ?? []) as Tx[]);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const openTopup = () => {
    if (!userId) { toast.error("سجّل الدخول أولاً"); return; }
    setShowTopup(true);
  };

  if (loading) {
    return <div className="flex h-60 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-extrabold">المحفظة</h1>
        <p className="mt-1 text-xs text-muted-foreground">رصيد، عمليات، ومكافآت</p>
      </section>
      <section className="relative overflow-hidden rounded-[1.75rem] p-6 shadow-tile" style={{ background: "linear-gradient(135deg, hsl(150 40% 22%), hsl(140 30% 35%) 60%, hsl(45 70% 55%))" }}>
        <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-white" />
              <span className="text-xs font-bold text-white/85">الرصيد المتاح</span>
            </div>
            <CreditCard className="h-5 w-5 text-white/70" />
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold text-white">{toLatin(Math.round(balance?.balance ?? 0))} <span className="text-base font-medium text-white/70">ج.م</span></p>
          <p className="mt-1 text-[11px] text-white/80">يمكنك الشحن أو التحويل في أي وقت</p>
          <div className="mt-5 flex gap-2">
            <button onClick={openTopup} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-xs font-bold text-foreground"><Plus className="h-3.5 w-3.5" /> شحن</button>
            <button onClick={() => toast.info("التحويل قريباً")} className="flex-1 rounded-full bg-white/15 py-2.5 text-xs font-bold text-white backdrop-blur">تحويل</button>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "نقاط ريف", value: toLatin(balance?.points ?? 0) },
          { label: "كوبوناتي", value: toLatin(balance?.coupons ?? 0) },
          { label: "كاش باك", value: `${toLatin(Math.round(balance?.cashback ?? 0))} ج` },
        ].map((p) => (
          <div key={p.label} className="glass-strong rounded-2xl p-3 text-center shadow-soft">
            <p className="font-display text-xl font-extrabold text-primary">{p.value}</p>
            <p className="text-[10px] text-muted-foreground">{p.label}</p>
          </div>
        ))}
      </section>
      <section>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="font-display text-xl font-extrabold">آخر العمليات</h2>
          <button className="text-xs font-bold text-primary">عرض الكل</button>
        </div>
        {txs.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-soft">لا توجد عمليات بعد</div>
        ) : (
          <div className="glass-strong divide-y divide-border rounded-2xl shadow-soft">
            {txs.map((t) => {
              const Icon = iconFor(t.kind);
              const pos = isPositive(t.kind);
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${pos ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(t.created_at)}</p>
                  </div>
                  <span className={`font-display font-extrabold ${pos ? "text-primary" : "text-destructive"}`}>{pos ? "+" : "-"}{toLatin(Math.round(Math.abs(t.amount)))} ج.م</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {showTopup && <TopupDialog onClose={() => setShowTopup(false)} phone="201000000000" />}
    </div>
  );
};
export default Wallet;

type PaymentMethod = { id: string; label: string; icon: any; sub: string };
const paymentMethods: PaymentMethod[] = [
  { id: "vodafone-cash", label: "فودافون كاش", icon: Smartphone, sub: "تحويل فوري" },
  { id: "instapay", label: "إنستا باي", icon: Banknote, sub: "تحويل بنكي فوري" },
  { id: "bank", label: "تحويل بنكي", icon: Building2, sub: "حساب البنك" },
  { id: "cash", label: "كاش عند المندوب", icon: Banknote, sub: "تحصيل مباشر" },
];

const presets = [50, 100, 200, 500, 1000];

const TopupDialog = ({ onClose, phone }: { onClose: () => void; phone: string }) => {
  const [amount, setAmount] = useState<number>(100);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<string>(paymentMethods[0].id);

  const finalAmount = custom ? Number(custom.replace(/\D/g, "")) : amount;

  const submit = () => {
    if (!finalAmount || finalAmount < 10) {
      toast.error("الحد الأدنى للشحن 10 ج.م");
      return;
    }
    const m = paymentMethods.find((p) => p.id === method)!;
    const text = `مرحبًا، أرغب في شحن محفظتي بمبلغ ${finalAmount} ج.م عبر ${m.label}.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold">شحن المحفظة</h2>
            <p className="text-[11px] text-muted-foreground">اختر القيمة وطريقة الدفع</p>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3">
          <p className="mb-2 text-[11px] font-bold text-muted-foreground">قيم سريعة (ج.م)</p>
          <div className="grid grid-cols-5 gap-2">
            {presets.map((p) => {
              const active = !custom && amount === p;
              return (
                <button
                  key={p}
                  onClick={() => { setAmount(p); setCustom(""); }}
                  className={`rounded-2xl py-2 text-xs font-bold transition ${active ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5 text-foreground"}`}
                >
                  {toLatin(p)}
                </button>
              );
            })}
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">مبلغ مخصص</span>
          <div className="flex items-center gap-2 rounded-2xl bg-foreground/5 px-3 py-2.5">
            <input
              type="text"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
              placeholder="مثال: 250"
              className="flex-1 bg-transparent text-sm font-bold tabular-nums outline-none"
              dir="ltr"
            />
            <span className="text-xs font-bold text-muted-foreground">ج.م</span>
          </div>
        </label>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">طريقة الدفع</p>
        <div className="mb-5 space-y-2">
          {paymentMethods.map((m) => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${active ? "border-primary bg-primary-soft" : "border-border bg-background"}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-foreground"}`}>
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
              </button>
            );
          })}
        </div>

        <button
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-extrabold text-primary-foreground shadow-pill"
        >
          متابعة عبر واتساب · {fmtMoney(finalAmount || 0)}
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">سيتم تحويلك للواتساب لإتمام الدفع وإضافة الرصيد لمحفظتك</p>
      </div>
    </div>
  );
};
