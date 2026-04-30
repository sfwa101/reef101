import { useEffect, useState } from "react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, ScanSearch, AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";

type Flag = {
  id: string; source_table: string; source_id: string;
  category: string; severity: string; amount: number | null;
  description: string; recommendation: string | null;
  status: string; created_at: string;
};

export default function RibaAudit() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance");
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("flagged");

  const load = async () => {
    setLoading(true);
    let q = (supabase as any).from("riba_audit_log").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q.limit(50);
    setFlags((data || []) as Flag[]);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed, filter]);

  const scan = async () => {
    setScanning(true);
    try {
      const { data, error } = await (supabase as any).rpc("scan_riba_suspicions");
      if (error) throw error;
      const d = data as any;
      toast.success(d.flagged_now > 0 ? `تم رصد ${d.flagged_now} حالة جديدة` : "لا شبهات جديدة — الحمد لله");
      load();
    } catch (e: any) { toast.error(e?.message || "فشل"); }
    finally { setScanning(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("riba_audit_log")
      .update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم"); load(); }
  };

  if (rolesLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (<><MobileTopbar title="مراجعة الربا" /><div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>للإدارة والمالية فقط</p></div></>);

  return (
    <>
      <MobileTopbar title="المراجعة الشرعية للربا" />
      <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto space-y-3" dir="rtl">
        <div className="bg-gradient-to-br from-warning/15 to-amber-500/10 rounded-2xl p-4 border border-warning/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-[15px]">حارس المعاملات الشرعية</p>
              <p className="text-[11px] text-foreground-tertiary">يفحص المصروفات والفواتير لرصد شبهات الربا</p>
            </div>
            <button onClick={scan} disabled={scanning}
              className="h-10 px-3 rounded-lg bg-warning text-warning-foreground text-[13px] font-semibold flex items-center gap-1 disabled:opacity-50">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />} مسح الآن
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {[{ k: "flagged", l: "مفتوحة" }, { k: "reviewed", l: "مراجَعة" }, { k: "dismissed", l: "مرفوضة" }, { k: "all", l: "الكل" }].map((t) => (
            <button key={t.k} onClick={() => setFilter(t.k)}
              className={`px-3 py-1.5 rounded-full text-[12px] ${filter === t.k ? "bg-primary text-primary-foreground" : "bg-surface-muted"}`}>
              {t.l}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {flags.map((f) => {
            const isCrit = f.severity === "critical" || f.severity === "high";
            const Icon = isCrit ? AlertOctagon : AlertTriangle;
            return (
              <div key={f.id} className={`rounded-2xl p-3 border ${isCrit ? "bg-destructive/5 border-destructive/30" : "bg-warning/5 border-warning/30"}`}>
                <div className="flex items-start gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${isCrit ? "text-destructive" : "text-warning"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-snug">{f.description}</p>
                    <p className="text-[10px] text-foreground-tertiary mt-1">
                      {f.source_table} • {f.amount ? fmtMoney(f.amount) : "—"} • {new Date(f.created_at).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
                {f.recommendation && (
                  <div className="bg-background/60 rounded-lg p-2 text-[11px] text-foreground/80 mb-2">
                    <strong>التوصية:</strong> {f.recommendation}
                  </div>
                )}
                {f.status === "flagged" && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(f.id, "reviewed")}
                      className="flex-1 h-8 rounded-lg bg-success/15 text-success text-[12px] font-medium flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> تمت المراجعة
                    </button>
                    <button onClick={() => updateStatus(f.id, "dismissed")}
                      className="flex-1 h-8 rounded-lg bg-muted text-foreground-tertiary text-[12px]">
                      رفض الشبهة
                    </button>
                  </div>
                )}
                {f.status !== "flagged" && (
                  <span className="text-[10px] text-foreground-tertiary">الحالة: {f.status}</span>
                )}
              </div>
            );
          })}
          {flags.length === 0 && (
            <div className="text-center py-12 text-[13px] text-foreground-tertiary">
              <CheckCircle2 className="h-10 w-10 mx-auto text-success mb-2" />
              لا شبهات في هذا الفلتر
            </div>
          )}
        </div>
      </div>
    </>
  );
}
