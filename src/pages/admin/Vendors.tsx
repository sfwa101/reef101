import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Save, X, Store as StoreIcon, Truck, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fmtMoney } from "@/lib/format";

type Vendor = {
  id: string;
  name: string;
  slug: string;
  vendor_type: "dropship" | "restaurant" | "supplier";
  owner_user_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  commission_pct: number;
  is_active: boolean;
  created_at: string;
};
type Wallet = { vendor_id: string; available_balance: number; pending_balance: number; lifetime_earned: number };

const TYPE_META: Record<string, { label: string; icon: typeof Truck; color: string }> = {
  dropship: { label: "دروبشيبينج", icon: Truck, color: "bg-info/15 text-info" },
  restaurant: { label: "مطعم شريك", icon: ChefHat, color: "bg-accent/15 text-accent" },
  supplier: { label: "مورّد", icon: StoreIcon, color: "bg-primary/15 text-primary" },
};

export default function Vendors() {
  const [rows, setRows] = useState<Vendor[] | null>(null);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", vendor_type: "dropship" as Vendor["vendor_type"],
    contact_email: "", contact_phone: "", commission_pct: 15,
  });

  const load = useCallback(async () => {
    setRows(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const [{ data: vs, error }, { data: ws }] = await Promise.all([
      sb.from("vendors").select("*").order("created_at", { ascending: false }),
      sb.from("vendor_wallets").select("*"),
    ]);
    if (error) toast.error(error.message);
    setRows((vs ?? []) as Vendor[]);
    const map: Record<string, Wallet> = {};
    for (const w of (ws ?? []) as Wallet[]) map[w.vendor_id] = w;
    setWallets(map);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("الاسم والـ slug مطلوبان");
      return;
    }
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("vendors").insert({
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      vendor_type: form.vendor_type,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      commission_pct: form.commission_pct,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إنشاء التاجر");
    setShowNew(false);
    setForm({ name: "", slug: "", vendor_type: "dropship", contact_email: "", contact_phone: "", commission_pct: 15 });
    load();
  };

  const toggleActive = async (v: Vendor) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("vendors").update({ is_active: !v.is_active }).eq("id", v.id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <>
      <MobileTopbar title="التجار والموردون" />
      <div className="px-4 lg:px-6 pt-2 pb-24 max-w-4xl mx-auto">
        <button
          onClick={() => setShowNew(true)}
          className="w-full mb-3 h-11 rounded-2xl bg-gradient-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md press"
        >
          <Plus className="h-4 w-4" /> إضافة تاجر / مورّد جديد
        </button>

        {showNew && (
          <IOSCard className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[16px]">تاجر جديد</h3>
              <button onClick={() => setShowNew(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="اسم التاجر / المطعم"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="col-span-2 h-11 px-3 rounded-xl bg-surface-muted text-[14px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                placeholder="slug (e.g. tasty-pizza)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="col-span-2 h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
              <select
                value={form.vendor_type}
                onChange={(e) => setForm({ ...form, vendor_type: e.target.value as Vendor["vendor_type"] })}
                className="h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="dropship">دروبشيبينج</option>
                <option value="restaurant">مطعم</option>
                <option value="supplier">مورّد</option>
              </select>
              <input
                type="number"
                placeholder="نسبة المنصة %"
                value={form.commission_pct}
                onChange={(e) => setForm({ ...form, commission_pct: Number(e.target.value) })}
                className="h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 num text-right"
              />
              <input
                placeholder="بريد التواصل"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
              <input
                placeholder="رقم التواصل"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="h-11 px-3 rounded-xl bg-surface-muted text-[13px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 num"
                dir="ltr"
              />
            </div>
            <button
              onClick={create}
              disabled={saving}
              className="w-full mt-3 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 press"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التاجر
            </button>
          </IOSCard>
        )}

        {rows === null ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-surface-muted animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <IOSCard className="text-center text-foreground-tertiary text-[13px] py-10">
            لا يوجد تجار بعد
          </IOSCard>
        ) : (
          <div className="space-y-2">
            {rows.map((v) => {
              const meta = TYPE_META[v.vendor_type];
              const w = wallets[v.id];
              const Icon = meta.icon;
              return (
                <IOSCard key={v.id} className="!p-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${meta.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[14px] truncate">{v.name}</p>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{meta.label}</Badge>
                        {!v.is_active && <Badge className="bg-destructive/15 text-destructive text-[10px] h-4 px-1.5 border-0">معطّل</Badge>}
                      </div>
                      <p className="text-[11px] text-foreground-tertiary mt-0.5 truncate" dir="ltr">{v.slug} • عمولة {v.commission_pct}%</p>
                      {w && (
                        <div className="flex gap-3 mt-1.5 text-[11px]">
                          <span className="text-success">متاح: {fmtMoney(w.available_balance)}</span>
                          <span className="text-warning">معلق: {fmtMoney(w.pending_balance)}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleActive(v)}
                      className="text-[11px] text-foreground-tertiary hover:text-primary press px-2 py-1"
                    >
                      {v.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                  </div>
                </IOSCard>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
