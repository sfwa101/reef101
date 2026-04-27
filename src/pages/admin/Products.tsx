import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Package, X, Save, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  price: number;
  old_price: number | null;
  image: string | null;
  category: string;
  sub_category: string | null;
  source: string;
  badge: string | null;
  stock: number;
  is_active: boolean;
  sort_order: number;
};

const emptyProduct: Product = {
  id: "", name: "", brand: "", unit: "", price: 0, old_price: null,
  image: "", category: "", sub_category: "", source: "supermarket",
  badge: "", stock: 100, is_active: true, sort_order: 0,
};

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products").select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Product[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sources = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.source && set.add(i.source));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => items.filter((i) => {
    if (sourceFilter !== "all" && i.source !== sourceFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q);
  }), [items, search, sourceFilter]);

  const handleSave = async (p: Product, isNew: boolean) => {
    if (isNew) {
      if (!p.id.trim() || !p.name.trim()) { alert("ID والاسم مطلوبان"); return; }
      const { error } = await supabase.from("products").insert({
        ...p, old_price: p.old_price || null, brand: p.brand || null,
        sub_category: p.sub_category || null, badge: p.badge || null, image: p.image || null,
      });
      if (error) { alert("خطأ: " + error.message); return; }
    } else {
      const { id, ...rest } = p;
      const { error } = await supabase.from("products").update({
        ...rest, old_price: rest.old_price || null,
      }).eq("id", id);
      if (error) { alert("خطأ: " + error.message); return; }
    }
    setEditing(null); setCreating(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { alert("خطأ: " + error.message); return; }
    load();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
          <p className="text-sm text-muted-foreground">{items.length} منتج · {items.filter((i) => i.is_active).length} نشط</p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing({ ...emptyProduct }); }}
          className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-pill"
        >
          <Plus className="h-4 w-4" />إضافة منتج
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو ID أو الماركة…"
            className="w-full rounded-2xl border border-border bg-background py-2 pe-10 ps-3 text-sm outline-none focus:border-primary" />
        </div>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="all">كل الأقسام</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">جارٍ التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">لا توجد منتجات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">المنتج</th>
                  <th className="px-4 py-3 text-start font-medium">القسم</th>
                  <th className="px-4 py-3 text-start font-medium">السعر</th>
                  <th className="px-4 py-3 text-start font-medium">المخزون</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                          {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{p.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.source}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                        p.stock <= 0 ? "bg-destructive/10 text-destructive"
                          : p.stock < 10 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400")}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(p)}
                        className={cn("rounded-full px-3 py-1 text-xs font-medium",
                          p.is_active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                        {p.is_active ? "نشط" : "متوقف"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setCreating(false); setEditing(p); }}
                          className="rounded-lg p-2 hover:bg-muted" aria-label="تعديل">
                          <Edit className="h-4 w-4 text-foreground/70" />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="rounded-lg p-2 hover:bg-destructive/10" aria-label="حذف">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <ProductEditor product={editing} isNew={creating}
          onCancel={() => { setEditing(null); setCreating(false); }} onSave={handleSave} />
      )}
    </div>
  );
}

function ProductEditor({ product, isNew, onCancel, onSave }: {
  product: Product; isNew: boolean; onCancel: () => void; onSave: (p: Product, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<Product>(product);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 lg:items-center lg:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card shadow-float lg:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">{isNew ? "إضافة منتج جديد" : "تعديل المنتج"}</h2>
          </div>
          <button onClick={onCancel} className="rounded-xl p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="ID (معرّف فريد)">
              <input disabled={!isNew} value={form.id} onChange={(e) => set("id", e.target.value)}
                placeholder="مثل: milk-1l"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60" />
            </Field>
            <Field label="الاسم">
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="الماركة">
              <input value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="الوحدة">
              <input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="1 لتر / كيلو…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="السعر">
              <input type="number" step="0.01" value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="السعر القديم (اختياري)">
              <input type="number" step="0.01" value={form.old_price ?? ""}
                onChange={(e) => set("old_price", e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="القسم (Source)">
              <input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="supermarket / dairy…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="التصنيف">
              <input value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="التصنيف الفرعي">
              <input value={form.sub_category ?? ""} onChange={(e) => set("sub_category", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="المخزون">
              <input type="number" value={form.stock} onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="الترتيب">
              <input type="number" value={form.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
            <Field label="شارة (Badge)">
              <input value={form.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="جديد / خصم…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </Field>
          </div>
          <Field label="رابط الصورة">
            <input value={form.image ?? ""} onChange={(e) => set("image", e.target.value)} placeholder="https://…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-border" />
            <span>منتج نشط (يظهر للعملاء)</span>
          </label>
        </div>
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
          <button onClick={onCancel}
            className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">إلغاء</button>
          <button onClick={() => onSave(form, isNew)}
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Save className="h-4 w-4" />حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
