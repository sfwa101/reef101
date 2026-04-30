import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, User, Wallet, ShoppingBag, TrendingUp, Award, Phone, Calendar, Package, ChevronLeft,
} from "lucide-react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversalAdminGrid, type DataSource, type Column } from "@/components/admin/UniversalAdminGrid";
import { supabase } from "@/integrations/supabase/client";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  occupation: string | null;
  household_size: number | null;
  preferred_locale: string | null;
};

type WalletRow = { balance: number; points: number; cashback: number; coupons: number };
type StatsRow = { total_spent: number; orders_count: number; last_order_at: string | null };
type OrderRow = { id: string; total: number; status: string; created_at: string };

function tierFromSpent(spent: number): { label: string; color: string; icon: typeof Award } {
  if (spent >= 50000) return { label: "VIP بلاتيني", color: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]", icon: Award };
  if (spent >= 20000) return { label: "VIP ذهبي",   color: "from-[hsl(45_95%_55%)] to-[hsl(35_95%_55%)]", icon: Award };
  if (spent >= 5000)  return { label: "فضي",        color: "from-[hsl(220_8%_70%)] to-[hsl(220_8%_55%)]", icon: Award };
  return { label: "برونزي", color: "from-[hsl(25_55%_55%)] to-[hsl(20_55%_45%)]", icon: Award };
}

const TONE_GRADIENTS: Record<string, string> = {
  primary: "from-primary to-primary-glow",
  info: "from-[hsl(var(--info))] to-[hsl(var(--indigo))]",
  success: "from-[hsl(var(--success))] to-[hsl(var(--teal))]",
  accent: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]",
};

function BentoCard({
  icon: Icon, label, value, hint, tone = "primary",
}: { icon: typeof Wallet; label: string; value: string | number; hint?: string; tone?: keyof typeof TONE_GRADIENTS }) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-4 bg-card border border-border/50 shadow-soft">
      <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center mb-3 shadow-sm", TONE_GRADIENTS[tone])}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
      </div>
      <p className="text-[11px] text-foreground-tertiary leading-tight">{label}</p>
      <p className="font-display text-[20px] num leading-tight mt-0.5">{value}</p>
      {hint && <p className="text-[10.5px] text-foreground-tertiary mt-1">{hint}</p>}
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending:   { label: "قيد التجهيز", cls: "bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]" },
  confirmed: { label: "مؤكد",        cls: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]" },
  shipped:   { label: "في الطريق",   cls: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]" },
  delivered: { label: "تم التسليم",  cls: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" },
  cancelled: { label: "ملغي",        cls: "bg-muted text-foreground-tertiary" },
};

