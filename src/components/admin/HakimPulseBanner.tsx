import { useEffect, useState } from "react";
import { Sparkles, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function HakimPulseBanner({
  metrics, page = "finance", onChat,
}: { metrics: Record<string, any>; page?: string; onChat?: () => void }) {
  const [pulse, setPulse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Stable signature so we don't refetch on every render
  const sig = JSON.stringify(metrics);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const { data, error } = await supabase.functions.invoke("hakim-pulse", {
          body: { metrics, page },
        });
        if (cancelled) return;
        if (error) throw error;
        if ((data as any)?.error === "rate_limited") setErr("الطلبات كثيرة، حاول بعد دقيقة.");
        else if ((data as any)?.error === "credits_exhausted") setErr("نفد رصيد الذكاء الاصطناعي.");
        else setPulse((data as any)?.pulse ?? "");
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "تعذر قراءة النبضة");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, page]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-[hsl(var(--purple))]/8 p-4 lg:p-5 shadow-soft">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.12),transparent_55%)] pointer-events-none" />
      <div className="relative flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--purple))] text-white flex items-center justify-center shadow-md shrink-0">
          <Sparkles className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-[14px]">نبضة حكيم</span>
            <span className="text-[10px] bg-success/15 text-success rounded-full px-2 py-0.5 font-semibold">مباشر</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-[13px] text-foreground-tertiary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              يقرأ حكيم الأرقام الآن…
            </div>
          ) : err ? (
            <p className="text-[12.5px] text-destructive">{err}</p>
          ) : (
            <p className="text-[13.5px] leading-relaxed text-foreground-secondary">{pulse || "—"}</p>
          )}
        </div>
        {onChat && (
          <button
            onClick={onChat}
            className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold bg-primary text-primary-foreground rounded-full px-3 py-1.5 shadow-sm hover:shadow-md press"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            اسأل حكيم
          </button>
        )}
      </div>
    </div>
  );
}
