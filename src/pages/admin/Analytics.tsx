import { Activity, ShoppingBag, Wallet, Users } from "lucide-react";
import { UniversalAdminGrid } from "@/components/admin/UniversalAdminGrid";
import { HakimPulseMonitor } from "@/features/hakim/components/HakimPulseMonitor";
import { fmtMoney, fmtNum } from "@/lib/format";

type OrderRow = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  service_type: string;
  payment_method: string | null;
  created_at: string;
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-info/15 text-info",
  preparing: "bg-info/15 text-info",
  ready: "bg-accent/15 text-accent",
  out_for_delivery: "bg-primary/15 text-primary",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار", confirmed: "مؤكَّد", preparing: "تجهيز", ready: "جاهز",
  out_for_delivery: "في الطريق", delivered: "تم التسليم", cancelled: "ملغي",
};

const ACTIVE = new Set(["pending", "confirmed", "preparing", "ready", "out_for_delivery"]);

export default function AnalyticsAdmin() {
  return (
    <UniversalAdminGrid<OrderRow>
      title="التحليلات"
      subtitle="نظرة لحظية على آخر 200 طلب — الإيرادات، الحالات، وقنوات البيع"
      dataSource={{
        table: "orders",
        select: "id,user_id,total,status,service_type,payment_method,created_at",
        orderBy: { column: "created_at", ascending: false },
        limit: 200,
        searchKeys: ["id", "status", "service_type", "payment_method"],
      }}
      metrics={[
        {
          key: "revenue", label: "إيرادات (مكتملة)", icon: Wallet, tone: "success",
          compute: (rows) => fmtMoney((rows as OrderRow[])
            .filter(r => r.status === "delivered")
            .reduce((s, r) => s + Number(r.total || 0), 0)),
        },
        {
          key: "active", label: "طلبات نشطة", icon: Activity, tone: "primary",
          compute: (rows) => fmtNum((rows as OrderRow[]).filter(r => ACTIVE.has(r.status)).length),
          urgent: (rows) => (rows as OrderRow[]).filter(r => r.status === "pending").length > 5,
        },
        {
          key: "total", label: "إجمالي المرصود", icon: ShoppingBag, tone: "info",
          compute: (rows) => fmtNum(rows.length),
        },
        {
          key: "customers", label: "عملاء فريدون", icon: Users, tone: "accent",
          compute: (rows) => fmtNum(new Set((rows as OrderRow[]).map(r => r.user_id)).size),
        },
      ]}
      columns={[
        {
          key: "id", className: "flex-1",
          render: (r) => (
            <>
              <p className="text-[13px] font-mono">#{r.id.slice(0, 8)}</p>
              <p className="text-[11px] text-foreground-tertiary">
                {new Date(r.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })} • {r.service_type}
              </p>
            </>
          ),
        },
        {
          key: "total", className: "shrink-0 text-right",
          render: (r) => (
            <>
              <p className="text-[13px] font-display num">{fmtMoney(r.total)}</p>
              <p className="text-[10.5px] text-foreground-tertiary">{r.payment_method ?? "—"}</p>
            </>
          ),
        },
        {
          key: "status", className: "shrink-0",
          render: (r) => (
            <span className={`text-[10.5px] px-2 py-1 rounded-full font-semibold ${STATUS_TONE[r.status] ?? "bg-muted text-foreground-secondary"}`}>
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
          ),
        },
      ]}
      searchPlaceholder="ابحث برقم الطلب أو الحالة..."
      empty={{ icon: Activity, title: "لا توجد طلبات بعد", hint: "ستظهر آخر الطلبات هنا فور إنشائها." }}
    />
  );
}
