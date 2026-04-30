import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { Loader2, Save, Plus, Percent } from "lucide-react";

type Row = {
  id: string;
  category: string;
  default_commission_pct: number;
  notes: string | null;
};

export default function AffiliateSettings() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const isAdmin = hasRole("admin");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newPct, setNewPct] = useState("3");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("affiliate_settings")
      .select("id,category,default_commission_pct,notes")
      .order("category");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (row: Row) => {
    if (row.default_commission_pct < 0 || row.default_commission_pct > 50) {
      toast.error("النسبة يجب أن تكون بين 0% و 50%");
      return;
    }
    setSavingId(row.id);
    const { error } = await supabase
      .from("affiliate_settings")
      .update({
        default_commission_pct: row.default_commission_pct,
        notes: row.notes,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(`تم حفظ "${row.category}"`);
  };

  const addRow = async () => {
    const cat = newCategory.trim();
    const pct = parseFloat(newPct);
    if (!cat) return toast.error("أدخل اسم الفئة");
    if (isNaN(pct) || pct < 0 || pct > 50) return toast.error("النسبة 0-50%");
    const { error } = await supabase
      .from("affiliate_settings")
      .insert({ category: cat, default_commission_pct: pct });
    if (error) return toast.error(error.message);
    setNewCategory(""); setNewPct("3");
    toast.success("تمت إضافة الفئة");
    load();
  };

  if (rolesLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
  if (!isAdmin) return <div className="p-8 text-center text-destructive">للأدمن فقط</div>;

  return (
    <>
      <MobileTopbar title="عمولات الأفلييت" />
      <div className="px-4 lg:px-6 pt-3 pb-6 max-w-3xl mx-auto space-y-4">
        <div className="bg-surface rounded-2xl p-4 border border-border/40">
          <p className="text-sm text-foreground-secondary leading-relaxed">
            <Percent className="inline h-4 w-4 ml-1 text-primary" />
            النسبة الافتراضية لعمولة شركاء النجاح لكل فئة. الحد الأقصى 50%.
          </p>
        </div>

        {/* Add new */}
        <div className="bg-surface rounded-2xl p-4 border border-border/40 space-y-3">
          <h3 className="font-display text-base">إضافة فئة جديدة</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">الفئة</Label>
              <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="مثلاً: مخبوزات" />
            </div>
            <div>
              <Label className="text-xs">النسبة %</Label>
              <Input type="number" min={0} max={50} step={0.1} value={newPct} onChange={e => setNewPct(e.target.value)} />
            </div>
          </div>
          <Button onClick={addRow} size="sm" className="w-full">
            <Plus className="h-4 w-4 ml-1" /> إضافة
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-2">
            {rows.map(row => (
              <div key={row.id} className="bg-surface rounded-2xl p-4 border border-border/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base">{row.category}</h4>
                  <span className="text-xs text-foreground-tertiary">
                    {(row.default_commission_pct ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2">
                    <Label className="text-xs">النسبة %</Label>
                    <Input
                      type="number" min={0} max={50} step={0.1}
                      value={row.default_commission_pct}
                      onChange={e => updateRow(row.id, { default_commission_pct: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <Button onClick={() => save(row)} disabled={savingId === row.id} size="sm">
                    {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
            {!rows.length && <p className="text-center text-foreground-tertiary py-8">لا توجد فئات بعد</p>}
          </div>
        )}
      </div>
    </>
  );
}
