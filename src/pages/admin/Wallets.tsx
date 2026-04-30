import { useEffect, useMemo, useState } from "react";
import { Wallet, Search, Loader2, ShieldCheck, Receipt, User as UserIcon, Phone, AlertCircle } from "lucide-react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAdminRoles } from "@/components/admin/RoleGuard";

type Profile = { id: string; full_name: string | null; phone: string | null };
type Topup = {
  id: string; user_id: string; amount: number; method: string;
  transfer_reference: string; note: string | null; performed_by_name: string | null;
  status: string; created_at: string;
};

const METHODS = [
  { v: "vodafone_cash", l: "فودافون كاش", color: "bg-[hsl(0_70%_50%)]/10 text-[hsl(0_70%_45%)]" },
  { v: "instapay", l: "إنستاباي", color: "bg-info/10 text-info" },
  { v: "bank_transfer", l: "تحويل بنكي", color: "bg-primary/10 text-primary" },
  { v: "cash", l: "كاش", color: "bg-success/10 text-success" },
];

export default function AdminWallets() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("store_manager");

  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<Topup[]>([]);

  // Form
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("vodafone_cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const valid = useMemo(() => {
    const a = Number(amount);
    return selected && a > 0 && a <= 100000 && reference.trim().length >= 4;
  }, [amount, reference, selected]);

  // Search profiles
  useEffect(() => {
    if (search.trim().length < 2) { setMatches([]); return; }
    let cancel = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const term = search.trim();
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(8);
      if (!cancel) {
        setMatches((data ?? []) as Profile[]);
        setSearching(false);
      }
    }, 300);
    return () => { cancel = true; clearTimeout(t); };
  }, [search]);

  // Load balance + history when user selected
  useEffect(() => {
    if (!selected) { setBalance(null); setHistory([]); return; }
    (async () => {
      const [b, h] = await Promise.all([
        supabase.from("wallet_balances").select("balance").eq("user_id", selected.id).maybeSingle(),
        supabase.from("wallet_topup_requests" as never).select("*").eq("user_id", selected.id).order("created_at", { ascending: false }).limit(20),
      ]);
      setBalance(Number((b.data as { balance: number } | null)?.balance ?? 0));
      setHistory(((h.data ?? []) as unknown) as Topup[]);
    })();
  }, [selected]);

  const handleTopup = async () => {
    if (!selected || !valid) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("admin_topup_wallet" as never, {
        _user_id: selected.id,
        _amount: Number(amount),
        _method: method,
        _transfer_reference: reference.trim(),
        _note: note.trim() || null,
      } as never);
      if (error) throw error;
      const result = data as { ok: boolean; new_balance: number };
      toast.success(`تم شحن ${fmtMoney(Number(amount))} — الرصيد الجديد ${fmtMoney(result.new_balance)}`);
      setBalance(result.new_balance);
      setAmount(""); setReference(""); setNote("");
      // Reload history
      const { data: h } = await supabase.from("wallet_topup_requests" as never)
        .select("*").eq("user_id", selected.id).order("created_at", { ascending: false }).limit(20);
      setHistory(((h ?? []) as unknown) as Topup[]);
    } catch (err) {
      const msg = (err as Error).message;
      const map: Record<string, string> = {
        "duplicate_transfer_reference": "رقم التحويل مستخدم من قبل — تحقق من السجل.",
        "transfer_reference_required": "رقم التحويل إلزامي (4 أحرف على الأقل).",
        "invalid_amount": "المبلغ غير صحيح.",
        "amount_too_large": "المبلغ يتجاوز الحد المسموح (100,000).",
        "user_not_found": "العميل غير موجود.",
        "forbidden": "ليست لديك صلاحية الشحن.",
      };
      const friendly = Object.entries(map).find(([k]) => msg.includes(k))?.[1] ?? msg;
      toast.error(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <>
        <MobileTopbar title="المحافظ" />
        <div className="p-8 text-center" dir="rtl">
          <ShieldCheck className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" />
          <p className="font-display text-[16px]">صلاحية المحافظ للأدمن أو مدير المتجر فقط</p>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileTopbar title="شحن المحافظ" />
      <div className="px-4 lg:px-6 pt-2 pb-6 max-w-3xl mx-auto space-y-4" dir="rtl">

        {/* Search */}
        <div className="bg-surface rounded-2xl border border-border/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-[13px] font-bold">
            <UserIcon className="h-4 w-4 text-primary" /> اختر العميل
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الهاتف"
              className="w-full bg-surface-muted rounded-xl h-11 pr-10 pl-4 text-[14px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {searching && <p className="text-[12px] text-foreground-tertiary">جارٍ البحث…</p>}
          {matches.length > 0 && !selected && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelected(m); setSearch(""); setMatches([]); }}
                  className="w-full flex items-center justify-between bg-surface-muted hover:bg-primary/5 rounded-xl p-3 text-right press"
                >
                  <div>
                    <p className="text-[13.5px] font-semibold">{m.full_name ?? "بدون اسم"}</p>
                    <p className="text-[11.5px] text-foreground-tertiary num flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" /> {m.phone ?? "—"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <>
            {/* Selected user card */}
            <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-4 shadow-elegant">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] opacity-90">{selected.full_name ?? "بدون اسم"}</p>
                  <p className="num text-[12px] opacity-80">{selected.phone ?? "—"}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[11px] underline opacity-90">تغيير</button>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[11px] opacity-80">الرصيد الحالي</p>
                  <p className="font-display text-[28px] num leading-none mt-0.5">
                    {balance === null ? "…" : fmtMoney(balance)}
                  </p>
                </div>
                <Wallet className="h-8 w-8 opacity-70" />
              </div>
            </div>

            {/* Top-up form */}
            <div className="bg-surface rounded-2xl border border-border/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-bold">
                <Receipt className="h-4 w-4 text-primary" /> تسجيل شحن يدوي
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground-secondary mb-1.5">المبلغ (ج.م) *</label>
                <input
                  type="number" inputMode="decimal" step="0.01" min="1" max="100000"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-12 rounded-xl bg-surface-muted px-3 text-[18px] num text-right font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground-secondary mb-1.5">طريقة الدفع *</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.v}
                      onClick={() => setMethod(m.v)}
                      className={cn(
                        "h-11 rounded-xl text-[12.5px] font-semibold press border",
                        method === m.v ? "border-primary bg-primary text-primary-foreground" : `border-border/40 ${m.color}`
                      )}
                    >
                      {m.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground-secondary mb-1.5">
                  رقم عملية التحويل * <span className="text-destructive">(إلزامي للتدقيق)</span>
                </label>
                <input
                  value={reference} onChange={(e) => setReference(e.target.value)}
                  placeholder="مثال: VC-789456123"
                  className="w-full h-11 rounded-xl bg-surface-muted px-3 text-[14px] num text-right border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {reference.length > 0 && reference.trim().length < 4 && (
                  <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> 4 أحرف على الأقل
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground-secondary mb-1.5">ملاحظة (اختياري)</label>
                <input
                  value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="مثال: شحن بعد تأكيد التحويل من الإدارة"
                  className="w-full h-11 rounded-xl bg-surface-muted px-3 text-[13px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                onClick={handleTopup}
                disabled={!valid || submitting}
                className="w-full h-13 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-[14.5px] press disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "جارٍ الشحن…" : `شحن ${amount ? fmtMoney(Number(amount)) : "—"}`}
              </button>

              <p className="text-[11px] text-foreground-tertiary text-center">
                ستُسجَّل العملية باسمك ولن تكون قابلة للتعديل أو الحذف.
              </p>
            </div>

            {/* History */}
            <div className="bg-surface rounded-2xl border border-border/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                <h3 className="text-[13px] font-bold">سجل الشحن (آخر 20)</h3>
                <span className="text-[11px] text-foreground-tertiary">غير قابل للتعديل</span>
              </div>
              {history.length === 0 ? (
                <p className="p-6 text-center text-[13px] text-foreground-tertiary">لا توجد عمليات شحن سابقة</p>
              ) : (
                <ul className="divide-y divide-border/40">
                  {history.map((t) => {
                    const m = METHODS.find((x) => x.v === t.method);
                    return (
                      <li key={t.id} className="p-3 flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-[10px] font-bold", m?.color)}>
                          {m?.l.slice(0, 4)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13.5px] font-bold num">{fmtMoney(Number(t.amount))}</p>
                            <p className="text-[11px] text-foreground-tertiary">
                              {new Date(t.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                            </p>
                          </div>
                          <p className="text-[11.5px] text-foreground-secondary truncate num">
                            #{t.transfer_reference} • بواسطة {t.performed_by_name ?? "—"}
                          </p>
                          {t.note && <p className="text-[11px] text-foreground-tertiary truncate">{t.note}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
