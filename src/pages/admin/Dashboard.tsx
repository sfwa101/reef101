import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { StatTile } from "@/components/ios/StatTile";
import { IOSList, IOSRow, IOSSection } from "@/components/ios/IOSCard";
import { ShoppingBag, Wallet, Users, Receipt, Truck, ChevronLeft, Sparkles, TrendingUp, Package } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { fmtMoney, fmtNum } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء النور";
};

const statusMap: Record<string, { label: string; tone: string }> = {
  pending: { label: "بانتظار", tone: "bg-muted text-foreground-secondary" },
  confirmed: { label: "مؤكد", tone: "bg-info/15 text-info" },
  preparing: { label: "تجهيز", tone: "bg-warning/15 text-warning" },
  out_for_delivery: { label: "في الطريق", tone: "bg-primary/15 text-primary" },
  delivered: { label: "تم", tone: "bg-success/15 text-success" },
  paid: { label: "مدفوع", tone: "bg-success/15 text-success" },
};

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, totalCustomers: 0, inDelivery: 0, avgOrder: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [chart, setChart] = useState<{ day: number; revenue: number }[]>([]);

  useEffect(() => {
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const start14 = new Date(); start14.setDate(start14.getDate() - 13); start14.setHours(0, 0, 0, 0);

    Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("orders").select("id,total,status,created_at").gte("created_at", start14.toISOString()),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("orders").select("id,total,status,created_at,user_id").order("created_at", { ascending: false }).limit(8),
    ]).then(([ordersRes, profilesRes, recentRes]: any[]) => {
      const orders = ordersRes.data ?? [];
      const today = orders.filter((o: any) => new Date(o.created_at) >= startToday);
      const inDelivery = orders.filter((o: any) => ["out_for_delivery", "preparing", "ready"].includes(o.status)).length;
      const todayRev = today.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);

      // 14-day chart
      const buckets = new Map<string, number>();
      for (let i = 0; i < 14; i++) {
        const d = new Date(start14); d.setDate(d.getDate() + i);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      orders.forEach((o: any) => {
        const k = o.created_at.slice(0, 10);
        buckets.set(k, (buckets.get(k) ?? 0) + Number(o.total ?? 0));
      });
      setChart([...buckets.values()].map((revenue, i) => ({ day: i + 1, revenue: Math.round(revenue) })));

      setStats({
        todayOrders: today.length,
        todayRevenue: todayRev,
        totalCustomers: profilesRes.count ?? 0,
        inDelivery,
        avgOrder: today.length ? todayRev / today.length : 0,
      });
      setRecent(recentRes.data ?? []);
    });
  }, []);

  return (
    <>
      <MobileTopbar title={greeting()} />
      <div className="hidden lg:flex items-end justify-between px-6 pt-8 pb-2 max-w-[1400px] mx-auto">
        <div>
          <p className="text-sm text-foreground-secondary">{greeting()}, {profile?.full_name ?? "أهلاً"}</p>
          <h1 className="font-display text-[34px] tracking-tight mt-0.5">اللوحة الرئيسية</h1>
        </div>
        <div className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />متصل بالبيانات الحية
        </div>
      </div>

      <div className="px-4 lg:px-6 pt-3 pb-6 max-w-[1400px] mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-elegant relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30 mix-blend-overlay" />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13px] opacity-90">إيرادات اليوم</p>
              <Sparkles className="h-4 w-4 opacity-80" />
            </div>
            <p className="font-display text-[40px] tracking-tight num leading-none mb-1">{fmtMoney(stats.todayRevenue)}</p>
            <div className="flex items-center gap-1.5 text-[12px] opacity-90">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>آخر 14 يوم</span>
            </div>
            <div className="h-16 mt-3 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="hero-rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="white" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="white" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke="white" strokeWidth={2} fill="url(#hero-rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="طلبات اليوم" value={fmtNum(stats.todayOrders)} icon={ShoppingBag} tone="primary" />
          <StatTile label="إجمالي العملاء" value={fmtNum(stats.totalCustomers)} icon={Users} tone="info" />
          <StatTile label="متوسط الطلب" value={fmtMoney(stats.avgOrder)} icon={Receipt} tone="accent" />
          <StatTile label="قيد التوصيل" value={fmtNum(stats.inDelivery)} icon={Truck} tone="purple" />
        </div>

        <IOSSection title="إجراءات سريعة" action={<Link to="/admin/more" className="text-sm text-primary press">المزيد</Link>}>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: ShoppingBag, label: "الطلبات", to: "/admin/orders", tone: "from-primary to-primary-glow" },
              { icon: Package, label: "المنتجات", to: "/admin/products", tone: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]" },
              { icon: Users, label: "العملاء", to: "/admin/customers", tone: "from-[hsl(var(--info))] to-[hsl(var(--indigo))]" },
              { icon: Wallet, label: "المحافظ", to: "/admin/wallets", tone: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]" },
            ].map((a) => (
              <Link key={a.label} to={a.to} className="flex flex-col items-center gap-1.5 press">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${a.tone} flex items-center justify-center text-white shadow-md`}>
                  <a.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </IOSSection>

        <IOSSection title="آخر الطلبات" action={<Link to="/admin/orders" className="text-sm text-primary press">عرض الكل</Link>}>
          <IOSList>
            {recent.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-foreground-secondary">لا توجد طلبات بعد</div>
            ) : recent.map((o) => {
              const s = statusMap[o.status] ?? { label: o.status, tone: "bg-muted text-foreground-secondary" };
              return (
                <Link key={o.id} to="/admin/orders/$orderId" params={{ orderId: o.id }}>
                  <IOSRow>
                    <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0 font-mono text-[10px] font-semibold">
                      {String(o.id).slice(0, 4).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.tone}`}>{s.label}</span>
                        <p className="text-[12px] text-foreground-tertiary">{new Date(o.created_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                    <p className="text-[14px] font-display num shrink-0">{fmtMoney(o.total)}</p>
                    <ChevronLeft className="h-4 w-4 text-foreground-tertiary shrink-0" />
                  </IOSRow>
                </Link>
              );
            })}
          </IOSList>
        </IOSSection>
      </div>
    </>
  );
}
