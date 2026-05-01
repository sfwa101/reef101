import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { HakimSovereignCard } from "@/components/admin/HakimSovereignCard";
import { BentoStats } from "@/components/admin/BentoStats";
import { OrderSlideOver } from "@/components/admin/OrderSlideOver";
import {
  AdminSection,
  KpiCard,
  Sparkline,
  Funnel,
  MiniBars,
  ActivityRow,
  EmptyState,
  SectionLink,
} from "@/components/admin/ui";
import {
  ChevronLeft,
  Package,
  Users,
  Wallet,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Truck,
  Receipt,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import { fmtMoney, fmtNum } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء النور";
};

const statusMeta: Record<string, { label: string; cls: string }> = {
  pending:          { label: "بانتظار",     cls: "bg-muted text-foreground-secondary" },
  confirmed:        { label: "مؤكد",        cls: "bg-info/15 text-info" },
  preparing:        { label: "قيد التجهيز", cls: "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]" },
  ready:            { label: "جاهز",        cls: "bg-warning/15 text-warning" },
  out_for_delivery: { label: "مع المندوب",  cls: "bg-info/15 text-info" },
  delivered:        { label: "تم التسليم",  cls: "bg-success/15 text-success" },
  cancelled:        { label: "ملغي",        cls: "bg-destructive/10 text-destructive" },
  paid:             { label: "مدفوع",       cls: "bg-success/15 text-success" },
};

type OrderRow = {
  id: string;
  total: number | null;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name?: string | null } | null;
};

