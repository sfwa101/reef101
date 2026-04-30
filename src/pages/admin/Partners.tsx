import { useEffect, useState } from "react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { Loader2, ShieldAlert, Plus, Users } from "lucide-react";
import { toast } from "sonner";

type Product = { id: string; name: string };
type Partner = {
  id: string; product_id: string; partner_name: string; partner_phone: string | null;
  split_type: "gross_profit" | "net_profit" | "revenue"; percentage: number; is_active: boolean;
  products?: { name: string };
};
type Ledger = {
  id: string; partner_name: string; product_name: string | null; amount_due: number;
  status: string; created_at: string; split_type: string; percentage: number;
};

export default function Partners() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance");
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: "", partner_name: "", partner_phone: "", split_type: "net_profit", percentage: "10" });

  const load = async () => {
    setLoading(true);
    const [p, pp, pl] = await Promise.all([
      (supabase as any).from("products").select("id,name").eq("is_active", true).order("name").limit(500),
      (supabase as any).from("product_partners").select("*, products(name)").order("created_at", { ascending: false }),
      (supabase as any).from("partner_ledgers").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setProducts((p.data || []) as Product[]);
    setPartners((pp.data || []) as Partner[]);
    setLedger((pl.data || []) as Ledger[]);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed]);

  const create = async () => {
    if (!form.product_id || !form.partner_name) return toast.error("الحقول مطلوبة");
    const pct = parseFloat(form.percentage);
    if (!(pct > 0 && pct <= 100)) return toast.error("نسبة غير صالحة");
    const { error } = await (supabase as any).from("product_partners").insert({
      product_id: form.product_id,
      partner_name: form.partner_name.trim(),
      partner_phone: form.partner_phone || null,
      split_type: form.split_type,
      percentage: pct,
    });
    if (error) return toast.error(error.message);
    toast.success("تم");
    setForm({ product_id: "", partner_name: "", partner_phone: "", split_type: "net_profit", percentage: "10" });
    setShowForm(false);
    load();
  };

  const togglePartner = async (id: string, current: boolean) => {
    await (supabase as any).from("product_partners").update({ is_active: !current }).eq("id", id);
    load();
  };

  const markPaid = async (id: string) => {
    await (supabase as any).from("partner_ledgers").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    toast.success("تم تسجيل الدفع");
    load();
  };

  if (rolesLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (<><MobileTopbar title="الشركاء" /><div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>غير متاح</p></div></>);

  const totalDue = ledger.filter((l) => l.status === "accrued").reduce((s, l) => s + Number(l.amount_due || 0), 0);

  return (
    <>
      <MobileTopbar title="شركاء المنتجات" />
      <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto space-y-4" dir="rtl">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20">
          <p className="text-[12px] text-foreground-tertiary">مستحقات الشركاء (لم تُدفع)</p>
          <p className="font-display text-[24px] mt-1">{fmtMoney(totalDue)}</p>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> {showForm ? "إخفاء" : "إضافة شريك لمنتج"}
        </button>

        {showForm && (
          <div className="bg-surface rounded-2xl p-4 border border-border/40 space-y-2">
            <select className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">— اختر منتج —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="اسم الشريك" value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })} />
            <input className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="هاتف" value={form.partner_phone} onChange={(e) => setForm({ ...form, partner_phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="bg-muted rounded-lg px-3 py-2 text-[14px]" value={form.split_type} onChange={(e) => setForm({ ...form, split_type: e.target.value })}>
                <option value="net_profit">صافي الربح</option>
                <option value="gross_profit">إجمالي الربح</option>
                <option value="revenue">الإيراد</option>
              </select>
              <input className="bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="نسبة %" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} />
            </div>
            <button onClick={create} className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium">حفظ</button>
          </div>
        )}

        <div>
          <p className="text-[12px] font-medium text-foreground-tertiary px-1 mb-2">الشركاء النشطون</p>
          <div className="space-y-2">
            {partners.map((p) => (
              <div key={p.id} className="bg-surface rounded-xl p-3 border border-border/40 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Users className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[14px] truncate">{p.partner_name}</p>
                  <p className="text-[11px] text-foreground-tertiary truncate">{p.products?.name} • {p.percentage}% من {p.split_type === "net_profit" ? "صافي الربح" : p.split_type === "gross_profit" ? "إجمالي الربح" : "الإيراد"}</p>
                </div>
                <button onClick={() => togglePartner(p.id, p.is_active)} className={`text-[11px] px-2 py-1 rounded-lg ${p.is_active ? "bg-success/10 text-success" : "bg-muted text-foreground-tertiary"}`}>
                  {p.is_active ? "نشط" : "موقوف"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[12px] font-medium text-foreground-tertiary px-1 mb-2">آخر المستحقات</p>
          <div className="space-y-2">
            {ledger.map((l) => (
              <div key={l.id} className="bg-surface rounded-xl p-3 border border-border/40 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[13px] truncate">{l.partner_name}</p>
                  <p className="text-[11px] text-foreground-tertiary truncate">{l.product_name} • {new Date(l.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
                <p className="font-display text-[13px]">{fmtMoney(l.amount_due)}</p>
                {l.status === "accrued" ? (
                  <button onClick={() => markPaid(l.id)} className="text-[11px] px-2 py-1 rounded-lg bg-primary/10 text-primary">دفع</button>
                ) : (
                  <span className="text-[11px] px-2 py-1 rounded-lg bg-success/10 text-success">{l.status === "paid" ? "مدفوع" : l.status}</span>
                )}
              </div>
            ))}
            {ledger.length === 0 && <p className="text-center text-foreground-tertiary py-6 text-[13px]">لا توجد مستحقات بعد</p>}
          </div>
        </div>
      </div>
    </>
  );
}
