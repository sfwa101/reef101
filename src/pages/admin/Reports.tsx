import { useEffect, useMemo, useState } from "react";
import { TrendingUp, ShoppingBag, DollarSign, Package } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";

type Range = "7" | "30" | "90";

export default function AdminReports() {
  const [range, setRange] = useState<Range>("30");
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const days = parseInt(range);
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const [{ data: o }, { data: it }] = await Promise.all([
        supabase.from("orders").select("id,total,status,created_at").gte("created_at", since),
        supabase.from("order_items").select("product_id,product_name,quantity,price,created_at").gte("created_at", since),
      ]);
      setOrders(o ?? []);
      setItems(it ?? []);
      setLoading(false);
    })();
  }, [range]);

  const totals = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const count = orders.length;
    const avg = count > 0 ? revenue / count : 0;
    const completed = orders.filter((o) => o.status === "delivered").length;
    return { revenue, count, avg, completed };
  }, [orders]);

  const dailyChart = useMemo(() => {
    const days = parseInt(range);
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    orders.forEach((o) => {
      const k = new Date(o.created_at).toISOString().slice(0, 10);
      if (map[k] !== undefined) map[k] += Number(o.total ?? 0);
    });
    return Object.entries(map).map(([date, total]) => ({
      date: new Date(date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
      total: Math.round(total),
    }));
  }, [orders, range]);

  const statusChart = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => { map[o.status] = (map[o.status] ?? 0) + 1; });
    const labels: Record<string, string> = {
      pending: "قيد الانتظار", confirmed: "مؤكد", preparing: "قيد التحضير",
      out_for_delivery: "للتوصيل", delivered: "مكتمل", cancelled: "ملغي",
    };
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] ?? k, value: v }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    items.forEach((i) => {
      const key = i.product_id;
      if (!map[key]) map[key] = { name: i.product_name, qty: 0, revenue: 0 };
      map[key].qty += Number(i.quantity ?? 0);
      map[key].revenue += Number(i.quantity ?? 0) * Number(i.price ?? 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [items]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التقارير والإحصائيات</h1>
          <p className="text-sm text-muted-foreground">آخر {range} يوماً</p>
        </div>
        <div className="flex gap-1 rounded-2xl border border-border bg-card p-1">
          {(["7", "30", "90"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium ${range === r ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"}`}>
              {r} يوم
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI icon={<DollarSign />} label="إجمالي الإيرادات" value={totals.revenue.toFixed(2)} sub="جنيه" />
        <KPI icon={<ShoppingBag />} label="عدد الطلبات" value={totals.count.toString()} />
        <KPI icon={<TrendingUp />} label="متوسط الطلب" value={totals.avg.toFixed(2)} sub="جنيه" />
        <KPI icon={<Package />} label="المكتملة" value={totals.completed.toString()} />
      </div>

      {/* Daily revenue */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">الإيرادات اليومية</h2>
        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">توزيع حالات الطلبات</h2>
          {loading || statusChart.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">أكثر المنتجات مبيعاً</h2>
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          ) : topProducts.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.qty} قطعة</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold">{p.revenue.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-xl font-bold text-foreground">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
