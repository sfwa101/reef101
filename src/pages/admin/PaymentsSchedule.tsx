import { useEffect, useState } from "react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { Loader2, ShieldAlert, CalendarClock, AlertTriangle } from "lucide-react";

type Row = {
  id: string; invoice_number: string | null; invoice_date: string; due_date: string | null;
  total: number; paid_amount: number; remaining: number; status: string;
  supplier_id: string; supplier_name: string; closing_day: number | null; collection_days: number[] | null;
};

export default function PaymentsSchedule() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance") || hasRole("store_manager");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc("payments_schedule", { _days_ahead: days });
      if (!error) setRows((data || []) as Row[]);
      setLoading(false);
    })();
  }, [allowed, days]);

  if (rolesLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (<><MobileTopbar title="جدولة المدفوعات" /><div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>غير متاح</p></div></>);

  const total = rows.reduce((s, r) => s + Number(r.remaining || 0), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <MobileTopbar title="جدولة المدفوعات" />
      <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto space-y-4" dir="rtl">
        <div className="bg-gradient-to-br from-destructive/10 to-accent/10 rounded-2xl p-4 border border-destructive/20">
          <p className="text-[12px] text-foreground-tertiary">إجمالي مستحق خلال {days} يوم</p>
          <p className="font-display text-[24px] mt-1">{fmtMoney(total)}</p>
        </div>

        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-[12px] ${days === d ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {d} يوم
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {rows.map((r) => {
            const overdue = r.due_date && r.due_date < today;
            return (
              <div key={r.id} className={`rounded-xl p-3 border flex items-center gap-3 ${overdue ? "bg-destructive/5 border-destructive/40" : "bg-surface border-border/40"}`}>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${overdue ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
                  {overdue ? <AlertTriangle className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[14px] truncate">{r.supplier_name}</p>
                  <p className="text-[11px] text-foreground-tertiary">
                    استحقاق: {r.due_date || "—"} {r.closing_day ? `• تقفيل ${r.closing_day}` : ""}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-display text-[14px] text-destructive">{fmtMoney(r.remaining)}</p>
                  {overdue && <p className="text-[10px] text-destructive">متأخر</p>}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <p className="text-center text-foreground-tertiary py-8 text-[13px]">لا توجد مدفوعات مستحقة</p>}
        </div>
      </div>
    </>
  );
}
