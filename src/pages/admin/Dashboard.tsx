import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { HakimSovereignCard } from "@/components/admin/HakimSovereignCard";
import { BentoStats } from "@/components/admin/BentoStats";
import { OrderSlideOver } from "@/components/admin/OrderSlideOver";
import { ChevronLeft, Package, Users, Wallet, ShoppingBag } from "lucide-react";
import { fmtMoney } from "@/lib/format";
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

export default function Dashboard() {
  const { profile } = useAuth();
  const [bento, setBento] = useState({
    todayOrders: 0, todayRevenue: 0, inDelivery: 0,
    totalCustomers: 0, lowStock: 0, partnersDue: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);

    const load = async () => {
      try {
        const [ordersRes, profilesRes, lowRes] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("orders").select("id,total,status,created_at,user_id, profiles:user_id(full_name)").order("created_at", { ascending: false }).limit(40),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("products").select("id", { count: "exact", head: true }).lte("stock", 5),
        ]);
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orders: any[] = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const today = orders.filter((o: any) => new Date(o.created_at) >= startToday);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inDelivery = orders.filter((o: any) =>
          ["out_for_delivery", "preparing", "ready", "confirmed"].includes(o.status)).length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const todayRev = today.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
        setBento({
          todayOrders: today.length,
          todayRevenue: todayRev,
          inDelivery,
          totalCustomers: profilesRes?.count ?? 0,
          lowStock: lowRes?.count ?? 0,
          partnersDue: 0,
        });
        setRecent(orders.slice(0, 8));
      } catch {
        if (!cancelled) setRecent([]);
      }
    };

    load();

    // Live updates: any insert/update/delete on orders triggers a refetch.
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

  return (
    <>
      <MobileTopbar title={greeting()} />

      {/* Desktop greeting */}
      <div className="hidden lg:flex items-end justify-between px-6 pt-8 pb-3 max-w-[1400px] mx-auto">
        <div>
          <p className="text-sm text-foreground-secondary">{greeting()}, {profile?.full_name ?? "أهلاً"}</p>
          <h1 className="font-display text-[34px] tracking-tight mt-0.5">مركز القيادة</h1>
        </div>
        <div className="flex items-center gap-2 text-xs bg-surface rounded-full px-3 py-1.5 border border-border/50 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />متصل بالبيانات الحية
        </div>
      </div>

      <div className="px-4 lg:px-6 pt-3 pb-10 max-w-[1400px] mx-auto space-y-5 lg:space-y-6">
        {/* 1. Hakim Sovereign card */}
        <HakimSovereignCard />

        {/* 2. Bento Grid */}
        <BentoStats stats={bento} />

        {/* 3. Quick actions (mobile-friendly) */}
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

        {/* 4. Live orders feed */}
        <section className="bg-surface rounded-3xl border border-border/50 shadow-soft overflow-hidden">
          <div className="px-4 lg:px-5 py-3 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <h2 className="font-display text-[16px]">الطلبات المباشرة</h2>
            </div>
            <Link to="/admin/orders" className="text-[12px] text-primary hover:underline flex items-center gap-0.5">
              عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-foreground-tertiary">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-40" />
              لا توجد طلبات بعد
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recent.map((o) => {
                const meta = statusMeta[o.status] ?? { label: o.status, cls: "bg-muted text-foreground-secondary" };
                return (
                  <button
                    key={o.id}
                    onClick={() => setActiveOrderId(o.id)}
                    className="w-full px-4 lg:px-5 py-3 flex items-center gap-3 hover:bg-surface-muted/50 transition text-right press"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-mono text-[10px] font-semibold shrink-0">
                      {String(o.id).slice(0, 4).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium truncate">{o.profiles?.full_name ?? "عميل"}</p>
                      <p className="text-[11px] text-foreground-tertiary">
                        {new Date(o.created_at).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`text-[10.5px] px-2 py-1 rounded-full font-semibold shrink-0 ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <p className="text-[14px] font-display num shrink-0 min-w-[80px] text-left">{fmtMoney(o.total)}</p>
                    <ChevronLeft className="h-4 w-4 text-foreground-tertiary shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <OrderSlideOver orderId={activeOrderId} onClose={() => setActiveOrderId(null)} />
    </>
  );
}
