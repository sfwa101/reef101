import { ShieldCheck, ShieldAlert, ShieldX, Clock } from "lucide-react";
import { UniversalAdminGrid } from "@/components/admin/UniversalAdminGrid";
import { supabase } from "@/integrations/supabase/client";
import { fmtNum } from "@/lib/format";
import { toast } from "sonner";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "بانتظار", cls: "bg-warning/15 text-warning" },
  approved: { label: "موثّق", cls: "bg-success/15 text-success" },
  rejected: { label: "مرفوض", cls: "bg-destructive/10 text-destructive" },
};

export default function KycAdmin() {
  const update = async (id: string, status: "approved" | "rejected") => {
    const { error } = await (supabase as any)
      .from("kyc_verifications")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("فشل التحديث");
    else { toast.success(status === "approved" ? "تم التوثيق" : "تم الرفض"); setTimeout(() => location.reload(), 400); }
  };

  return (
    <UniversalAdminGrid
      title="التحقق KYC"
      subtitle="مراجعة طلبات توثيق الهوية الوطنية"
      dataSource={{
        table: "kyc_verifications",
        select: "id,user_id,national_id,status,submitted_at,reviewed_at",
        orderBy: { column: "submitted_at", ascending: false },
        searchKeys: ["national_id", "status"],
      }}
      metrics={[
        { key: "pending", label: "قيد المراجعة", icon: Clock, tone: "warning",
          compute: (rows) => fmtNum(rows.filter((r: any) => r.status === "pending").length),
          urgent: (rows) => rows.some((r: any) => r.status === "pending") },
        { key: "approved", label: "موثّقون", icon: ShieldCheck, tone: "success",
          compute: (rows) => fmtNum(rows.filter((r: any) => r.status === "approved").length) },
        { key: "rejected", label: "مرفوضون", icon: ShieldX, tone: "accent",
          compute: (rows) => fmtNum(rows.filter((r: any) => r.status === "rejected").length) },
        { key: "total", label: "إجمالي الطلبات", icon: ShieldAlert, tone: "info",
          compute: (rows) => fmtNum(rows.length) },
      ]}
      columns={[
        { key: "national_id", className: "flex-1", render: (r: any) => (
          <>
            <p className="text-[13.5px] font-medium font-mono">{r.national_id ?? "—"}</p>
            <p className="text-[11px] text-foreground-tertiary">{new Date(r.submitted_at).toLocaleDateString("ar-EG")}</p>
          </>
        ) },
        { key: "status", className: "shrink-0", render: (r: any) => {
          const s = STATUS[r.status] ?? STATUS.pending;
          return <span className={`text-[10.5px] px-2 py-1 rounded-full font-semibold ${s.cls}`}>{s.label}</span>;
        } },
      ]}
      rowActions={[
        { label: "توثيق", tone: "success", onClick: (r: any) => update(r.id, "approved") },
        { label: "رفض", tone: "destructive", onClick: (r: any) => update(r.id, "rejected") },
      ]}
      searchPlaceholder="ابحث برقم الهوية..."
      empty={{ title: "لا توجد طلبات توثيق", hint: "ستظهر هنا فور تقديمها." }}
    />
  );
}
