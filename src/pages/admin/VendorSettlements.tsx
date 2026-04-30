import { useEffect, useState, useCallback } from "react";
import { Loader2, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { Badge } from "@/components/ui/badge";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";

type Row = {
  vendor_id: string;
  available_balance: number;
  pending_balance: number;
  lifetime_earned: number;
  lifetime_paid_out: number;
  vendor_name?: string;
  vendor_type?: string;
};

export default function VendorSettlements() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<{ amount: string; method: string; reference: string; notes: string }>({
    amount: "", method: "bank_transfer", reference: "", notes: "",
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const [{ data: ws }, { data: vs }] = await Promise.all([
      sb.from("vendor_wallets").select("*"),
      sb.from("vendors").select("id,name,vendor_type"),
    ]);
    const vmap: Record<string, { name: string; type: string }> = {};
    for (const v of (vs ?? []) as Array<{ id: string; name: string; vendor_type: string }>) vmap[v.id] = { name: v.name, type: v.vendor_type };
    const merged = ((ws ?? []) as Row[]).map(w => ({
      ...w,
      vendor_name: vmap[w.vendor_id]?.name ?? "—",
      vendor_type: vmap[w.vendor_id]?.type,
    })).sort((a, b) => (b.available_balance - a.available_balance));
    setRows(merged);
  }, []);
  useEffect(() => { load(); }, [load]);

  const settle = async (vendorId: string, available: number) => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { toast.error("أدخل مبلغ صحيح"); return; }
    if (amount > available) { toast.error("المبلغ أكبر من الرصيد المتاح"); return; }
    if (!form.reference.trim()) { toast.error("مرجع التحويل مطلوب"); return; }
    setBusyId(vendorId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("settle_vendor_payout", {
      _vendor_id: vendorId,
      _amount: amount,
      _method: form.method,
      _reference: form.reference.trim(),
      _notes: form.notes.trim() || null,
    });
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت التسوية بنجاح");
    setActiveId(null);
    setForm({ amount: "", method: "bank_transfer", reference: "", notes: "" });
    load();
  };

  return (
    <>
      <MobileTopbar title="تسويات التجار" />
      <div className="px-4 lg:px-6 pt-2 pb-24 max-w-3xl mx-auto">
        {rows === null ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface-muted animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <IOSCard className="text-center text-foreground-tertiary text-[13px] py-10">لا توجد محافظ تجار بعد</IOSCard>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <IOSCard key={r.vendor_id} className="!p-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-success/15 text-success flex items-center justify-center"><Banknote className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[14px] truncate">{r.vendor_name}</p>
                      {r.vendor_type && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{r.vendor_type}</Badge>}
                    </div>
                    <div className="flex gap-3 mt-1 text-[11px] flex-wrap">
                      <span className="text-success font-semibold">متاح: {fmtMoney(r.available_balance)}</span>
                      <span className="text-warning">معلق: {fmtMoney(r.pending_balance)}</span>
                      <span className="text-foreground-tertiary">مدفوع: {fmtMoney(r.lifetime_paid_out)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveId(activeId === r.vendor_id ? null : r.vendor_id)}
                    disabled={r.available_balance <= 0}
                    className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold press disabled:opacity-40"
                  >
                    تسوية
                  </button>
                </div>

                {activeId === r.vendor_id && (
                  <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-2">
                    <input
                      type="number" placeholder="المبلغ" value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="h-10 px-3 rounded-lg bg-surface-muted text-[13px] num text-right border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    />
                    <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                      className="h-10 px-3 rounded-lg bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none">
                      <option value="bank_transfer">تحويل بنكي</option>
                      <option value="instapay">انستاباي</option>
                      <option value="vodafone_cash">فودافون كاش</option>
                      <option value="cash">نقداً</option>
                    </select>
                    <input placeholder="مرجع التحويل" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                      className="col-span-2 h-10 px-3 rounded-lg bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none" dir="ltr" />
                    <input placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="col-span-2 h-10 px-3 rounded-lg bg-surface-muted text-[13px] border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none" />
                    <button
                      onClick={() => settle(r.vendor_id, r.available_balance)}
                      disabled={busyId === r.vendor_id}
                      className="col-span-2 h-10 rounded-lg bg-success text-white font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 press"
                    >
                      {busyId === r.vendor_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                      تأكيد التسوية وتصفير الرصيد
                    </button>
                  </div>
                )}
              </IOSCard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
