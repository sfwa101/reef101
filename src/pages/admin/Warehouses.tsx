import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Save, X, Warehouse as WhIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Wh = {
  id: string;
  name: string;
  code: string;
  warehouse_type: "main" | "branch" | "vendor" | "virtual";
  vendor_id: string | null;
  city: string | null;
  district: string | null;
  served_zones: string[];
  priority: number;
  is_active: boolean;
};
type Vendor = { id: string; name: string };

const ZONES = ["A", "B", "C", "D", "M", "E"];

export default function Warehouses() {
  const [rows, setRows] = useState<Wh[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", code: "", warehouse_type: "branch" as Wh["warehouse_type"],
    vendor_id: "", city: "", district: "", priority: 100,
    served_zones: [] as string[],
  });

  const load = useCallback(async () => {
    setRows(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const [{ data: ws, error }, { data: vs }] = await Promise.all([
      sb.from("warehouses").select("*").order("priority", { ascending: true }),
      sb.from("vendors").select("id,name").eq("is_active", true).order("name"),
    ]);
    if (error) toast.error(error.message);
    setRows((ws ?? []) as Wh[]);
    setVendors((vs ?? []) as Vendor[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleZone = (z: string) =>
    setForm((f) => ({ ...f, served_zones: f.served_zones.includes(z) ? f.served_zones.filter(x => x !== z) : [...f.served_zones, z] }));

  const create = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("الاسم والكود مطلوبان");
      return;
    }
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("warehouses").insert({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      warehouse_type: form.warehouse_type,
      vendor_id: form.vendor_id || null,
      city: form.city.trim() || null,
      district: form.district.trim() || null,
      priority: form.priority,
      served_zones: form.served_zones,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إنشاء المخزن");
    setShowNew(false);
    setForm({ name: "", code: "", warehouse_type: "branch", vendor_id: "", city: "", district: "", priority: 100, served_zones: [] });
    load();
  };

  const updatePriority = async (id: string, priority: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("warehouses").update({ priority }).eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <>
      <MobileTopbar title="المخازن المتعددة" />
      <div className="px-4 lg:px-6 pt-2 pb-24 max-w-4xl mx-auto">
        <button
          onClick={() => setShowNew(true)}
          className="w-full mb-3 h-11 rounded-2xl bg-gradient-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md press"
        >
          <Plus className="h-4 w-4" /> إضافة مخزن
        </button>

        {showNew && (
          <IOSCard className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[16px]">مخزن جديد</h3>
              <button onClick={() => setShowNew(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="col-span-2 h-11 px-3 rounded-xl bg-surface-muted text-[14px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none" />
              <input placeholder="الكود (e.g. WH-MAIN)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none" dir="ltr" />
              <select value={form.warehouse_type} onChange={(e) => setForm({ ...form, warehouse_type: e.target.value as Wh["warehouse_type"] })}
                className="h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none">
                <option value="main">رئيسي</option>
                <option value="branch">فرع</option>
                <option value="vendor">مخزن تاجر</option>
                <option value="virtual">افتراضي (دروبشيبينج)</option>
              </select>
              {form.warehouse_type === "vendor" && (
                <select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                  className="col-span-2 h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none">
                  <option value="">-- اختر التاجر --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              )}
              <input placeholder="المدينة" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none" />
              <input placeholder="الحي" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none" />
              <input type="number" placeholder="الأولوية (أقل = أسبق)" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="col-span-2 h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none num text-right" />
            </div>
            <div className="mt-3">
              <p className="text-[12px] text-foreground-secondary mb-1.5">المناطق التي يخدمها هذا المخزن:</p>
              <div className="flex flex-wrap gap-1.5">
                {ZONES.map(z => (
                  <button key={z} onClick={() => toggleZone(z)}
                    className={`h-9 px-3 rounded-lg text-[13px] font-semibold press ${form.served_zones.includes(z) ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground"}`}>
                    {z}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={create} disabled={saving}
              className="w-full mt-3 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 press">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
            </button>
          </IOSCard>
        )}

        {rows === null ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-surface-muted animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <IOSCard className="text-center text-foreground-tertiary text-[13px] py-10">لا توجد مخازن بعد</IOSCard>
        ) : (
          <div className="space-y-2">
            {rows.map((w) => (
              <IOSCard key={w.id} className="!p-3">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-info/15 text-info flex items-center justify-center"><WhIcon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[14px] truncate">{w.name}</p>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{w.warehouse_type}</Badge>
                      {!w.is_active && <Badge className="bg-destructive/15 text-destructive text-[10px] h-4 px-1.5 border-0">معطّل</Badge>}
                    </div>
                    <p className="text-[11px] text-foreground-tertiary mt-0.5 truncate" dir="ltr">{w.code} • {w.city ?? "—"}</p>
                    {w.served_zones.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {w.served_zones.map(z => <Badge key={z} variant="outline" className="text-[10px] h-4 px-1.5">{z}</Badge>)}
                      </div>
                    )}
                  </div>
                  <input type="number" defaultValue={w.priority} onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n !== w.priority) updatePriority(w.id, n);
                  }}
                    className="w-16 h-9 px-2 rounded-lg bg-surface-muted text-[13px] num text-center border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none" />
                </div>
              </IOSCard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
