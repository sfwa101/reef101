import { Wallet as WalletIcon, Plus, ArrowDownRight, ArrowUpRight, Gift, CreditCard, Loader2 } from "lucide-react";
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

  const addFunds = async () => {
    if (!userId) { toast.error("سجّل الدخول أولاً"); return; }
    const amount = 100;
    const { error: txErr } = await supabase.from("wallet_transactions").insert({ user_id: userId, kind: "credit", label: "شحن المحفظة", amount, source: "manual" });
    if (txErr) { toast.error("تعذّر الشحن"); return; }
    const newBal = (balance?.balance ?? 0) + amount;
    await supabase.from("wallet_balances").upsert({ user_id: userId, balance: newBal, points: balance?.points ?? 0, coupons: balance?.coupons ?? 0, cashback: balance?.cashback ?? 0 });
    setBalance((b) => ({ balance: newBal, points: b?.points ?? 0, coupons: b?.coupons ?? 0, cashback: b?.cashback ?? 0 }));
    setTxs((prev) => [{ id: crypto.randomUUID(), kind: "credit", label: "شحن المحفظة", amount, created_at: new Date().toISOString() }, ...prev]);
    toast.success(`تم شحن ${fmtMoney(amount)}`);
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
            <button onClick={addFunds} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-xs font-bold text-foreground"><Plus className="h-3.5 w-3.5" /> شحن</button>
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
    </div>
  );
};
export default Wallet;
