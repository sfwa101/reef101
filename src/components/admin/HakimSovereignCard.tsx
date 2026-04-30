import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, ArrowLeft, Wallet, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";

type Stats = {
  period_days: number;
  orders_count: number;
  gross_sales: number;
  items_revenue: number;
  items_cost: number;
  net_profit: number;
  profit_margin_pct: number;
  top_categories: { category: string; revenue: number; units: number }[];
  low_stock_count: number;
};

type Pulse = { tone: "good" | "warn" | "bad"; text: string };

export function HakimSovereignCard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(30);
  const [open, setOpen] = useState(false);
  const [pulseIdx, setPulseIdx] = useState(0);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportText, setReportText] = useState<string>("");

  // KPIs
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("executive_dashboard_stats", { _days: days })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: any) => { if (data) setStats(data as Stats); });
  }, [days]);

  const pulses: Pulse[] = (() => {
    if (!stats) return [{ tone: "good", text: "🌿 جاري قراءة بيانات اليوم..." }];
    const arr: Pulse[] = [];
    if (stats.profit_margin_pct >= 20) arr.push({ tone: "good", text: `🟢 هامش الربح ${stats.profit_margin_pct}% — أعلى من المعدل` });
    else if (stats.profit_margin_pct >= 10) arr.push({ tone: "warn", text: `🟠 الهامش ${stats.profit_margin_pct}% — قابل للتحسين` });
    else arr.push({ tone: "bad", text: `🔴 الهامش ${stats.profit_margin_pct}% — مخاطر تآكل` });
    if (stats.orders_count > 0) arr.push({ tone: "good", text: `🟢 ${stats.orders_count} طلباً خلال ${stats.period_days} يوم` });
    if (stats.low_stock_count > 0) arr.push({ tone: "warn", text: `🟠 تنبيه: ${stats.low_stock_count} منتج قارب على النفاد` });
    if (stats.top_categories?.[0]) arr.push({ tone: "good", text: `🌟 ${stats.top_categories[0].category} في الصدارة` });
    return arr;
  })();

  useEffect(() => {
    const t = setInterval(() => setPulseIdx((i) => (i + 1) % pulses.length), 4500);
    return () => clearInterval(t);
  }, [pulses.length]);

  const liabilities = (stats?.items_cost ?? 0); // placeholder proxy — pending purchase invoices
  const pulse = pulses[pulseIdx];
  const pulseColor = pulse.tone === "good" ? "text-emerald-300" : pulse.tone === "warn" ? "text-amber-300" : "text-rose-300";

  const openReport = async () => {
    setOpen(true);
    if (reportText) return;
    setReportLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hakim-advisor`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({}),
      });
      if (resp.ok) {
        const j = await resp.json();
        setReportText(j.report || j.content || j.text || "تعذّر إنشاء التقرير الآن.");
      } else {
        setReportText("تعذّر إنشاء التقرير الآن. حاول لاحقاً.");
      }
    } catch {
      setReportText("تعذّر إنشاء التقرير الآن.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openReport}
        className="w-full text-right group relative overflow-hidden rounded-3xl p-5 lg:p-6 text-white transition-all hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.6)] active:scale-[0.995]"
        style={{
          background: "linear-gradient(135deg, hsl(230 45% 14%) 0%, hsl(245 50% 22%) 45%, hsl(265 55% 30%) 100%)",
        }}
      >
        {/* Glassmorphism orbs */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-[hsl(265_70%_55%)] opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-[hsl(195_70%_55%)] opacity-25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-[15px] leading-tight">المستشار حكيم</p>
                <p className="text-[10.5px] opacity-70 leading-tight">مركز القيادة الذكي</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur rounded-full p-0.5 border border-white/15">
              {[7, 30, 90].map((d) => (
                <span
                  key={d}
                  onClick={(e) => { e.stopPropagation(); setDays(d); }}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] cursor-pointer transition ${days === d ? "bg-white text-[hsl(245_50%_22%)] font-bold" : "opacity-70 hover:opacity-100"}`}
                >
                  {d} يوم
                </span>
              ))}
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 lg:gap-5 mb-4">
            <KpiBlock label="إجمالي الإيرادات" value={fmtMoney(stats?.gross_sales ?? 0)} icon={Coins} />
            <KpiBlock label="صافي الربح المُقدّر" value={fmtMoney(stats?.net_profit ?? 0)} icon={TrendingUp} accent />
            <KpiBlock label="الالتزامات" value={fmtMoney(liabilities)} icon={Wallet} />
          </div>

          {/* AI Pulse line */}
          <div className="flex items-center justify-between gap-3 bg-white/5 backdrop-blur rounded-xl px-3 py-2 border border-white/10">
            <p className={`text-[12px] font-medium leading-tight transition-all ${pulseColor}`} key={pulseIdx} style={{ animation: "fadeInUp 0.4s ease" }}>
              {pulse.text}
            </p>
            <div className="flex items-center gap-1 text-[10.5px] opacity-80 shrink-0 group-hover:opacity-100 transition">
              <span>التقرير الكامل</span>
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition" />
            </div>
          </div>
        </div>

        <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </button>

      {/* Full report drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto p-0" dir="rtl">
          <div className="bg-gradient-to-br from-[hsl(230_45%_14%)] via-[hsl(245_50%_22%)] to-[hsl(265_55%_30%)] text-white p-5 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-[20px]">تقرير حكيم التفصيلي</h2>
                <p className="text-[11px] opacity-70">آخر {stats?.period_days ?? days} يوم</p>
              </div>
            </div>

            {/* Period filter */}
            <div className="flex gap-1 mt-3 bg-white/10 rounded-xl p-1 border border-white/10 w-fit">
              {[7, 30, 90].map((d) => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-3 h-7 rounded-lg text-[11px] transition ${days === d ? "bg-white text-[hsl(245_50%_22%)] font-bold" : "opacity-70"}`}>
                  {d} يوم
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Big KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="الإيرادات" value={fmtMoney(stats?.gross_sales ?? 0)} icon={Coins} tone="from-primary to-primary-glow" />
              <KpiCard label="صافي الربح" value={fmtMoney(stats?.net_profit ?? 0)} icon={TrendingUp} tone="from-[hsl(var(--success))] to-[hsl(var(--teal))]" />
              <KpiCard label="هامش الربح" value={`${stats?.profit_margin_pct ?? 0}%`} icon={TrendingUp} tone="from-[hsl(var(--purple))] to-[hsl(var(--pink))]" />
              <KpiCard label="الطلبات" value={String(stats?.orders_count ?? 0)} icon={TrendingUp} tone="from-[hsl(var(--info))] to-[hsl(var(--indigo))]" />
            </div>

            {/* Top categories */}
            <div className="bg-surface rounded-2xl border border-border/50 p-4 shadow-soft">
              <h3 className="font-display text-[15px] mb-3">أعلى الفئات أداءً</h3>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={(stats?.top_categories ?? []).slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="category" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost vs revenue mini area */}
            <div className="bg-surface rounded-2xl border border-border/50 p-4 shadow-soft">
              <h3 className="font-display text-[15px] mb-3">الإيرادات مقابل التكاليف</h3>
              <div className="h-44">
                <ResponsiveContainer>
                  <AreaChart data={[
                    { name: "إيرادات", value: stats?.items_revenue ?? 0 },
                    { name: "تكاليف", value: stats?.items_cost ?? 0 },
                    { name: "ربح صافي", value: stats?.net_profit ?? 0 },
                  ]}>
                    <defs>
                      <linearGradient id="rep-rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#rep-rev)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hakim AI narrative */}
            <div className="bg-gradient-to-br from-[hsl(var(--purple))]/5 to-[hsl(var(--info))]/5 border border-[hsl(var(--purple))]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[hsl(var(--purple))] to-[hsl(var(--info))] text-white flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-display text-[14px]">تحليل حكيم</h3>
              </div>
              {reportLoading ? (
                <div className="flex items-center gap-2 text-[12px] text-foreground-tertiary py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> يحلّل البيانات...
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-[12.5px] leading-relaxed [&_h2]:font-display [&_h2]:text-[14px] [&_h2]:mt-3 [&_h2]:mb-1 [&_strong]:text-primary [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                  <ReactMarkdown>{reportText || "اضغط لتحديث التقرير..."}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function KpiBlock({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 opacity-70">
        <Icon className="h-3 w-3" />
        <span className="text-[10px]">{label}</span>
      </div>
      <p className={`font-display num leading-tight tracking-tight ${accent ? "text-[20px] sm:text-[22px] lg:text-[26px] text-emerald-300" : "text-[18px] sm:text-[20px] lg:text-[24px]"}`}>
        {value}
      </p>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-border/40 p-3.5 shadow-soft">
      <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${tone} flex items-center justify-center text-white mb-2`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] text-foreground-tertiary">{label}</p>
      <p className="font-display text-[18px] num">{value}</p>
    </div>
  );
}
