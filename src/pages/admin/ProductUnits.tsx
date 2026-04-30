import { useEffect, useState } from "react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, Plus, Trash2, Save, Package } from "lucide-react";
import { toast } from "sonner";

type UoM = { code: string; name_ar: string; is_base: boolean; sort_order: number };
type ProductRow = { id: string; name: string; price: number };
type PU = {
  id?: string;
  product_id: string;
  unit_code: string;
  conversion_factor: number;
  selling_price: number | null;
  is_default_sell: boolean;
  is_active: boolean;
};

export default function ProductUnits() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("store_manager") || hasRole("staff");

  const [units, setUnits] = useState<UoM[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<ProductRow | null>(null);
  const [rows, setRows] = useState<PU[]>([]);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const [{ data: u }, { data: p }] = await Promise.all([
        (supabase as any).from("units_of_measure").select("*").order("sort_order"),
        supabase.from("products").select("id,name,price").eq("is_active", true).order("name").limit(500),
      ]);
      setUnits((u || []) as UoM[]);
      setProducts((p || []) as ProductRow[]);
    })();
  }, [allowed]);

  const loadProductUnits = async (p: ProductRow) => {
    setSelected(p);
    setLoading(true);
    const [{ data: pu }, { data: bd }] = await Promise.all([
      (supabase as any).from("product_units").select("*").eq("product_id", p.id).order("conversion_factor"),
      (supabase as any).rpc("nested_stock_breakdown", { _product_id: p.id }),
    ]);
    setRows((pu || []) as PU[]);
    setBreakdown(bd);
    setLoading(false);
  };

  const addUnit = (code: string) => {
    if (!selected) return;
    if (rows.some((r) => r.unit_code === code)) return toast.error("الوحدة موجودة");
    setRows((rs) => [...rs, {
      product_id: selected.id, unit_code: code,
      conversion_factor: code === "piece" ? 1 : 12,
      selling_price: null, is_default_sell: false, is_active: true,
    }]);
  };

  const updateRow = (idx: number, patch: Partial<PU>) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = async (idx: number) => {
    const row = rows[idx];
    if (row.id) {
      const { error } = await (supabase as any).from("product_units").delete().eq("id", row.id);
      if (error) return toast.error(error.message);
    }
    setRows((rs) => rs.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Validate pricing per unit
      for (const r of rows) {
        if (r.selling_price && r.selling_price > 0) {
          const { data: v } = await (supabase as any).rpc("validate_unit_pricing", {
            _product_id: r.product_id,
            _unit_code: r.unit_code,
            _selling_price: r.selling_price,
          });
          if (v && (v as any).ok === false) {
            toast.error(`${r.unit_code}: ${(v as any).message}`);
            setSaving(false);
            return;
          }
        }
      }

      const payload = rows.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        product_id: r.product_id,
        unit_code: r.unit_code,
        conversion_factor: r.conversion_factor,
        selling_price: r.selling_price,
        is_default_sell: r.is_default_sell,
        is_active: r.is_active,
      }));

      const { error } = await (supabase as any).from("product_units").upsert(payload, {
        onConflict: "product_id,unit_code",
      });
      if (error) throw error;
      toast.success("تم الحفظ");
      loadProductUnits(selected);
    } catch (e: any) {
      toast.error(e?.message || "فشل");
    } finally {
      setSaving(false);
    }
  };

  if (rolesLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (<><MobileTopbar title="وحدات القياس" /><div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>غير متاح</p></div></>);

  const filtered = products.filter((p) => !q || p.name.includes(q));
  const availableToAdd = units.filter((u) => !rows.some((r) => r.unit_code === u.code));

  return (
    <>
      <MobileTopbar title="الوحدات والتسعير" />
      <div className="px-4 lg:px-6 py-4 max-w-5xl mx-auto" dir="rtl">
        {!selected ? (
          <>
            <input
              className="w-full bg-surface-muted rounded-2xl h-11 px-4 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="ابحث عن منتج..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="space-y-2">
              {filtered.slice(0, 100).map((p) => (
                <button key={p.id} onClick={() => loadProductUnits(p)}
                  className="w-full text-right p-3 bg-surface-muted rounded-2xl hover:bg-surface-muted/80 flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-[14px] font-medium">{p.name}</p>
                    <p className="text-[11px] text-foreground-tertiary">سعر القطعة: {p.price} ج.م</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { setSelected(null); setRows([]); setBreakdown(null); }}
              className="text-primary text-[13px] mb-2">← رجوع</button>
            <div className="bg-gradient-to-br from-primary/10 to-primary-glow/5 rounded-2xl p-4 mb-3 border border-primary/20">
              <p className="font-display text-[16px]">{selected.name}</p>
              <p className="text-[12px] text-foreground-tertiary mt-1">سعر القطعة الأساسي: {selected.price} ج.م</p>
              {breakdown && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <p className="text-[11px] text-foreground-tertiary mb-1">المخزون الحالي:</p>
                  <p className="text-[14px] font-semibold">{breakdown.human_readable}</p>
                  <p className="text-[10px] text-foreground-tertiary mt-1">إجمالي القطع: {breakdown.total_pieces}</p>
                </div>
              )}
            </div>

            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
              <div className="space-y-2">
                {rows.map((r, idx) => {
                  const u = units.find((x) => x.code === r.unit_code);
                  return (
                    <div key={idx} className="bg-surface-muted rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[14px]">{u?.name_ar || r.unit_code}</span>
                        {r.unit_code !== "piece" && (
                          <button onClick={() => removeRow(idx)} className="text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-foreground-tertiary">عدد القطع/الوحدة</label>
                          <input type="number" min={1} value={r.conversion_factor}
                            disabled={r.unit_code === "piece"}
                            onChange={(e) => updateRow(idx, { conversion_factor: Math.max(1, Number(e.target.value)) })}
                            className="w-full h-9 rounded-lg bg-background px-2 text-[13px] num focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
                        </div>
                        <div>
                          <label className="text-[10px] text-foreground-tertiary">سعر بيع الوحدة</label>
                          <input type="number" step="0.01" value={r.selling_price ?? ""}
                            onChange={(e) => updateRow(idx, { selling_price: e.target.value ? Number(e.target.value) : null })}
                            className="w-full h-9 rounded-lg bg-background px-2 text-[13px] num focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[12px]">
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" checked={r.is_default_sell}
                            onChange={(e) => updateRow(idx, { is_default_sell: e.target.checked })} />
                          افتراضي للبيع
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" checked={r.is_active}
                            onChange={(e) => updateRow(idx, { is_active: e.target.checked })} />
                          مفعّل
                        </label>
                      </div>
                    </div>
                  );
                })}

                {availableToAdd.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {availableToAdd.map((u) => (
                      <button key={u.code} onClick={() => addUnit(u.code)}
                        className="bg-primary/10 text-primary rounded-full px-3 py-1.5 text-[12px] flex items-center gap-1">
                        <Plus className="h-3 w-3" /> {u.name_ar}
                      </button>
                    ))}
                  </div>
                )}

                <button onClick={saveAll} disabled={saving}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ التغييرات
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
