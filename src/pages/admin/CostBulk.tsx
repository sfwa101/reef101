import { useEffect, useMemo, useState } from "react";
import { Search, Save, Loader2, Filter, Calculator, AlertTriangle } from "lucide-react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { refetchProducts } from "@/lib/products";

type Row = {
  id: string;
  name: string;
  source: string;
  category: string;
  price: number;
  cost_price: number | null;
  affiliate_commission_pct: number;
};

type EditState = { cost: string; aff: string };

export default function CostBulk() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "missing" | "set">("missing");
  const [source, setSource] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setRows(null);
    const { data } = await supabase
      .from("products")
      .select("id,name,source,category,price,cost_price,affiliate_commission_pct")
      .order("source").order("name").limit(2000);
    setRows((data ?? []) as Row[]);
    setEdits({});
  };
  useEffect(() => { load(); }, []);

  const sources = useMemo(() => {
    const s = new Set<string>();
    (rows ?? []).forEach((r) => s.add(r.source));
    return ["all", ...Array.from(s).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    let r = rows;
    if (source !== "all") r = r.filter((x) => x.source === source);
    if (filter === "missing") r = r.filter((x) => !x.cost_price || Number(x.cost_price) <= 0);
    if (filter === "set") r = r.filter((x) => x.cost_price && Number(x.cost_price) > 0);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(t));
    }
    return r;
  }, [rows, q, filter, source]);

  const stats = useMemo(() => {
    if (!rows) return { total: 0, set: 0, missing: 0 };
    const set = rows.filter((r) => r.cost_price && Number(r.cost_price) > 0).length;
    return { total: rows.length, set, missing: rows.length - set };
  }, [rows]);

  const setEdit = (id: string, k: keyof EditState, v: string) => {
    setEdits((e) => ({ ...e, [id]: { ...e[id], [k]: v } as EditState }));
  };

  const dirty = useMemo(() => Object.keys(edits).filter((id) => {
    const e = edits[id];
    return (e.cost !== undefined && e.cost !== "") || (e.aff !== undefined && e.aff !== "");
  }), [edits]);

  const applyMargin = (target: number) => {
    if (!filtered) return;
    const next = { ...edits };
    filtered.forEach((r) => {
      const cost = Math.max(0, r.price * (1 - target / 100));
      next[r.id] = { ...next[r.id], cost: cost.toFixed(2) };
    });
    setEdits(next);
    toast.success(`تم تعبئة هامش ${target}% للمنتجات المعروضة`);
  };

  const saveAll = async () => {
    if (dirty.length === 0) { toast.info("لا تغييرات"); return; }
    setSaving(true);
    try {
      const updates = dirty.map((id) => {
        const e = edits[id];
        const patch: Record<string, number> = {};
        if (e.cost && !isNaN(Number(e.cost))) patch.cost_price = Number(e.cost);
        if (e.aff !== undefined && e.aff !== "" && !isNaN(Number(e.aff))) patch.affiliate_commission_pct = Number(e.aff);
        return { id, patch };
      }).filter((u) => Object.keys(u.patch).length > 0);

      // batch updates
      for (const u of updates) {
        const { error } = await supabase.from("products").update(u.patch as never).eq("id", u.id);
        if (error) throw error;
      }
      toast.success(`تم حفظ ${updates.length} منتج`);
      await refetchProducts();
      await load();
    } catch (err) {
      toast.error("فشل الحفظ: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <MobileTopbar title="تعبئة التكاليف" />
      <div className="px-4 lg:px-6 pt-2 pb-24 max-w-5xl mx-auto" dir="rtl">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Card label="الإجمالي" value={stats.total} tone="text-foreground" />
          <Card label="بها تكلفة" value={stats.set} tone="text-success" />
          <Card label="ناقصة" value={stats.missing} tone="text-warning" />
        </div>

        {/* Quick fill */}
        <div className="bg-surface rounded-2xl border border-border/40 p-3 mb-3">
          <div className="flex items-center gap-2 text-[12px] font-bold mb-2">
            <Calculator className="h-4 w-4 text-primary" /> تعبئة سريعة بهامش افتراضي للمنتجات المعروضة
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[20, 30, 40, 50].map((m) => (
              <button key={m} onClick={() => applyMargin(m)} className="h-9 rounded-xl bg-primary/10 text-primary text-[12px] font-bold press">
                هامش {m}%
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2 mb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن منتج"
              className="w-full bg-surface-muted rounded-xl h-11 pr-10 pl-4 text-[14px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {(["missing", "set", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-9 px-3 rounded-full text-[12px] font-bold whitespace-nowrap press border",
                  filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border/40"
                )}
              >
                {f === "missing" ? "ناقصة التكلفة" : f === "set" ? "محددة" : "الكل"}
              </button>
            ))}
            <select
              value={source} onChange={(e) => setSource(e.target.value)}
              className="h-9 px-3 rounded-full bg-surface border border-border/40 text-[12px] font-bold"
            >
              {sources.map((s) => <option key={s} value={s}>{s === "all" ? "كل الأقسام" : s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        {!filtered ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-10 text-foreground-tertiary text-[13px]">لا منتجات</div>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((r) => {
              const e = edits[r.id] ?? { cost: "", aff: "" };
              const newCost = e.cost ? Number(e.cost) : (r.cost_price ?? 0);
              const margin = newCost > 0 && r.price > 0 ? r.price - newCost : null;
              const marginPct = margin && r.price > 0 ? (margin / r.price) * 100 : null;
              return (
                <li key={r.id} className="bg-surface rounded-xl border border-border/40 p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="flex-1 text-[12.5px] font-bold truncate">{r.name}</p>
                    <span className="text-[10px] bg-surface-muted rounded-full px-2 py-0.5 text-foreground-tertiary shrink-0">{r.source}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 items-center">
                    <div>
                      <p className="text-[10px] text-foreground-tertiary mb-0.5">السعر</p>
                      <p className="num text-[13px] font-bold">{fmtMoney(r.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-foreground-tertiary mb-0.5">التكلفة</p>
                      <input
                        type="number" step="0.01" inputMode="decimal"
                        defaultValue={r.cost_price ?? ""}
                        value={e.cost}
                        onChange={(ev) => setEdit(r.id, "cost", ev.target.value)}
                        placeholder={r.cost_price ? String(r.cost_price) : "0.00"}
                        className="w-full h-9 rounded-lg bg-surface-muted px-2 text-[12.5px] num text-right border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-foreground-tertiary mb-0.5">عمولة %</p>
                      <input
                        type="number" step="0.5" min="0" max="50"
                        value={e.aff}
                        onChange={(ev) => setEdit(r.id, "aff", ev.target.value)}
                        placeholder={String(r.affiliate_commission_pct ?? 0)}
                        className="w-full h-9 rounded-lg bg-surface-muted px-2 text-[12.5px] num text-right border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="text-center min-w-[60px]">
                      <p className="text-[10px] text-foreground-tertiary mb-0.5">هامش</p>
                      {margin !== null && marginPct !== null ? (
                        <p className={cn("num text-[12px] font-bold",
                          marginPct < 10 ? "text-destructive" : marginPct < 25 ? "text-warning" : "text-success"
                        )}>
                          {marginPct.toFixed(0)}%
                        </p>
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-foreground-tertiary mx-auto" />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Sticky save bar */}
      {dirty.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border/40 p-3" dir="rtl">
          <div className="max-w-5xl mx-auto flex items-center gap-2">
            <p className="flex-1 text-[12.5px] font-bold">
              <span className="num">{dirty.length}</span> تغيير غير محفوظ
            </p>
            <button
              onClick={() => setEdits({})}
              className="h-11 px-4 rounded-xl bg-surface-muted text-[13px] font-bold press"
            >
              إلغاء
            </button>
            <button
              onClick={saveAll}
              disabled={saving}
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold press flex items-center gap-2 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ الكل
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Card({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-border/40 p-3 text-center">
      <p className={cn("font-display text-[20px] num leading-none", tone)}>{value}</p>
      <p className="text-[11px] text-foreground-tertiary mt-1">{label}</p>
    </div>
  );
}
