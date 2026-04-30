import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney } from "@/lib/format";
import { Package, ShoppingBag, Wallet, TrendingUp, Loader2 } from "lucide-react";

type Stats = {
  vendor_ids: string[];
  products_count: number;
  orders_30d: number;
  revenue_30d: number;
  wallet: { available: number; pending: number; lifetime_earned: number; lifetime_paid: number };
};

export default function VendorDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("vendor_portal_stats").then(({ data, error }: { data: Stats; error: { message: string } | null }) => {
      if (error) setErr(error.message);
      else setStats(data);
    });
  }, []);

  if (err) return <div className="p-6 text-center text-destructive text-[13px]">{err === "no_vendor_account" ? "لا يوجد حساب تاجر مرتبط بحسابك." : err}</div>;
  if (!stats) return <div className="p-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const tiles = [
    { label: "الرصيد المتاح", value: fmtMoney(stats.wallet.available), icon: Wallet, color: "from-success to-teal" },
    { label: "الرصيد المعلق", value: fmtMoney(stats.wallet.pending), icon: TrendingUp, color: "from-accent to-warning" },
    { label: "إيرادات 30 يوم", value: fmtMoney(stats.revenue_30d), icon: ShoppingBag, color: "from-primary to-primary-glow" },
    { label: "منتجاتي النشطة", value: String(stats.products_count), icon: Package, color: "from-info to-indigo" },
  ];

  return (
    <div className="px-4 pt-3 pb-6 space-y-4">
      <div>
        <h1 className="font-display text-[22px] mb-1">أهلاً بك 👋</h1>
        <p className="text-[13px] text-foreground-secondary">نظرة سريعة على نشاطك خلال آخر 30 يوم</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <IOSCard key={t.label} className="!p-3">
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white mb-2`}>
              <t.icon className="h-4 w-4" />
            </div>
            <p className="text-[11px] text-foreground-tertiary">{t.label}</p>
            <p className="font-display text-[18px] num">{t.value}</p>
          </IOSCard>
        ))}
      </div>

      <IOSCard className="bg-gradient-to-br from-primary/8 to-primary-glow/5">
        <p className="text-[12px] text-foreground-secondary mb-1">إجمالي ما حصلته</p>
        <p className="font-display text-[28px] num">{fmtMoney(stats.wallet.lifetime_earned)}</p>
        <p className="text-[11px] text-foreground-tertiary mt-1">صُرف لك حتى الآن: {fmtMoney(stats.wallet.lifetime_paid)}</p>
      </IOSCard>

      <IOSCard>
        <p className="text-[13px] text-foreground-secondary leading-relaxed">
          عند تسليم أي طلب لمنتجاتك، تدخل عمولتك في حالة "معلق" ثم تنتقل تلقائياً إلى "متاح" بعد 48 ساعة.
          الإدارة تُحوّل المبالغ المتاحة لحسابك دورياً.
        </p>
      </IOSCard>
    </div>
  );
}