export default function Dashboard() {
  const { profile } = useAuth();
  const [bento, setBento] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    inDelivery: 0,
    totalCustomers: 0,
    lowStock: 0,
    partnersDue: 0,
  });
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [topCats, setTopCats] = useState<{ label: string; value: number }[]>([]);
  const [week, setWeek] = useState<{ id: string; total: number | null; created_at: string; status: string }[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const start7 = new Date(); start7.setDate(start7.getDate() - 6); start7.setHours(0, 0, 0, 0);

    const load = async () => {
      try {
        const [ordersRes, profilesRes, lowRes, weekRes, catsRes] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from("orders")
            .select("id,total,status,created_at,user_id, profiles:user_id(full_name)")
            .order("created_at", { ascending: false })
            .limit(60),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("products").select("id", { count: "exact", head: true }).lte("stock", 5),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from("orders")
            .select("id,total,created_at,status")
            .gte("created_at", start7.toISOString())
            .order("created_at", { ascending: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from("order_items")
            .select("subtotal,products(category)")
            .gte("created_at", start7.toISOString())
            .limit(500),
        ]);
        if (cancelled) return;

        const list: OrderRow[] = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
        const today = list.filter((o) => new Date(o.created_at) >= startToday);
        const inDelivery = list.filter((o) =>
          ["out_for_delivery", "preparing", "ready", "confirmed"].includes(o.status),
        ).length;
        const todayRev = today.reduce((s, o) => s + Number(o.total ?? 0), 0);

        setBento({
          todayOrders: today.length,
          todayRevenue: todayRev,
          inDelivery,
          totalCustomers: profilesRes?.count ?? 0,
          lowStock: lowRes?.count ?? 0,
          partnersDue: 0,
        });
        setOrders(list);

        // Top categories (last 7 days)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = Array.isArray(catsRes?.data) ? catsRes.data : [];
        const catMap = new Map<string, number>();
        for (const it of items) {
          const cat = it?.products?.category ?? "غير مصنّف";
          catMap.set(cat, (catMap.get(cat) ?? 0) + Number(it?.subtotal ?? 0));
        }
        setTopCats(
          [...catMap.entries()]
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5),
        );

        setWeek(Array.isArray(weekRes?.data) ? weekRes.data : []);
      } catch {
        if (!cancelled) setOrders([]);
      }
    };

    load();

    const channel = supabase
      .channel("admin-dashboard-orders")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "orders" },
        () => { if (!cancelled) load(); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---- Derived ---- */

  const series7 = useMemo(() => {
    const days: number[] = Array(7).fill(0);
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    for (const o of week) {
      const d = new Date(o.created_at);
      const idx = Math.floor((d.getTime() - start.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) days[idx] += Number(o.total ?? 0);
    }
    return days;
  }, [week]);

  const weekTotal = series7.reduce((s, v) => s + v, 0);
  const yesterdayTotal = series7[series7.length - 2] ?? 0;
  const todayInWeek = series7[series7.length - 1] ?? 0;
  const dayDelta = yesterdayTotal === 0 ? 0 : ((todayInWeek - yesterdayTotal) / yesterdayTotal) * 100;

  const funnelSteps = useMemo(() => {
    const counts = (s: string) => week.filter((o) => o.status === s).length;
    return [
      { label: "الطلبات الجديدة", value: counts("pending") + counts("confirmed") },
      { label: "قيد التجهيز", value: counts("preparing") + counts("ready") },
      { label: "في الطريق", value: counts("out_for_delivery"), tone: "bg-info" },
      { label: "تم التسليم", value: counts("delivered"), tone: "bg-success" },
    ];
  }, [week]);

  const recent = orders.slice(0, 8);

  // Alerts derived from real signals
  const alerts: { icon: typeof AlertTriangle; title: string; hint: string; tone: "warning" | "destructive" | "info"; to?: string }[] = [];
  if (bento.lowStock > 0)
    alerts.push({
      icon: AlertTriangle,
      title: `${fmtNum(bento.lowStock)} منتجاً بمخزون منخفض`,
      hint: "يحتاج إلى تجديد عاجل",
      tone: "warning",
      to: "/admin/low-stock",
    });
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  if (pendingCount > 0)
    alerts.push({
      icon: Clock,
      title: `${fmtNum(pendingCount)} طلب بانتظار التأكيد`,
      hint: "يفضّل المعالجة خلال ١٠ دقائق",
      tone: pendingCount > 5 ? "destructive" : "info",
      to: "/admin/orders",
    });
  if (bento.inDelivery > 0)
    alerts.push({
      icon: Truck,
      title: `${fmtNum(bento.inDelivery)} طلب في التجهيز/التوصيل`,
      hint: "تابع الحالة الميدانية",
      tone: "info",
      to: "/admin/delivery",
    });
  if (alerts.length === 0)
    alerts.push({
      icon: CheckCircle2,
      title: "كل شيء على ما يرام",
      hint: "لا توجد تنبيهات تشغيلية الآن",
      tone: "info",
    });

  return (
    <>
      <MobileTopbar title={greeting()} />

      {/* Desktop greeting */}
      <div className="hidden lg:flex items-end justify-between px-6 pt-6 pb-2 max-w-[1440px] mx-auto">
        <div>
          <p className="text-sm text-foreground-secondary">
            {greeting()}, {profile?.full_name ?? "أهلاً"}
          </p>
          <h1 className="font-display text-[32px] tracking-tight mt-0.5">مركز القيادة</h1>
        </div>
        <div className="flex items-center gap-2 text-xs bg-card rounded-full px-3 py-1.5 border border-border/50 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          متصل بالبيانات الحية
        </div>
      </div>

      <div className="px-4 lg:px-6 pt-3 pb-10 max-w-[1440px] mx-auto space-y-5 lg:space-y-6">
        {/* Hakim sovereign — kept */}
        <HakimSovereignCard />

        {/* KPI Strip — desktop only; mobile uses BentoStats below */}
        <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="إيرادات اليوم"
            value={fmtMoney(bento.todayRevenue)}
            hint={`أمس: ${fmtMoney(yesterdayTotal)}`}
            delta={dayDelta}
            icon={TrendingUp}
            tone="success"
            to="/admin/orders"
          />
          <KpiCard
            label="طلبات اليوم"
            value={fmtNum(bento.todayOrders)}
            hint={`نشطة: ${fmtNum(bento.inDelivery)}`}
            icon={ShoppingBag}
            tone="primary"
            to="/admin/orders"
          />
          <KpiCard
            label="إجمالي العملاء"
            value={fmtNum(bento.totalCustomers)}
            icon={Users}
            tone="info"
            to="/admin/customers"
          />
          <KpiCard
            label="مخزون منخفض"
            value={fmtNum(bento.lowStock)}
            hint="منتج يحتاج تجديد"
            icon={AlertTriangle}
            tone="warning"
            to="/admin/low-stock"
            urgent={bento.lowStock > 0}
          />
        </div>

        {/* Mobile bento — kept for parity */}
        <div className="lg:hidden">
          <BentoStats stats={bento} />
        </div>

        {/* Quick actions (mobile-only) */}
        <section className="lg:hidden">
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
        </section>

        {/* Trends + Funnel row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <AdminSection
            className="lg:col-span-2"
            title="مبيعات آخر ٧ أيام"
            subtitle={`الإجمالي: ${fmtMoney(weekTotal)}`}
            action={<SectionLink to="/admin/analytics" label="التحليلات" />}
          >
            {series7.every((v) => v === 0) ? (
              <EmptyState icon={Activity} title="لا توجد مبيعات بعد" hint="ستظهر الاتجاهات هنا فور تسجيل أول طلب." />
            ) : (
              <div className="flex items-end gap-4">
                <div className="flex-1 h-24 lg:h-28">
                  <Sparkline data={series7} width={600} height={110} className="w-full h-full" />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-foreground-tertiary">اليوم</p>
                  <p className="font-display text-[22px] num leading-tight">{fmtMoney(todayInWeek)}</p>
                  <p
                    className={`text-[11px] num font-semibold ${
                      dayDelta >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {dayDelta >= 0 ? "+" : ""}
                    {dayDelta.toFixed(1)}% مقابل أمس
                  </p>
                </div>
              </div>
            )}
          </AdminSection>

          <AdminSection
            title="مسار الطلبات"
            subtitle="آخر ٧ أيام"
            action={<SectionLink to="/admin/orders" label="الطلبات" />}
          >
            {week.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="لا توجد طلبات هذا الأسبوع" />
            ) : (
              <Funnel steps={funnelSteps} />
            )}
          </AdminSection>
        </div>

        {/* Top categories + Alerts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <AdminSection
            className="lg:col-span-2"
            title="أعلى الفئات مبيعاً"
            subtitle="آخر ٧ أيام"
            action={<SectionLink to="/admin/products" label="المنتجات" />}
          >
            <MiniBars rows={topCats} formatValue={(v) => fmtMoney(v)} />
          </AdminSection>

          <AdminSection title="مركز التنبيهات" subtitle="إشارات تشغيلية مباشرة">
            <ul className="divide-y divide-border/40 -my-1">
              {alerts.map((a, i) => (
                <li key={i}>
                  <ActivityRow
                    icon={a.icon}
                    title={a.title}
                    hint={a.hint}
                    tone={a.tone}
                    to={a.to}
                  />
                </li>
              ))}
            </ul>
          </AdminSection>
        </div>

        {/* Live orders feed — kept, restyled */}
        <AdminSection
          pad={false}
          title={
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              الطلبات المباشرة
            </span>
          }
          action={<SectionLink to="/admin/orders" label="عرض الكل" />}
        >
          {recent.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="لا توجد طلبات بعد" />
          ) : (
            <div className="divide-y divide-border/40">
              {recent.map((o) => {
                const meta = statusMeta[o.status] ?? { label: o.status, cls: "bg-muted text-foreground-secondary" };
                return (
                  <button
                    key={o.id}
                    onClick={() => setActiveOrderId(o.id)}
                    className="w-full px-4 lg:px-5 py-3 flex items-center gap-3 hover:bg-surface-muted/50 transition text-right press min-h-[56px]"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-mono text-[10px] font-semibold shrink-0">
                      {String(o.id).slice(0, 4).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium truncate">{o.profiles?.full_name ?? "عميل"}</p>
                      <p className="text-[11px] text-foreground-tertiary">
                        {new Date(o.created_at).toLocaleString("ar-EG", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={`text-[10.5px] px-2 py-1 rounded-full font-semibold shrink-0 ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <p className="text-[14px] font-display num shrink-0 min-w-[80px] text-left">{fmtMoney(o.total ?? 0)}</p>
                    <ChevronLeft className="h-4 w-4 text-foreground-tertiary shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </AdminSection>

        {/* Action queues — drill-down launchpad */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            to="/admin/payouts"
            className="rounded-3xl p-4 lg:p-5 bg-card border border-border/50 shadow-soft hover:shadow-tile transition-all hover:-translate-y-0.5 press flex items-center gap-3 min-h-[88px]"
          >
            <div className="h-11 w-11 rounded-2xl bg-success/12 text-success flex items-center justify-center">
              <Wallet className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold">طلبات السحب المعلّقة</p>
              <p className="text-[11.5px] text-foreground-tertiary">راجع وموّل بأمان</p>
            </div>
            <ChevronLeft className="h-4 w-4 text-foreground-tertiary" />
          </Link>
          <Link
            to="/admin/topup-approvals"
            className="rounded-3xl p-4 lg:p-5 bg-card border border-border/50 shadow-soft hover:shadow-tile transition-all hover:-translate-y-0.5 press flex items-center gap-3 min-h-[88px]"
          >
            <div className="h-11 w-11 rounded-2xl bg-info/12 text-info flex items-center justify-center">
              <Receipt className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold">شحنات المحفظة بانتظار الموافقة</p>
              <p className="text-[11.5px] text-foreground-tertiary">معاملات تنتظر مراجعتك</p>
            </div>
            <ChevronLeft className="h-4 w-4 text-foreground-tertiary" />
          </Link>
          <Link
            to="/admin/kyc"
            className="rounded-3xl p-4 lg:p-5 bg-card border border-border/50 shadow-soft hover:shadow-tile transition-all hover:-translate-y-0.5 press flex items-center gap-3 min-h-[88px]"
          >
            <div className="h-11 w-11 rounded-2xl bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] flex items-center justify-center">
              <Users className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold">طلبات التحقق KYC</p>
              <p className="text-[11.5px] text-foreground-tertiary">تحقق من هويات الموردين والشركاء</p>
            </div>
            <ChevronLeft className="h-4 w-4 text-foreground-tertiary" />
          </Link>
        </div>
      </div>

      <OrderSlideOver orderId={activeOrderId} onClose={() => setActiveOrderId(null)} />
    </>
  );
}
