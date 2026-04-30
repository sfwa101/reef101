import { useEffect, useState } from "react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, Calculator, Scale, Sparkles } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";

type Z = {
  id: string;
  period_start: string; period_end: string;
  inventory_market_value: number; cash_balances: number;
  receivables: number; liabilities: number;
  zakat_base: number; nisab_value: number; zakat_due: number;
  is_above_nisab: boolean; status: string;
  created_at: string;
};

export default function Zakat() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance");
  const [history, setHistory] = useState<Z[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [nisab, setNisab] = useState<number>(50000);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("zakat_assessments").select("*").order("created_at", { ascending: false }).limit(20);
    setHistory((data || []) as Z[]);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed]);

  const compute = async () => {
    setComputing(true);
    try {
      const { data, error } = await (supabase as any).rpc("compute_zakat_assessment", { _nisab_value: nisab });
      if (error) throw error;
      const d = data as any;
      toast.success(d.is_above_nisab ? `الزكاة المستحقة: ${fmtMoney(d.zakat_due)}` : "الوعاء أقل من النصاب");
      load();
    } catch (e: any) { toast.error(e?.message || "فشل"); }
    finally { setComputing(false); }
  };

  if (rolesLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (<><MobileTopbar title="الزكاة" /><div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>للإدارة والمالية فقط</p></div></>);

  const latest = history[0];

  return (
    <>
      <MobileTopbar title="الزكاة الشرعية" />
      <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto space-y-4" dir="rtl">
        <div className="bg-gradient-to-br from-success/15 via-emerald-500/10 to-teal-500/10 rounded-2xl p-4 border border-success/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center text-success">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-[16px]">حاسبة زكاة عروض التجارة</p>
              <p className="text-[11px] text-foreground-tertiary">2.5% سنوياً • تُقوَّم البضاعة بسعر السوق</p>
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[11px] text-foreground-tertiary">قيمة النصاب (ج.م)</label>
              <input type="number" value={nisab} onChange={(e) => setNisab(Number(e.target.value))}
                className="w-full h-10 rounded-lg bg-background/60 px-3 text-[13px] num focus:outline-none focus:ring-2 focus:ring-success/30" />
            </div>
            <button onClick={compute} disabled={computing}
              className="h-10 px-4 rounded-lg bg-success text-success-foreground font-semibold text-[13px] flex items-center gap-1 disabled:opacity-50">
              {computing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />} احسب
            </button>
          </div>
        </div>

        {latest && (
          <div className="bg-surface rounded-2xl p-4 border border-border/40">
            <p className="text-[12px] text-foreground-tertiary mb-2">آخر تقييم • {new Date(latest.created_at).toLocaleDateString("ar-EG")}</p>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <Stat label="قيمة المخزون السوقية" value={fmtMoney(latest.inventory_market_value)} />
              <Stat label="الذمم المدينة" value={fmtMoney(latest.receivables)} />
              <Stat label="الالتزامات" value={fmtMoney(latest.liabilities)} negative />
              <Stat label="الوعاء الزكوي" value={fmtMoney(latest.zakat_base)} />
              <Stat label="النصاب" value={fmtMoney(latest.nisab_value)} />
              <Stat label="الزكاة المستحقة" value={fmtMoney(latest.zakat_due)} highlight />
            </div>
            <div className={`mt-3 p-2 rounded-lg text-[12px] ${latest.is_above_nisab ? "bg-success/10 text-success" : "bg-muted text-foreground-tertiary"}`}>
              {latest.is_above_nisab ? "✓ الوعاء بلغ النصاب — الزكاة واجبة" : "الوعاء أقل من النصاب — لا زكاة هذا العام"}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-display text-[14px]">السجل التاريخي</p>
          {history.slice(1).map((h) => (
            <div key={h.id} className="bg-surface-muted rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-[12px]">{new Date(h.created_at).toLocaleDateString("ar-EG")}</p>
                <p className="text-[10px] text-foreground-tertiary">وعاء: {fmtMoney(h.zakat_base)}</p>
              </div>
              <p className="font-semibold text-[13px]">{fmtMoney(h.zakat_due)}</p>
            </div>
          ))}
        </div>

        <div className="bg-info/5 rounded-xl p-3 border border-info/20 text-[11px] leading-relaxed text-foreground/80">
          <Sparkles className="h-3 w-3 inline ml-1 text-info" />
          <strong>ملاحظة شرعية:</strong> يُحسب الوعاء = (المخزون بسعر السوق + النقد + الذمم المدينة) − الالتزامات الحالة. تجب الزكاة عند بلوغ النصاب وحولان الحول. يُنصح باستشارة فقيه عند الشك.
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, highlight, negative }: any) {
  return (
    <div className={`p-2 rounded-lg ${highlight ? "bg-success/15 border border-success/30" : "bg-surface-muted"}`}>
      <p className="text-[10px] text-foreground-tertiary">{label}</p>
      <p className={`font-semibold num ${highlight ? "text-success" : negative ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
