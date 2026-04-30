import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, Banknote } from "lucide-react";

type Stats = { driver: { full_name: string; driver_type: string }; today_tasks: number; today_delivered: number;
  wallet: { cash_in_hand: number; earned_balance: number; lifetime_earned: number; lifetime_settled: number } };

export default function DriverWallet() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => { (async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc("driver_portal_stats");
    setS(data as Stats);
  })(); }, []);

  if (!s) return <p className="text-center text-foreground-tertiary py-8">جارٍ التحميل…</p>;

  return (
    <div className="space-y-3">
      <Card><CardContent className="p-4">
        <p className="text-[13px] text-foreground-tertiary mb-1">المندوب</p>
        <p className="font-display text-[18px]">{s.driver.full_name}</p>
        <p className="text-[12px] text-foreground-tertiary">{s.driver.driver_type}</p>
      </CardContent></Card>

      <div className="grid grid-cols-2 gap-2">
        <Card><CardContent className="p-4">
          <Banknote className="h-5 w-5 text-amber-600 mb-1" />
          <p className="text-[11px] text-foreground-tertiary">كاش بحوزتي</p>
          <p className="font-display text-[20px] num">{s.wallet.cash_in_hand} ج.م</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Wallet className="h-5 w-5 text-emerald-600 mb-1" />
          <p className="text-[11px] text-foreground-tertiary">عمولات مستحقة</p>
          <p className="font-display text-[20px] num">{s.wallet.earned_balance} ج.م</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <TrendingUp className="h-5 w-5 text-primary mb-1" />
          <p className="text-[11px] text-foreground-tertiary">إجمالي المكتسب</p>
          <p className="font-display text-[18px] num">{s.wallet.lifetime_earned} ج.م</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-[11px] text-foreground-tertiary">إجمالي المسلّم</p>
          <p className="font-display text-[18px] num">{s.wallet.lifetime_settled} ج.م</p>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <p className="text-[13px] text-foreground-tertiary mb-2">اليوم</p>
        <div className="flex justify-between">
          <span>إجمالي الطلبات: <b className="num">{s.today_tasks}</b></span>
          <span>المسلّمة: <b className="num text-emerald-600">{s.today_delivered}</b></span>
        </div>
      </CardContent></Card>

      <p className="text-[12px] text-foreground-tertiary text-center pt-2">
        لتسليم الكاش/استلام العمولة، توجه للمحاسب.
      </p>
    </div>
  );
}
