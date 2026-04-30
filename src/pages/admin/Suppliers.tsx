import { useEffect, useState } from "react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { Loader2, ShieldAlert, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

type Supplier = {
  id: string;
  name: string;
  contact_phone: string | null;
  closing_day: number | null;
  collection_days: number[] | null;
  outstanding_balance: number;
  total_purchased: number;
  total_paid: number;
  is_active: boolean;
};

export default function Suppliers() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance") || hasRole("store_manager");
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contact_phone: "", closing_day: "", collection_days: "", payment_terms_days: "30" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("suppliers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data || []) as Supplier[]);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed]);

  const create = async () => {
    if (!form.name.trim()) return toast.error("الاسم مطلوب");
    const days = form.collection_days.split(",").map((s) => parseInt(s.trim())).filter((n) => Number.isFinite(n));
    const { error } = await (supabase as any).from("suppliers").insert({
      name: form.name.trim(),
      contact_phone: form.contact_phone || null,
      closing_day: form.closing_day ? parseInt(form.closing_day) : null,
      collection_days: days,
      payment_terms_days: parseInt(form.payment_terms_days) || 30,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إضافة المورد");
    setForm({ name: "", contact_phone: "", closing_day: "", collection_days: "", payment_terms_days: "30" });
    setShowForm(false);
    load();
  };

  if (rolesLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (
    <><MobileTopbar title="الموردون" />
      <div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>متاح للمالية والإدارة فقط</p></div>
    </>
  );

  const totalOutstanding = rows.reduce((s, r) => s + Number(r.outstanding_balance || 0), 0);

  return (
    <>
      <MobileTopbar title="الموردون" />
      <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto space-y-4" dir="rtl">
        <div className="bg-gradient-to-br from-primary/10 to-primary-glow/10 rounded-2xl p-4 border border-primary/20">
          <p className="text-[12px] text-foreground-tertiary">إجمالي المستحقات للموردين</p>
          <p className="font-display text-[24px] mt-1">{fmtMoney(totalOutstanding)}</p>
          <p className="text-[12px] text-foreground-tertiary mt-1">{rows.length} مورد</p>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> {showForm ? "إخفاء" : "إضافة مورد"}
        </button>

        {showForm && (
          <div className="bg-surface rounded-2xl p-4 border border-border/40 space-y-2">
            <input className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="اسم المورد" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="هاتف" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <input className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="يوم التقفيل (1-31)" value={form.closing_day} onChange={(e) => setForm({ ...form, closing_day: e.target.value })} />
            <input className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="أيام التحصيل (مثال: 5,15,25)" value={form.collection_days} onChange={(e) => setForm({ ...form, collection_days: e.target.value })} />
            <input className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="مهلة الدفع (أيام)" value={form.payment_terms_days} onChange={(e) => setForm({ ...form, payment_terms_days: e.target.value })} />
            <button onClick={create} className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium">حفظ</button>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="bg-surface rounded-xl p-3 border border-border/40 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Building2 className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[14px] truncate">{r.name}</p>
                <p className="text-[11px] text-foreground-tertiary">
                  تقفيل: {r.closing_day ?? "-"} • تحصيل: {(r.collection_days || []).join("/") || "-"}
                </p>
              </div>
              <div className="text-left">
                <p className="font-display text-[14px] text-destructive">{fmtMoney(r.outstanding_balance)}</p>
                <p className="text-[10px] text-foreground-tertiary">مستحق</p>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-center text-foreground-tertiary py-8 text-[13px]">لا يوجد موردون بعد</p>}
        </div>
      </div>
    </>
  );
}
