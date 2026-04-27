import { useEffect, useState } from "react";
import BackHeader from "@/components/BackHeader";
import { MapPin, Plus, Home, Briefcase, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isRetryableBackendError, retryBackendCall } from "@/lib/backendRetry";

type Addr = {
  id: string;
  label: string;
  city: string;
  district: string | null;
  street: string | null;
  building: string | null;
  notes: string | null;
  is_default: boolean;
};

const Addresses = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Addr[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: "المنزل", city: "القاهرة", district: "", street: "", building: "", notes: "" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await retryBackendCall(
      async () => await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      8,
      700,
    );
    setList((data as Addr[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const setDefault = async (id: string) => {
    if (!user) return;
    await retryBackendCall(async () => await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id), 8, 700);
    await retryBackendCall(async () => await supabase.from("addresses").update({ is_default: true }).eq("id", id), 8, 700);
    toast.success("تم تعيين العنوان الافتراضي");
    load();
  };

  const remove = async (id: string) => {
    await retryBackendCall(async () => await supabase.from("addresses").delete().eq("id", id), 8, 700);
    toast("تم حذف العنوان");
    load();
  };

  const save = async () => {
    if (!user) return;
    if (!draft.label || !draft.city || !draft.street) {
      toast.error("أكمل بيانات العنوان");
      return;
    }
    const isFirst = list.length === 0;
    const { error } = await retryBackendCall(
      async () => await supabase.from("addresses").insert({
        user_id: user.id,
        label: draft.label,
        city: draft.city,
        district: draft.district || null,
        street: draft.street,
        building: draft.building || null,
        notes: draft.notes || null,
        is_default: isFirst,
      }),
      8,
      700,
    );
    if (error) {
      toast.error(isRetryableBackendError(error) ? "الخدمة كانت بطيئة للحظات، أعد الحفظ الآن" : "تعذّرت الإضافة");
      return;
    }
    setDraft({ label: "المنزل", city: "القاهرة", district: "", street: "", building: "", notes: "" });
    setAdding(false);
    toast.success("تمت إضافة العنوان");
    load();
  };

  const formatAddress = (a: Addr) =>
    [a.street, a.building, a.district, a.city].filter(Boolean).join("، ");

  return (
    <div className="space-y-5">
      <BackHeader title="العناوين" subtitle={`${list.length} عناوين محفوظة`} accent="حسابي" />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => {
            const Icon = a.label.includes("عمل") ? Briefcase : Home;
            return (
              <div key={a.id} className={`glass-strong relative rounded-2xl p-4 shadow-soft ${a.is_default ? "ring-2 ring-primary" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-extrabold">{a.label}</p>
                      {a.is_default && <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">افتراضي</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatAddress(a)}</p>
                    {a.notes && <p className="mt-1 text-[11px] text-muted-foreground">📝 {a.notes}</p>}
                    <div className="mt-2 flex gap-2">
                      {!a.is_default && (
                        <button onClick={() => setDefault(a.id)} className="rounded-full bg-foreground/5 px-3 py-1 text-[11px] font-bold">جعله افتراضيًا</button>
                      )}
                      <button onClick={() => remove(a.id)} className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-bold text-destructive">
                        <Trash2 className="h-3 w-3" /> حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding ? (
        <div className="glass-strong space-y-2 rounded-2xl p-4 shadow-soft">
          <Inp v={draft.label} on={(v) => setDraft({ ...draft, label: v })} ph="تسمية (المنزل، العمل)" />
          <div className="grid grid-cols-2 gap-2">
            <Inp v={draft.city} on={(v) => setDraft({ ...draft, city: v })} ph="المدينة" />
            <Inp v={draft.district} on={(v) => setDraft({ ...draft, district: v })} ph="الحي" />
          </div>
          <Inp v={draft.street} on={(v) => setDraft({ ...draft, street: v })} ph="الشارع ورقم العقار" />
          <Inp v={draft.building} on={(v) => setDraft({ ...draft, building: v })} ph="الدور / الشقة (اختياري)" />
          <Inp v={draft.notes} on={(v) => setDraft({ ...draft, notes: v })} ph="ملاحظات للمندوب (اختياري)" />
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-pill">
              <Check className="mx-auto h-4 w-4" />
            </button>
            <button onClick={() => setAdding(false)} className="flex-1 rounded-2xl bg-foreground/10 py-3 text-sm font-bold">إلغاء</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="glass flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-primary shadow-soft">
          <Plus className="h-4 w-4" /> إضافة عنوان جديد
        </button>
      )}

      <div className="glass-strong rounded-2xl p-4 shadow-soft">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" /> اضغط على العنوان لتعيينه افتراضيًا أو حذفه
        </div>
      </div>
    </div>
  );
};

const Inp = ({ v, on, ph }: { v: string; on: (s: string) => void; ph: string }) => (
  <input
    value={v}
    onChange={(e) => on(e.target.value)}
    placeholder={ph}
    className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm outline-none"
  />
);

export default Addresses;
