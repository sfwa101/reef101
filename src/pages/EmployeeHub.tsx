import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/context/AuthContext";
import { fmtMoney } from "@/lib/format";
import { Loader2, MapPin, LogIn, LogOut, Plus, Wallet, ShieldAlert, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Attendance = { id: string; check_in_at: string; check_out_at: string | null };
type AdvanceReq = {
  id: string; kind: string; amount: number; reason: string;
  status: string; created_at: string; rejection_reason: string | null;
};

const KIND_LABEL: Record<string, string> = {
  advance: "سلفة", petty_cash: "نثرية", reimbursement: "استرداد",
};

export default function EmployeeHub() {
  const { user } = useAuth();
  const { role, branchId, loading: roleLoading } = useUserRole();
  const allowed = !!role && role !== "vendor";
  const [todayAtt, setTodayAtt] = useState<Attendance | null>(null);
  const [requests, setRequests] = useState<AdvanceReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kind: "advance", amount: "", reason: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const [att, reqs] = await Promise.all([
      supabase.from("staff_attendance")
        .select("id, check_in_at, check_out_at")
        .eq("user_id", user.id)
        .gte("check_in_at", start.toISOString())
        .order("check_in_at", { ascending: false })
        .limit(1).maybeSingle(),
      supabase.from("staff_advance_requests")
        .select("id, kind, amount, reason, status, created_at, rejection_reason")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setTodayAtt((att.data as Attendance | null) ?? null);
    setRequests((reqs.data as AdvanceReq[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); }, [allowed, user]);

  const checkIn = async () => {
    setBusy(true);
    const finish = (lat: number | null, lng: number | null) => {
      supabase.from("staff_attendance")
        .insert({ user_id: user!.id, branch_id: branchId, check_in_lat: lat, check_in_lng: lng })
        .then(() => { toast.success("تم تسجيل حضورك"); load(); })
        .then(undefined, (e) => toast.error(e.message))
        .finally(() => setBusy(false));
    };
    if (!navigator.geolocation) return finish(null, null);
    navigator.geolocation.getCurrentPosition(
      (pos) => finish(pos.coords.latitude, pos.coords.longitude),
      () => finish(null, null), { timeout: 5000 },
    );
  };

  const checkOut = async () => {
    if (!todayAtt) return;
    setBusy(true);
    const finish = async (lat: number | null, lng: number | null) => {
      const { error } = await supabase.from("staff_attendance")
        .update({ check_out_at: new Date().toISOString(), check_out_lat: lat, check_out_lng: lng })
        .eq("id", todayAtt.id);
      if (error) toast.error(error.message); else { toast.success("تم تسجيل انصرافك"); load(); }
      setBusy(false);
    };
    if (!navigator.geolocation) return finish(null, null);
    navigator.geolocation.getCurrentPosition(
      (pos) => finish(pos.coords.latitude, pos.coords.longitude),
      () => finish(null, null), { timeout: 5000 },
    );
  };

  const submitRequest = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { toast.error("أدخل مبلغًا صحيحًا"); return; }
    if (form.reason.trim().length < 3) { toast.error("اكتب سببًا واضحًا"); return; }
    setBusy(true);
    const { error } = await supabase.from("staff_advance_requests").insert({
      user_id: user!.id, branch_id: branchId, kind: form.kind,
      amount: amt, reason: form.reason.trim(),
    });
    if (error) toast.error(error.message);
    else { toast.success("تم إرسال طلبك للمدير"); setShowForm(false); setForm({ kind: "advance", amount: "", reason: "" }); load(); }
    setBusy(false);
  };

  if (roleLoading || loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!allowed) return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div><ShieldAlert className="mx-auto h-12 w-12 text-destructive" /><p className="mt-3 font-bold">صلاحية الموظف مطلوبة</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-extrabold">لوحة الموظف</h1>
        <p className="text-xs text-muted-foreground">الحضور والسلف والنثريّة</p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><Clock className="h-4 w-4" /> الحضور اليومي</h2>
        {todayAtt ? (
          <>
            <p className="text-sm">سجلت دخولك الساعة <span className="font-bold">{new Date(todayAtt.check_in_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span></p>
            {todayAtt.check_out_at ? (
              <p className="mt-1 text-sm text-muted-foreground">انصرفت الساعة {new Date(todayAtt.check_out_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</p>
            ) : (
              <button onClick={checkOut} disabled={busy} className="mt-3 w-full rounded-full bg-destructive py-3 font-display font-extrabold text-destructive-foreground">
                <LogOut className="me-1 inline h-4 w-4" /> تسجيل انصراف
              </button>
            )}
          </>
        ) : (
          <button onClick={checkIn} disabled={busy} className="w-full rounded-full bg-primary py-3 font-display font-extrabold text-primary-foreground">
            <LogIn className="me-1 inline h-4 w-4" /> تسجيل حضور <MapPin className="ms-1 inline h-4 w-4" />
          </button>
        )}
      </section>

      <section className="mt-5 rounded-3xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold"><Wallet className="h-4 w-4" /> طلباتي</h2>
          <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">
            <Plus className="me-1 inline h-3 w-3" /> طلب جديد
          </button>
        </div>

        {showForm && (
          <div className="mb-4 space-y-2 rounded-2xl border border-border bg-background p-3">
            <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm">
              <option value="advance">سلفة على الراتب</option>
              <option value="petty_cash">نثريّة (مصروف فوري)</option>
              <option value="reimbursement">استرداد مبلغ صرفته</option>
            </select>
            <input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              inputMode="decimal" placeholder="المبلغ (ج.م)"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" />
            <textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={2} placeholder="السبب أو التفاصيل"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" />
            <button onClick={submitRequest} disabled={busy}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground">إرسال للمدير</button>
          </div>
        )}

        {requests.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">لا توجد طلبات</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-start justify-between rounded-2xl bg-muted/40 p-3">
                <div className="flex-1">
                  <p className="font-bold">{KIND_LABEL[r.kind] ?? r.kind} — {fmtMoney(r.amount)}</p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                  {r.rejection_reason && <p className="mt-1 text-xs text-destructive">سبب الرفض: {r.rejection_reason}</p>}
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  r.status === "approved" || r.status === "paid" ? "bg-success/15 text-success" :
                  r.status === "rejected" ? "bg-destructive/15 text-destructive" :
                  "bg-warning/15 text-warning"
                }`}>
                  {r.status === "approved" || r.status === "paid" ? <CheckCircle2 className="h-3 w-3" /> :
                   r.status === "rejected" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {r.status === "pending" ? "قيد المراجعة" : r.status === "approved" ? "موافق" : r.status === "rejected" ? "مرفوض" : "تم الصرف"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
