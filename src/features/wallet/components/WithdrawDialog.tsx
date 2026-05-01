/**
 * WithdrawDialog — Phase 22 affiliate payout module.
 * Lightweight dialog that submits to the `request_user_payout` RPC.
 * Funds are locked via a pending wallet_transactions debit on the server.
 */
import { useState } from "react";
import { Banknote, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Method = "bank_transfer" | "vodafone_cash" | "instapay";
const MIN_AMOUNT = 500;

const METHODS: { id: Method; label: string; placeholder: string; helper: string }[] = [
  { id: "vodafone_cash", label: "فودافون كاش", placeholder: "010xxxxxxxx", helper: "رقم محفظة فودافون كاش" },
  { id: "instapay", label: "إنستاباي", placeholder: "name@instapay", helper: "عنوان InstaPay" },
  { id: "bank_transfer", label: "تحويل بنكي", placeholder: "EG__ ____ ____ ____", helper: "رقم IBAN كامل" },
];

const Schema = z.object({
  amount: z.number().min(MIN_AMOUNT, `الحد الأدنى ${MIN_AMOUNT} ج`).max(1_000_000),
  method: z.enum(["bank_transfer", "vodafone_cash", "instapay"]),
  account: z.string().trim().min(3, "أدخل بيانات الحساب").max(120),
  holder: z.string().trim().min(2, "أدخل اسم صاحب الحساب").max(120),
});

export function WithdrawDialog({
  open,
  onOpenChange,
  availableBalance,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  availableBalance: number;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("vodafone_cash");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [busy, setBusy] = useState(false);

  const meta = METHODS.find((m) => m.id === method)!;

  const submit = async () => {
    const parsed = Schema.safeParse({
      amount: Number(amount),
      method,
      account,
      holder,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    if (parsed.data.amount > availableBalance) {
      toast.error("المبلغ أكبر من رصيدك المتاح");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("request_user_payout", {
        _amount: parsed.data.amount,
        _method: parsed.data.method,
        _bank_details: {
          account: parsed.data.account,
          holder: parsed.data.holder,
        },
      });
      if (error) throw error;
      toast.success("تم إرسال طلب السحب — قيد المراجعة", {
        description: `المتبقي: ${(data as any)?.available_after ?? "—"} ج`,
      });
      onOpenChange(false);
      setAmount(""); setAccount(""); setHolder("");
      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "تعذّر إرسال الطلب";
      toast.error(msg.includes("insufficient") ? "رصيد غير كافٍ" :
                  msg.includes("below_minimum") ? `الحد الأدنى ${MIN_AMOUNT} ج` :
                  msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" /> سحب الأرباح
          </DialogTitle>
          <DialogDescription>
            رصيدك المتاح: <b className="text-foreground">{availableBalance.toFixed(2)} ج</b> · الحد الأدنى للسحب {MIN_AMOUNT} ج
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          <div>
            <Label className="text-xs">المبلغ (ج.م)</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={MIN_AMOUNT}
              max={availableBalance}
              placeholder={String(MIN_AMOUNT)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">طريقة الاستلام</Label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition press ring-1 ${
                    method === m.id
                      ? "bg-primary text-primary-foreground ring-primary shadow-soft"
                      : "bg-card ring-border/50 text-foreground-secondary hover:bg-accent/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">{meta.helper}</Label>
            <Input
              placeholder={meta.placeholder}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <Label className="text-xs">اسم صاحب الحساب</Label>
            <Input
              placeholder="الاسم الثلاثي"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              maxLength={120}
            />
          </div>

          <p className="text-[11px] text-foreground-tertiary leading-relaxed">
            سيتم تجميد المبلغ فوراً وستتم مراجعة الطلب من قِبل الإدارة المالية خلال 24-72 ساعة.
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="flex-1">
            إلغاء
          </Button>
          <Button onClick={submit} disabled={busy} className="flex-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الطلب"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
