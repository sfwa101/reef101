import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Activity, User, Clock } from "lucide-react";
import { UniversalAdminGrid } from "@/components/admin/UniversalAdminGrid";

type AuditRow = {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
};

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function AuditLogPage() {
  return (
    <UniversalAdminGrid<AuditRow>
      title="سجل المراقبة السيادي"
      subtitle="عرض جميع العمليات الإدارية الحساسة (للقراءة فقط)"
      metrics={[
        {
          key: "total",
          label: "إجمالي العمليات",
          icon: Activity,
          tone: "primary",
          compute: (rows) => rows.length,
        },
        {
          key: "today",
          label: "اليوم",
          icon: Clock,
          tone: "info",
          compute: (rows) => {
            const today = new Date().toDateString();
            return rows.filter((r) => new Date(r.created_at).toDateString() === today).length;
          },
        },
        {
          key: "users",
          label: "مستخدمون نشطون",
          icon: User,
          tone: "success",
          compute: (rows) => new Set(rows.map((r) => r.user_id).filter(Boolean)).size,
        },
        {
          key: "shield",
          label: "الحماية",
          icon: ShieldCheck,
          tone: "purple",
          compute: () => "نشطة",
        },
      ]}
      dataSource={{
        table: "audit_logs",
        select: "*",
        orderBy: { column: "created_at", ascending: false },
        limit: 500,
        searchKeys: ["user_name", "action", "entity"],
      }}
      searchPlaceholder="بحث باسم المستخدم أو نوع العملية..."
      columns={[
        {
          key: "user",
          label: "المستخدم",
          className: "flex-1 min-w-0",
          render: (r) => (
            <div className="min-w-0">
              <p className="font-display text-[14px] truncate">{r.user_name || "غير معروف"}</p>
              <p className="text-[11px] text-foreground-tertiary truncate">{r.user_id?.slice(0, 8) || "—"}</p>
            </div>
          ),
        },
        {
          key: "action",
          label: "العملية",
          className: "flex-1 min-w-0",
          render: (r) => (
            <div className="min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-lg bg-primary-soft text-primary text-[11.5px] font-semibold">
                {r.action}
              </span>
              {r.entity && (
                <p className="text-[11px] text-foreground-tertiary mt-1 truncate">{r.entity}</p>
              )}
            </div>
          ),
        },
        {
          key: "time",
          label: "الوقت",
          hideOnMobile: true,
          className: "shrink-0 text-left w-32",
          render: (r) => <span className="text-[12px] text-foreground-secondary num">{fmtDate(r.created_at)}</span>,
        },
      ]}
      empty={{
        icon: ShieldCheck,
        title: "لا توجد عمليات مسجلة",
        hint: "ستظهر هنا جميع العمليات الإدارية الحساسة بمجرد حدوثها",
      }}
    />
  );
}

export const Route = createFileRoute("/admin/audit-log")({
  component: AuditLogPage,
});
