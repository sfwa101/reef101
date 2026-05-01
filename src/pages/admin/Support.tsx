import { LifeBuoy, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UniversalAdminGrid, type Column, type RowAction } from "@/components/admin/UniversalAdminGrid";
import { fmtNum } from "@/lib/format";

type Ticket = {
  id: string;
  ticket_number: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  subject: string;
  message: string | null;
  status: string;
  priority: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "محلولة",
  closed: "مغلقة",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/20",
  in_progress: "bg-primary-soft text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const columns: Column<Ticket>[] = [
  {
    key: "info",
    label: "التذكرة",
    render: (t) => (
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold truncate">{t.subject}</p>
        <p className="text-[11px] text-foreground-tertiary truncate">
          {t.ticket_number} · {t.customer_name ?? t.customer_phone ?? "—"}
        </p>
      </div>
    ),
  },
  {
    key: "status",
    label: "الحالة",
    className: "shrink-0",
    render: (t) => (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
          STATUS_TONE[t.status] ?? STATUS_TONE.open
        }`}
      >
        {STATUS_LABEL[t.status] ?? t.status}
      </span>
    ),
  },
];

export default function Support() {
  const rowActions: RowAction<Ticket>[] = [
    {
      label: "إغلاق",
      tone: "success",
      icon: CheckCircle2,
      onClick: async (row) => {
        if (row.status === "resolved" || row.status === "closed") {
          toast.info("التذكرة مغلقة بالفعل");
          return;
        }
        const { error } = await (supabase as any)
          .from("support_tickets")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (error) {
          toast.error("تعذر إغلاق التذكرة");
          return;
        }
        toast.success("تم حل التذكرة ✅");
        // Soft refresh
        setTimeout(() => window.location.reload(), 400);
      },
    },
  ];

  return (
    <UniversalAdminGrid<Ticket>
      title="الدعم الفني"
      subtitle="مركز تذاكر العملاء والشكاوى"
      metrics={[
        {
          key: "total",
          label: "إجمالي التذاكر",
          icon: MessageSquare,
          tone: "primary",
          compute: (rows) => fmtNum(rows.length),
        },
        {
          key: "open",
          label: "تذاكر مفتوحة",
          icon: AlertCircle,
          tone: "warning",
          compute: (rows) =>
            fmtNum(rows.filter((t: Ticket) => t.status === "open").length),
          urgent: (rows) => rows.filter((t: Ticket) => t.status === "open").length > 0,
        },
        {
          key: "in_progress",
          label: "قيد المعالجة",
          icon: LifeBuoy,
          tone: "info",
          compute: (rows) =>
            fmtNum(rows.filter((t: Ticket) => t.status === "in_progress").length),
        },
        {
          key: "resolved",
          label: "محلولة",
          icon: CheckCircle2,
          tone: "success",
          compute: (rows) =>
            fmtNum(
              rows.filter((t: Ticket) => t.status === "resolved" || t.status === "closed").length,
            ),
        },
      ]}
      columns={columns}
      rowActions={rowActions}
      dataSource={{
        table: "support_tickets",
        select:
          "id,ticket_number,user_id,customer_name,customer_phone,subject,message,status,priority,created_at",
        orderBy: { column: "created_at", ascending: false },
        searchKeys: ["ticket_number", "subject", "customer_name", "customer_phone", "status"],
      }}
      searchPlaceholder="بحث برقم التذكرة أو الاسم..."
      empty={{
        icon: LifeBuoy,
        title: "لا توجد تذاكر دعم",
        hint: "ستظهر هنا شكاوى العملاء وطلبات المساعدة",
      }}
    />
  );
}
