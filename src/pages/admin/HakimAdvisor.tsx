import { useEffect, useState } from "react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, Sparkles, Send, AlertTriangle, Info, CheckCircle2, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

type Insight = {
  id: string; kind: string; severity: "info" | "warning" | "critical" | "success";
  title: string; summary: string; recommendations: Array<{ action: string; priority: string }>;
  generated_for_date: string; created_at: string; is_read: boolean;
};

const SEV = {
  info: { icon: Info, cls: "from-info/10 to-indigo-500/10 border-info/30 text-info" },
  warning: { icon: AlertTriangle, cls: "from-accent/10 to-orange-500/10 border-accent/30 text-accent" },
  critical: { icon: AlertOctagon, cls: "from-destructive/10 to-red-500/10 border-destructive/30 text-destructive" },
  success: { icon: CheckCircle2, cls: "from-success/10 to-teal-500/10 border-success/30 text-success" },
};

export default function HakimAdvisor() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance") || hasRole("store_manager");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [question, setQuestion] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("hakim_insights").select("*").order("created_at", { ascending: false }).limit(20);
    setInsights((data || []) as Insight[]);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed]);

  const ask = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("hakim-advisor", {
        body: { kind: "on_demand", days: 7, question: question || undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("تم توليد الرؤية");
      setQuestion("");
      load();
    } catch (e: any) {
      toast.error(e?.message || "فشل التوليد");
    } finally {
      setGenerating(false);
    }
  };

  if (rolesLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (<><MobileTopbar title="حكيم AI" /><div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>غير متاح</p></div></>);

  return (
    <>
      <MobileTopbar title="المستشار حكيم" />
      <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto space-y-4" dir="rtl">
        <div className="bg-gradient-to-br from-primary/15 via-primary-glow/10 to-purple-500/10 rounded-2xl p-4 border border-primary/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-[16px]">حكيم — مستشارك المالي</p>
              <p className="text-[11px] text-foreground-tertiary">يحلل بياناتك ويقدم رؤى استباقية</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-background/60 rounded-lg px-3 py-2 text-[13px]"
              placeholder="اسأل حكيم (اختياري) أو اضغط 'تحليل'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button onClick={ask} disabled={generating} className="bg-primary text-primary-foreground rounded-lg px-4 font-medium flex items-center gap-1 disabled:opacity-50">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              تحليل
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {insights.map((it) => {
            const sev = SEV[it.severity] || SEV.info;
            const Icon = sev.icon;
            return (
              <div key={it.id} className={`rounded-2xl p-4 border bg-gradient-to-br ${sev.cls}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5" />
                  <p className="font-display text-[15px] flex-1">{it.title}</p>
                  <span className="text-[10px] text-foreground-tertiary">{new Date(it.created_at).toLocaleDateString("ar-EG")}</span>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">{it.summary}</p>
                {it.recommendations && it.recommendations.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[11px] font-medium text-foreground-tertiary">التوصيات:</p>
                    {it.recommendations.map((r, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[12px] bg-background/40 rounded-lg p-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${r.priority === "high" ? "bg-destructive/20 text-destructive" : r.priority === "medium" ? "bg-accent/20 text-accent" : "bg-muted"}`}>
                          {r.priority === "high" ? "عاجل" : r.priority === "medium" ? "متوسط" : "منخفض"}
                        </span>
                        <span className="flex-1">{r.action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {insights.length === 0 && <p className="text-center text-foreground-tertiary py-12 text-[13px]">لا توجد رؤى بعد. اضغط "تحليل" لبدء أول تقرير.</p>}
        </div>
      </div>
    </>
  );
}