const orderColumns: Column<OrderRow>[] = [
  {
    key: "id",
    render: (o) => (
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-foreground-tertiary shrink-0" />
          <span className="font-display text-[13.5px]">#{o.id.slice(0, 8)}</span>
        </div>
        <p className="text-[11px] text-foreground-tertiary mt-0.5">
          {new Date(o.created_at).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>
    ),
    className: "flex-1 min-w-0",
  },
  {
    key: "status",
    render: (o) => {
      const s = STATUS_LABEL[o.status] ?? { label: o.status, cls: "bg-muted text-foreground" };
      return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
    },
    className: "shrink-0",
  },
  {
    key: "total",
    render: (o) => (
      <span className="font-display text-[13.5px] font-bold tabular-nums">
        {fmtNum(Math.round(Number(o.total ?? 0)))} ج.م
      </span>
    ),
    className: "w-24 text-left shrink-0",
  },
];

export default function CustomerDetail({ customerId }: { customerId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [stats, setStats] = useState<StatsRow>({ total_spent: 0, orders_count: 0, last_order_at: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const [prof, wal, ord] = await Promise.all([
        supabase.from("profiles").select("id,full_name,phone,avatar_url,created_at,occupation,household_size,preferred_locale").eq("id", customerId).maybeSingle(),
        supabase.from("wallet_balances").select("balance,points,cashback,coupons").eq("user_id", customerId).maybeSingle(),
        supabase.from("orders").select("total,created_at").eq("user_id", customerId).limit(1000),
      ]);

      if (cancelled) return;

      setProfile((prof.data as Profile) ?? null);
      setWallet((wal.data as WalletRow) ?? { balance: 0, points: 0, cashback: 0, coupons: 0 });

      const orders = (ord.data ?? []) as { total: number; created_at: string }[];
      const total_spent = orders.reduce((a, b) => a + Number(b.total ?? 0), 0);
      const last_order_at = orders.length
        ? orders.map((o) => o.created_at).sort().slice(-1)[0]
        : null;
      setStats({ total_spent, orders_count: orders.length, last_order_at });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [customerId]);

  const tier = useMemo(() => tierFromSpent(stats.total_spent), [stats.total_spent]);
  const TierIcon = tier.icon;

  // DataSource for the orders mini-grid — same stem cell, just a user_id filter via custom fetcher.
  const ordersDataSource: DataSource<OrderRow> = useMemo(() => ({
    fetcher: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,total,status,created_at")
        .eq("user_id", customerId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
    searchKeys: ["id", "status"],
  }), [customerId]);

  return (
    <>
      <MobileTopbar title="بطاقة العميل" />

      <div className="hidden lg:flex items-center gap-3 px-6 pt-8 pb-3 max-w-[1400px] mx-auto">
        <Link to="/admin/customers" className="press inline-flex items-center gap-1 text-[13px] text-foreground-secondary hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة للعملاء
        </Link>
      </div>

      <div className="px-4 lg:px-6 pt-3 pb-10 max-w-[1400px] mx-auto space-y-5">
        {/* Customer header */}
        <section className="bg-surface rounded-3xl border border-border/50 shadow-soft p-5">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : !profile ? (
            <div className="text-center py-8">
              <User className="h-10 w-10 mx-auto mb-2 text-foreground-tertiary opacity-50" />
              <p className="font-display text-[15px]">العميل غير موجود</p>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center font-display text-2xl shadow-soft shrink-0">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-2xl" />
                  : (profile.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-[20px] lg:text-[24px] tracking-tight truncate">
                  {profile.full_name ?? "بدون اسم"}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-foreground-secondary">
                  {profile.phone && (
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone}</span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    عضو منذ {new Date(profile.created_at).toLocaleDateString("ar-EG", { month: "short", year: "numeric" })}
                  </span>
                  {profile.occupation && <span>· {profile.occupation}</span>}
                </div>
                <div className={cn("inline-flex items-center gap-1.5 mt-3 rounded-full bg-gradient-to-r text-white px-3 py-1 text-[11.5px] font-extrabold shadow-sm", tier.color)}>
                  <TierIcon className="h-3.5 w-3.5" />
                  {tier.label}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Bento KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)
          ) : (
            <>
              <BentoCard
                icon={Wallet}
                label="رصيد المحفظة"
                value={`${fmtNum(Math.round(Number(wallet?.balance ?? 0)))} ج.م`}
                hint={`${fmtNum(wallet?.points ?? 0)} نقطة`}
                tone="primary"
              />
              <BentoCard
                icon={TrendingUp}
                label="إجمالي الإنفاق"
                value={`${fmtNum(Math.round(stats.total_spent))} ج.م`}
                hint={stats.last_order_at ? `آخر طلب: ${new Date(stats.last_order_at).toLocaleDateString("ar-EG")}` : "لا طلبات"}
                tone="success"
              />
              <BentoCard
                icon={ShoppingBag}
                label="عدد الطلبات"
                value={fmtNum(stats.orders_count)}
                hint={stats.orders_count > 0 ? `متوسط ${fmtNum(Math.round(stats.total_spent / stats.orders_count))} ج.م/طلب` : undefined}
                tone="info"
              />
              <BentoCard
                icon={Award}
                label="مستوى الولاء"
                value={tier.label}
                hint={`${fmtNum(wallet?.cashback ?? 0)} كاش-باك`}
                tone="accent"
              />
            </>
          )}
        </div>

        {/* Orders mini-grid — stem cell, filtered by user_id */}
        <div className="-mx-4 lg:-mx-6">
          <UniversalAdminGrid<OrderRow>
            title="سجل الطلبات"
            columns={orderColumns}
            dataSource={ordersDataSource}
            searchPlaceholder="ابحث برقم الطلب أو الحالة..."
            empty={{ icon: ShoppingBag, title: "لا توجد طلبات بعد", hint: "ستظهر طلبات هذا العميل هنا" }}
            onRowClick={undefined}
            rowActions={[
              {
                label: "عرض",
                icon: ChevronLeft,
                onClick: (o) => { window.location.href = `/admin/orders/${o.id}`; },
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
