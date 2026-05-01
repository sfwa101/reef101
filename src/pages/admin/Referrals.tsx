import { Users, Coins, CheckCircle2, Clock } from "lucide-react";
import { UniversalAdminGrid, type Column } from "@/components/admin/UniversalAdminGrid";
import { fmtNum } from "@/lib/format";

type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  commission: number;
  first_order_at: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  registered: "مسجّل",
  ordered: "طلب أول",
  paid: "تم الصرف",
  cancelled: "ملغي",
};

const columns: Column<Referral>[] = [
  {
    key: "referrer",
    label: "المُحيل",
    render: (r) => (
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold truncate">
          {r.referrer_id.slice(0, 8)}…
        </p>
        <p className="text-[11px] text-foreground-tertiary">
          → {r.referred_id.slice(0, 8)}…
        </p>
      </div>
    ),
  },
  {
    key: "status",
    label: "الحالة",
    className: "shrink-0",
    render: (r) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-soft text-primary border border-primary/20">
        {STATUS_LABEL[r.status] ?? r.status}
      </span>
    ),
  },
  {
    key: "commission",
    label: "المكافأة",
    className: "shrink-0 text-left",
    render: (r) => (
      <span className="num text-[13.5px] font-semibold">
        {fmtNum(Number(r.commission ?? 0))} ج
      </span>
    ),
  },
];

export default function Referrals() {
  return (
    <UniversalAdminGrid<Referral>
      title="الإحالات"
      subtitle="نظام التسويق بالعمولة وبرنامج الإحالة"
      metrics={[
        {
          key: "total",
          label: "إجمالي الإحالات",
          icon: Users,
          tone: "primary",
          compute: (rows) => fmtNum(rows.length),
        },
        {
          key: "pending",
          label: "قيد الانتظار",
          icon: Clock,
          tone: "warning",
          compute: (rows) =>
            fmtNum(rows.filter((r: Referral) => r.status === "registered").length),
          urgent: (rows) =>
            rows.filter((r: Referral) => r.status === "registered").length > 0,
        },
        {
          key: "paid",
          label: "تم الصرف",
          icon: CheckCircle2,
          tone: "success",
          compute: (rows) =>
            fmtNum(rows.filter((r: Referral) => r.status === "paid").length),
        },
        {
          key: "commissions",
          label: "إجمالي العمولات",
          icon: Coins,
          tone: "accent",
          compute: (rows) =>
            `${fmtNum(
              rows.reduce((s: number, r: Referral) => s + Number(r.commission ?? 0), 0),
            )} ج`,
        },
      ]}
      columns={columns}
      dataSource={{
        table: "referrals",
        select: "id,referrer_id,referred_id,status,commission,first_order_at,created_at",
        orderBy: { column: "created_at", ascending: false },
        searchKeys: ["referrer_id", "referred_id", "status"],
      }}
      searchPlaceholder="بحث برقم المسوق أو الحالة..."
      empty={{ icon: Users, title: "لا توجد إحالات بعد", hint: "سيظهر هنا كل عميل دعا صديقاً" }}
    />
  );
}
