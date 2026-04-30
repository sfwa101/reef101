import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney } from "@/lib/format";
import { Loader2, ArrowDownCircle, Banknote } from "lucide-react";

type W = { vendor_id: string; available_balance: number; pending_balance: number; lifetime_earned: number; lifetime_paid_out: number };
type Payout = { id: string; amount: number; method: string; reference: string | null; status: string; created_at: string };

export default function VendorWallet() {
  const [wallets, setWallets] = useState<W[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    Promise.all([
      sb.from("vendor_wallets").select("*"),
      sb.from("vendor_payouts").select("*").order("created_at", { ascending: false }).limit(50),
    ]).then(([w, p]) => {
      setWallets(w.data ?? []);
      setPayouts(p.data ?? []);
    });
  }, []);

  if (!wallets) return <div className="p-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const total = wallets.reduce((acc, w) => ({
    available: acc.available + Number(w.available_balance),
    pending: acc.pending + Number(w.pending_balance),
    earned: acc.earned + Number(w.lifetime_earned),
    paid: acc.paid + Number(w.lifetime_paid_out),
  }), { available: 0, pending: 0, earned: 0, paid: 0 });

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      <h1 className="font-display text-[22px]">محفظتي</h1>

      <IOSCard className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
        <p className="text-[12px] opacity-80">الرصيد المتاح للسحب</p>
        <p className="font-display text-[34px] num leading-tight">{fmtMoney(total.available)}</p>
        <div className="flex gap-4 mt-3 text-[12px] opacity-90">
          <span>معلّق: {fmtMoney(total.pending)}</span>
          <span>مدفوع: {fmtMoney(total.paid)}</span>
        </div>
      </IOSCard>

      <IOSCard>
        <p className="text-[12px] text-foreground-tertiary">إجمالي ما حصلته منذ البداية</p>
        <p className="font-display text-[20px] num">{fmtMoney(total.earned)}</p>
      </IOSCard>

      <div>
        <h2 className="font-display text-[16px] mb-2 mt-2 flex items-center gap-2">
          <ArrowDownCircle className="h-4 w-4" /> سجل التسويات
        </h2>
        {payouts.length === 0 ? (
          <IOSCard className="text-center text-foreground-tertiary text-[13px] py-8">لا توجد تسويات بعد.</IOSCard>
        ) : (
          <div className="space-y-2">
            {payouts.map(p => (
              <IOSCard key={p.id} className="!p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-success/15 text-success flex items-center justify-center"><Banknote className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px]">{fmtMoney(p.amount)}</p>
                    <p className="text-[11px] text-foreground-tertiary">{p.method} {p.reference ? `• ${p.reference}` : ""}</p>
                  </div>
                  <p className="text-[10px] text-foreground-tertiary">{new Date(p.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
              </IOSCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
