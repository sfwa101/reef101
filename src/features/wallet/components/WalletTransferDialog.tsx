import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Phone, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";

/**
 * WalletTransferDialog — peer-to-peer rivermad balance transfer.
 * Calls the `wallet_transfer` RPC and surfaces the canonical error
 * codes (insufficient / recipient_not_found / self_transfer / limit_exceeded
 * / invalid_phone) as Arabic toasts.
 */
export const WalletTransferDialog = ({
  onClose,
  balance,
  onDone,
}: {
  onClose: () => void;
  balance: number;
  onDone: (newBal: number) => void;
}) => {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const amt = Number(amount || 0);
  const valid =
    amt > 0 && amt <= balance && amt <= 5000 && phone.replace(/\D/g, "").length >= 10;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("wallet_transfer", {
      _recipient_phone: phone,
      _amount: amt,
      _note: note || undefined,
    });
    setBusy(false);
    if (error) {
      const msg = error.message || "";
      if (msg.includes("insufficient")) toast.error("الرصيد غير كافٍ");
      else if (msg.includes("recipient_not_found")) toast.error("لا يوجد مستخدم مسجل بهذا الرقم");
      else if (msg.includes("self_transfer")) toast.error("لا يمكنك التحويل لنفسك");
      else if (msg.includes("limit_exceeded")) toast.error("الحد الأقصى للتحويل 5000 ج.م");
      else if (msg.includes("invalid_phone")) toast.error("رقم الهاتف غير صحيح");
      else toast.error("تعذّر التحويل");
      return;
    }
    if (data) {
      fireMiniConfetti();
      toast.success(`تم تحويل ${toLatin(amt)} ج.م بنجاح ✅`);
      onDone(balance - amt);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="font-display text-lg font-extrabold">تحويل رصيد</h2>
              <p className="text-[11px] text-muted-foreground">إلى أي مستخدم في ريف المدينة</p>
            </div>
          </div>
          <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-extrabold text-primary">
            متاح: {toLatin(Math.round(balance))} ج
          </span>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <Phone className="h-3 w-3" /> رقم هاتف المستلم
          </span>
          <input
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder="01xxxxxxxxx"
            className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">
            المبلغ (ج.م) · حد أقصى 5000
          </span>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-lg font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <div className="mb-3 grid grid-cols-4 gap-2">
          {[50, 100, 200, 500].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="rounded-xl bg-foreground/5 py-2 text-xs font-extrabold transition active:scale-95"
            >
              {toLatin(v)}
            </button>
          ))}
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">
            ملاحظة (اختياري)
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 40))}
            placeholder="مثال: مصاريف الأسبوع"
            className="w-full rounded-xl bg-foreground/5 px-3 py-2.5 text-sm font-bold outline-none"
          />
        </label>

        <div className="mb-4 rounded-xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20">
          <p className="text-[10px] font-bold leading-relaxed text-amber-700 dark:text-amber-300">
            ⚠️ التحويل فوري ولا يمكن إلغاؤه. تأكد من رقم المستلم.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={!valid || busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill transition active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          تحويل {amt > 0 ? `${toLatin(amt)} ج.م` : ""}
        </button>
      </motion.div>
    </motion.div>
  );
};
