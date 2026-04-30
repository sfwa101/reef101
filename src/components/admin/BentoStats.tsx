import { Link } from "@tanstack/react-router";
import { ShoppingBag, Package, Wallet, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { fmtMoney, fmtNum } from "@/lib/format";

type Bento = {
  todayOrders: number;
  todayRevenue: number;
  inDelivery: number;
  totalCustomers: number;
  lowStock: number;
  partnersDue: number;
};

export function BentoStats({ stats }: { stats: Bento }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
      {/* Big revenue tile spans 2 cols on mobile + xl */}
      <Link
        to="/admin/orders"
        className="col-span-2 xl:col-span-2 group relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft hover:shadow-elegant transition-all hover:-translate-y-0.5 press"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-[10.5px] opacity-90 bg-white/15 rounded-full px-2 py-0.5">اليوم</span>
          </div>
          <p className="text-[11.5px] opacity-90">التحصيلات النقدية</p>
          <p className="font-display text-[26px] lg:text-[30px] num leading-tight mt-0.5">{fmtMoney(stats.todayRevenue)}</p>
        </div>
      </Link>

      <BentoTile
        to="/admin/orders?status=preparing"
        icon={ShoppingBag}
        label="طلبات قيد التنفيذ"
        value={fmtNum(stats.inDelivery)}
        tone="from-[hsl(var(--info))] to-[hsl(var(--indigo))]"
      />
      <BentoTile
        to="/admin/orders"
        icon={ShoppingBag}
        label="طلبات اليوم"
        value={fmtNum(stats.todayOrders)}
        tone="from-[hsl(var(--purple))] to-[hsl(var(--pink))]"
      />
      <BentoTile
        to="/admin/low-stock"
        icon={AlertTriangle}
        label="مخزون منخفض"
        value={fmtNum(stats.lowStock)}
        tone="from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]"
        urgent={stats.lowStock > 0}
      />
      <BentoTile
        to="/admin/partners"
        icon={Wallet}
        label="مستحقات الشركاء"
        value={fmtMoney(stats.partnersDue)}
        tone="from-[hsl(var(--success))] to-[hsl(var(--teal))]"
      />
      <BentoTile
        to="/admin/customers"
        icon={Users}
        label="إجمالي العملاء"
        value={fmtNum(stats.totalCustomers)}
        tone="from-[hsl(var(--teal))] to-[hsl(var(--info))]"
      />
    </div>
  );
}

function BentoTile({ to, icon: Icon, label, value, tone, urgent }: {
  to: string; icon: any; label: string; value: string; tone: string; urgent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-3xl p-4 bg-card border ${urgent ? "border-[hsl(var(--accent))]/40" : "border-border/50"} shadow-soft hover:shadow-tile transition-all hover:-translate-y-0.5 press`}
    >
      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${tone} text-white flex items-center justify-center mb-3 shadow-sm`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
      </div>
      <p className="text-[11px] text-foreground-tertiary leading-tight">{label}</p>
      <p className="font-display text-[20px] num leading-tight mt-0.5">{value}</p>
      {urgent && (
        <span className="absolute top-3 left-3 h-2 w-2 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
      )}
    </Link>
  );
}
