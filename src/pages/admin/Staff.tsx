import { Users, ShieldCheck, Truck, Store } from "lucide-react";
import { UniversalAdminGrid } from "@/components/admin/UniversalAdminGrid";
import { fmtNum } from "@/lib/format";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "مدير عام",
  admin: "مدير",
  branch_manager: "مدير فرع",
  cashier: "كاشير",
  driver: "مندوب",
  inventory_clerk: "أمين مخزن",
  vendor: "تاجر",
  user: "عميل",
};

const ROLE_TONE: Record<string, string> = {
  super_admin: "bg-primary/15 text-primary",
  admin: "bg-primary/15 text-primary",
  branch_manager: "bg-info/15 text-info",
  cashier: "bg-warning/15 text-warning",
  driver: "bg-[hsl(var(--purple))]/15 text-[hsl(var(--purple))]",
  inventory_clerk: "bg-success/15 text-success",
  vendor: "bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]",
};

export default function StaffAdmin() {
  return (
    <UniversalAdminGrid
      title="الموظفون"
      subtitle="جميع المستخدمين الذين يحملون أدواراً تشغيلية"
      dataSource={{
        table: "user_roles",
        select: "id,user_id,role,is_active,created_at,branch_id",
        orderBy: { column: "created_at", ascending: false },
        searchKeys: ["role"],
      }}
      metrics={[
        { key: "total", label: "إجمالي الموظفين", icon: Users, tone: "primary",
          compute: (rows) => fmtNum(rows.filter((r: any) => r.is_active).length) },
        { key: "drivers", label: "المندوبون", icon: Truck, tone: "purple",
          compute: (rows) => fmtNum(rows.filter((r: any) => r.role === "driver").length) },
        { key: "cashiers", label: "الكاشيرز", icon: Store, tone: "warning",
          compute: (rows) => fmtNum(rows.filter((r: any) => r.role === "cashier").length) },
        { key: "managers", label: "المدراء", icon: ShieldCheck, tone: "info",
          compute: (rows) => fmtNum(rows.filter((r: any) => ["admin","super_admin","branch_manager"].includes(r.role)).length) },
      ]}
      columns={[
        { key: "user_id", className: "flex-1", render: (r: any) => (
          <>
            <p className="text-[13px] font-mono">{String(r.user_id).slice(0, 8)}…</p>
            <p className="text-[11px] text-foreground-tertiary">منذ {new Date(r.created_at).toLocaleDateString("ar-EG")}</p>
          </>
        ) },
        { key: "role", className: "shrink-0", render: (r: any) => (
          <span className={`text-[10.5px] px-2 py-1 rounded-full font-semibold ${ROLE_TONE[r.role] ?? "bg-muted text-foreground-secondary"}`}>
            {ROLE_LABEL[r.role] ?? r.role}
          </span>
        ) },
        { key: "is_active", className: "shrink-0", hideOnMobile: true, render: (r: any) => (
          <span className={`text-[10.5px] px-2 py-1 rounded-full font-semibold ${r.is_active ? "bg-success/15 text-success" : "bg-muted text-foreground-tertiary"}`}>
            {r.is_active ? "نشط" : "موقوف"}
          </span>
        ) },
      ]}
      searchPlaceholder="ابحث بالدور..."
      empty={{ title: "لا يوجد موظفون", hint: "أضف أدواراً للمستخدمين من إعدادات الصلاحيات." }}
    />
  );
}
