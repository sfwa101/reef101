import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { fmtMoney, toLatin } from "@/lib/format";
import { fireConfetti } from "@/lib/confetti";
import { WA_NUMBER } from "../types/cart.types";
import { isMobileWaContext, openWhatsApp } from "@/lib/whatsapp";

const rechargePresets = [200, 500, 1000, 2000];

type Props = {
  onClose: () => void;
  userId: string;
  currentBalance: number;
  shortfall: number;
};

/**
 * Inline wallet top-up dialog. Drives the recharge handoff into WhatsApp,
 * staying behaviorally identical to the original Cart implementation.
 */
export const RechargeDialog = ({ onClose, userId, currentBalance, shortfall }: Props) => {
  const suggested = Math.max(200, Math.ceil(shortfall / 100) * 100);
  const [amount, setAmount] = useState<number>(suggested);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState("instapay");
  const finalAmount = custom ? Number(custom.replace(/\D/g, "")) : amount;

  const submit = () => {
    if (!finalAmount || finalAmount < 50) {
      toast.error("الحد الأدنى 50 ج.م");
      return;
    }
    const code = userId.slice(0, 8).toUpperCase();
    const text = `🌿 *ريف المدينة - شحن محفظة*\n\n• كود العميل: ${code}\n• المبلغ: ${finalAmount} ج.م\n• وسيلة الدفع: ${method}\n\nسأرسل إثبات الدفع الآن.`;
    const result = openWhatsApp(
      { phone: WA_NUMBER, text },
      { preferLocation: isMobileWaContext(), source: "RechargeDialog:submit" },
    );
    if (!result.ok) toast.error("تعذر فتح واتساب — جرّب مرة أخرى");
    fireConfetti();
    toast.success("تم إرسال طلب الشحن 🎉");
    onClose();
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
        className="w-full max-w-md rounded-t-[24px] bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-[24px]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold">شحن المحفظة</h2>
            <p className="text-[11px] text-muted-foreground">
              رصيدك الحالي: {toLatin(Math.round(currentBalance))} ج.م
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {shortfall > 0 && (
          <div className="mb-4 rounded-2xl bg-accent/15 p-3 text-[11px] font-bold text-accent-foreground">
            تحتاج {toLatin(Math.round(shortfall))} ج.م إضافية لإتمام طلبك
          </div>
        )}

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">قيم سريعة (ج.م)</p>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {rechargePresets.map((p) => {
            const active = !custom && amount === p;
            return (
              <button
                key={p}
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={`rounded-[12px] py-2.5 text-xs font-extrabold transition ${
                  active ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5"
                }`}
              >
                {toLatin(p)}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-[12px] bg-foreground/5 px-3 py-2.5">
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
            placeholder="مبلغ مخصص"
            className="flex-1 bg-transparent text-sm font-bold outline-none"
            dir="ltr"
          />
          <span className="text-xs font-bold text-muted-foreground">ج.م</span>
        </div>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">طريقة الدفع</p>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {[
            { id: "instapay", label: "إنستا باي" },
            { id: "vodafone-cash", label: "فودافون كاش" },
            { id: "bank", label: "تحويل بنكي" },
            { id: "cash", label: "كاش" },
          ].map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`rounded-[12px] border-2 py-2.5 text-xs font-extrabold transition ${
                  active ? "border-primary bg-primary-soft text-primary" : "border-border bg-background"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill active:scale-[0.98]"
        >
          متابعة عبر واتساب · {fmtMoney(finalAmount || 0)}
        </button>
      </motion.div>
    </motion.div>
  );
};
