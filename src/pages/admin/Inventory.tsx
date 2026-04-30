import { useEffect, useState, useCallback } from "react";
import { Search, Save, Loader2, AlertTriangle, Boxes } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { refetchProducts } from "@/lib/products";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  is_active: boolean;
  source: string;
};
type Edit = { price?: string; stock?: string };

export default function Inventory() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [src, setSrc] = useState("all");
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [saving, setSaving] = useState(false);
  const [breakdowns, setBreakdowns] = useState<Record<string, string>>({});
  const [loadingBreakdown, setLoadingBreakdown] = useState<Record<string, boolean>>({});

  const formatBreakdown = (raw: any): string => {
    if (!raw) return "";
    // Expected shape: { breakdown: [{ unit, qty }, ...], total_pieces: N } OR array of pairs
    const list = Array.isArray(raw) ? raw : raw.breakdown || raw.units || [];
    if (!Array.isArray(list) || list.length === 0) return "";
    return list
      .filter((p: any) => p && (p.qty ?? p.quantity ?? 0) > 0)
      .map((p: any) => `${p.qty ?? p.quantity} ${p.unit ?? p.unit_code ?? p.code}`)
      .join("، ");
  };

  const loadBreakdown = async (productId: string) => {
    if (breakdowns[productId] !== undefined) return;
    setLoadingBreakdown((s) => ({ ...s, [productId]: true }));
    try {
      const { data, error } = await (supabase as any).rpc("nested_stock_breakdown", { _product_id: productId });
      if (error) throw error;
      setBreakdowns((s) => ({ ...s, [productId]: formatBreakdown(data) }));
    } catch {
      setBreakdowns((s) => ({ ...s, [productId]: "" }));
    } finally {
      setLoadingBreakdown((s) => ({ ...s, [productId]: false }));
    }
  };

  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,unit,price,stock,is_active,source")
      .order("name")
      .limit(2000);
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const sources = Array.from(new Set((rows ?? []).map((r) => r.source))).sort();

  const filtered = (rows ?? []).filter((r) => {
    if (src !== "all" && r.source !== src) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const setEdit = (id: string, patch: Edit) =>
    setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }));

  const dirtyCount = Object.keys(edits).length;

  const saveAll = async () => {
    if (!dirtyCount) return;
    setSaving(true);
    try {
      const tasks = Object.entries(edits).map(([id, patch]) => {
        const upd: { price?: number; stock?: number } = {};
        if (patch.price !== undefined && patch.price !== "") upd.price = Number(patch.price);
        if (patch.stock !== undefined && patch.stock !== "") upd.stock = Number(patch.stock);
        if (Object.keys(upd).length === 0) return Promise.resolve({ error: null });
        return supabase.from("products").update(upd).eq("id", id);
      });
      const results = await Promise.all(tasks);
      const errs = results.filter((r) => r.error);
      if (errs.length) {
        toast.error(`فشل ${errs.length} عملية`);
      } else {
        toast.success(`تم حفظ ${dirtyCount} منتج`);
        setEdits({});
        await refetchProducts();
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <MobileTopbar title="المخزون والأسعار" />
      <div className="px-4 lg:px-6 pt-2 pb-24 max-w-5xl mx-auto">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث..."
              className="w-full bg-surface-muted rounded-2xl h-11 pr-10 pl-4 text-[14px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select value={src} onChange={(e) => setSrc(e.target.value)} className="h-11 px-3 rounded-2xl bg-surface-muted text-[13px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">كل الأقسام</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {rows === null ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-surface-muted animate-pulse" />)}</div>
        ) : (
          <IOSCard padded={false} className="overflow-hidden">
            <div className="divide-y divide-border/40">
              {filtered.map((r) => {
                const edit = edits[r.id] ?? {};
                const priceVal = edit.price ?? String(r.price);
                const stockVal = edit.stock ?? String(r.stock);
                const dirty = !!edits[r.id];
                const low = Number(stockVal) > 0 && Number(stockVal) < 20;
                const out = Number(stockVal) <= 0;
                return (
                  <div key={r.id} className={cn("p-3 flex items-center gap-2", dirty && "bg-warning/5")}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{r.name}</p>
                      <p className="text-[11px] text-foreground-tertiary">{r.unit} • {r.source}</p>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] text-foreground-tertiary mb-0.5">السعر</label>
                      <input
                        type="number"
                        step="0.01"
                        value={priceVal}
                        onChange={(e) => setEdit(r.id, { price: e.target.value })}
                        className="w-full h-9 rounded-lg bg-surface-muted px-2 text-[13px] num text-right border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-[10px] text-foreground-tertiary mb-0.5">المخزون</label>
                      <input
                        type="number"
                        value={stockVal}
                        onChange={(e) => setEdit(r.id, { stock: e.target.value })}
                        className={cn(
                          "w-full h-9 rounded-lg bg-surface-muted px-2 text-[13px] num text-right border-0 focus:outline-none focus:ring-2 focus:ring-primary/30",
                          out && "text-destructive font-bold",
                          low && !out && "text-warning font-bold"
                        )}
                      />
                    </div>
                    {(low || out) && (
                      <AlertTriangle className={cn("h-4 w-4 flex-shrink-0", out ? "text-destructive" : "text-warning")} />
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="p-10 text-center text-foreground-tertiary text-[13px]">لا توجد نتائج</div>
              )}
            </div>
          </IOSCard>
        )}
      </div>

      {dirtyCount > 0 && (
        <div className="fixed bottom-tab lg:bottom-4 left-4 right-4 lg:right-auto lg:w-96 z-30">
          <button
            onClick={saveAll}
            disabled={saving}
            className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold text-[14px] shadow-2xl press flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ {dirtyCount} تغيير
          </button>
        </div>
      )}

      {/* placeholder for unused fmtMoney import */}
      <span className="hidden">{fmtMoney(0)}</span>
    </>
  );
}
