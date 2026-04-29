import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Store as StoreIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { toast } from "sonner";

type Store = {
  id: string;
  name: string;
  slug: string;
  type: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  commission_pct: number;
  is_active: boolean;
};

export default function Stores() {
  const [items, setItems] = useState<Store[] | null>(null);
  const [editing, setEditing] = useState<Store | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setItems(null);
    const { data, error } = await supabase.from("stores").select("*").order("name");
    if (error) toast.error(error.message);
    setItems((data ?? []) as Store[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (s: Store) => {
    if (!confirm(`حذف "${s.name}"؟`)) return;
    const { error } = await supabase.from("stores").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  return (
    <>
      <MobileTopbar title="المتاجر" />
      <div className="px-4 lg:px-6 pt-2 pb-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[13px] text-foreground-secondary">إدارة المتاجر والعمولات</p>
          <button onClick={() => setCreating(true)} className="h-10 px-4 rounded-2xl bg-primary text-primary-foreground flex items-center gap-1.5 press shadow-sm font-semibold text-[13px]">
            <Plus className="h-4 w-4" /> متجر جديد
          </button>
        </div>

        {items === null ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-surface-muted animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <IOSCard className="text-center py-10">
            <StoreIcon className="h-10 w-10 mx-auto text-foreground-tertiary mb-3" />
            <p className="font-display text-[16px] mb-1">لا توجد متاجر</p>
          </IOSCard>
        ) : (
          <div className="space-y-2">
            {items.map((s) => (
              <div key={s.id} className="bg-surface rounded-2xl border border-border/40 p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center">
                  {s.logo_url ? <img src={s.logo_url} alt="" className="w-full h-full object-cover" /> : <StoreIcon className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[14px] truncate">{s.name}</p>
                    <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + (s.is_active ? "bg-success/12 text-success" : "bg-foreground-tertiary/15 text-foreground-secondary")}>
                      {s.is_active ? "نشط" : "موقوف"}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-tertiary num">{s.type} • عمولة {s.commission_pct}%</p>
                </div>
                <button onClick={() => setEditing(s)} className="h-9 w-9 rounded-lg bg-surface-muted flex items-center justify-center press">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => del(s)} className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center press">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {(creating || editing) && (
        <StoreEditor
          store={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </>
  );
}

function StoreEditor({ store, onClose, onSaved }: { store: Store | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !store;
  const [f, setF] = useState({
    name: store?.name ?? "",
    slug: store?.slug ?? "",
    type: store?.type ?? "internal",
    phone: store?.phone ?? "",
    address: store?.address ?? "",
    logo_url: store?.logo_url ?? "",
    commission_pct: store?.commission_pct ?? 0,
    is_active: store?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!f.name.trim() || !f.slug.trim()) {
      toast.error("الاسم والمعرّف مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: f.name.trim(),
        slug: f.slug.trim(),
        type: f.type,
        phone: f.phone || null,
        address: f.address || null,
        logo_url: f.logo_url || null,
        commission_pct: Number(f.commission_pct) || 0,
        is_active: f.is_active,
      };
      const { error } = isNew
        ? await supabase.from("stores").insert(payload)
        : await supabase.from("stores").update(payload).eq("id", store!.id);
      if (error) throw error;
      toast.success(isNew ? "تم الإنشاء" : "تم الحفظ");
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="bg-background w-full lg:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="sticky top-0 bg-background/95 backdrop-blur px-5 py-3 border-b border-border/40 flex items-center justify-between">
          <h2 className="font-display text-[18px]">{isNew ? "متجر جديد" : "تعديل المتجر"}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-surface-muted flex items-center justify-center press"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="الاسم *"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inp} /></Field>
          <Field label="المعرّف (slug) *"><input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="store-name" className={inp} /></Field>
          <Field label="النوع">
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={inp}>
              <option value="internal">داخلي</option>
              <option value="partner">شريك</option>
              <option value="external">خارجي</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الهاتف"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inp + " num"} /></Field>
            <Field label="العمولة %"><input type="number" step="0.01" value={f.commission_pct} onChange={(e) => setF({ ...f, commission_pct: Number(e.target.value) })} className={inp + " num text-right"} /></Field>
          </div>
          <Field label="العنوان"><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={inp} /></Field>
          <Field label="رابط الشعار"><input value={f.logo_url} onChange={(e) => setF({ ...f, logo_url: e.target.value })} className={inp} /></Field>
          <button type="button" onClick={() => setF({ ...f, is_active: !f.is_active })} className="flex items-center gap-2 press">
            <span className={"w-10 h-6 rounded-full relative " + (f.is_active ? "bg-primary" : "bg-surface-muted border border-border/60")}>
              <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all " + (f.is_active ? "right-0.5" : "right-[18px]")} />
            </span>
            <span className="text-[13px] font-semibold">نشط</span>
          </button>
        </div>
        <div className="sticky bottom-0 bg-background/95 backdrop-blur px-5 py-3 border-t border-border/40 flex gap-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-2xl bg-surface-muted text-[14px] font-semibold press">إلغاء</button>
          <button onClick={save} disabled={saving} className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-[14px] font-semibold press flex items-center justify-center gap-2 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full h-11 rounded-xl bg-surface-muted px-3 text-[14px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-[12px] font-semibold text-foreground-secondary mb-1.5">{label}</label>{children}</div>;
}
