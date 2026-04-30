import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { RoleGuard } from "@/components/admin/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Row = {
  driver_id: string; full_name: string; driver_type: string;
  cash_in_hand: number; earned_balance: number; lifetime_earned: number; lifetime_settled: number;
};

export default function DriverSettlements() {
  return (
    <RoleGuard roles={["admin", "finance"]}>
      <MobileTopbar title="تصفية المناديب" />
      <Inner />
    </RoleGuard>
  );
}

function Inner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [picked, setPicked] = useState<Row | null>(null);
  const [form, setForm] = useState({ amount: "", kind: "cash_handover", bank_reference: "", notes: "" });

  const load = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from("driver_wallets")
      .select("*, drivers!inner(full_name, driver_type)")
      .order("cash_in_hand", { ascending: false });
    type DwRow = { driver_id: string; cash_in_hand: number; earned_balance: number; lifetime_earned: number; lifetime_settled: number; drivers: { full_name: string; driver_type: string } };
    setRows((data ?? []).map((r: DwRow) => ({
      driver_id: r.driver_id, cash_in_hand: r.cash_in_hand, earned_balance: r.earned_balance,
      lifetime_earned: r.lifetime_earned, lifetime_settled: r.lifetime_settled,
      full_name: r.drivers.full_name, driver_type: r.drivers.driver_type,
    })));
  };
  useEffect(() => { load(); }, []);

  const settle = async () => {
    if (!picked || !form.amount) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("driver_settle_cash", {
      _driver_id: picked.driver_id, _amount: Number(form.amount), _kind: form.kind,
      _bank_reference: form.bank_reference || null, _notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("تمت التصفية");
    setPicked(null); setForm({ amount: "", kind: "cash_handover", bank_reference: "", notes: "" }); load();
  };

  return (
    <div dir="rtl" className="p-4 max-w-3xl mx-auto space-y-3">
      <h1 className="font-display text-[20px]">تصفية العهدة المالية</h1>
      {rows.map(r => (
        <Card key={r.driver_id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-display text-[15px]">{r.full_name}</p>
                <p className="text-[11px] text-foreground-tertiary">{r.driver_type}</p>
              </div>
              <Dialog open={picked?.driver_id === r.driver_id} onOpenChange={o => !o && setPicked(null)}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setPicked(r)}>تصفية</Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>تصفية {r.full_name}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>النوع</Label>
                      <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash_handover">استلام كاش COD ({r.cash_in_hand} ج.م)</SelectItem>
                          <SelectItem value="commission_payout">صرف عمولة ({r.earned_balance} ج.م)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>المبلغ</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                    <div><Label>مرجع بنكي</Label><Input value={form.bank_reference} onChange={e => setForm({ ...form, bank_reference: e.target.value })} /></div>
                    <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                    <Button onClick={settle} className="w-full">تأكيد التصفية</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="bg-amber-500/10 rounded-md p-2">
                <p className="text-foreground-tertiary">كاش بحوزته</p>
                <p className="font-display text-[16px] num text-amber-700 dark:text-amber-400">{r.cash_in_hand} ج.م</p>
              </div>
              <div className="bg-emerald-500/10 rounded-md p-2">
                <p className="text-foreground-tertiary">عمولات مستحقة</p>
                <p className="font-display text-[16px] num text-emerald-700 dark:text-emerald-400">{r.earned_balance} ج.م</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {!rows.length && <p className="text-center text-foreground-tertiary py-8">لا توجد محافظ.</p>}
    </div>
  );
}
