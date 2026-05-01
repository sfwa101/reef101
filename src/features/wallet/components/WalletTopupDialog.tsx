import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Banknote, Building2, Gift, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { toLatin, fmtMoney } from "@/lib/format";
import { fireConfetti } from "@/lib/confetti";
import {
  TOPUP_PRESETS,
  type PaymentMethod,
} from "@/features/wallet/types/wallet.types";
import { bonusFor } from "@/features/wallet/lib/walletAdvisor";
import { isMobileWaContext, openWhatsApp } from "@/lib/whatsapp";

const paymentMethods: PaymentMethod[] = [
  { id: "instapay", label: "إنستا باي", icon: Banknote, sub: "تحويل بنكي فوري" },
  { id: "vodafone-cash", label: "فودافون كاش", icon: Smartphone, sub: "تحويل فوري" },
  { id: "bank", label: "تحويل بنكي", icon: Building2, sub: "حساب البنك" },
  { id: "cash", label: "كاش عند المندوب", icon: Banknote, sub: "تحصيل مباشر" },
];

/**
 * WalletTopupDialog — wallet top-up flow.
 * Composes preset / custom amount + payment method selection,
 * then hands off to WhatsApp for proof-of-payment.
 */
export const WalletTopupDialog = ({
  onClose,
  phone,
  userId,
}: {
  onClose: () => void;
  phone: string;
  userId: string;
}) => {
  const [amount, setAmount] = useState<number>(500);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<string>(paymentMethods[0].id);

  const finalAmount = custom ? Number(custom.replace(/\D/g, "")) : amount;
  const bonus = bonusFor(finalAmount);

  const submit = () => {
    if (!finalAmount || finalAmount < 50) {
      toast.error("الحد الأدنى للشحن 50 ج.م");
      return;
    }
    const m = paymentMethods.find((p) => p.id === method)!;
    const customerCode = userId.slice(0, 8).toUpperCase();
    const text = `🌿 *ريف المدينة - شحن محفظة*\n\n• كود العميل: ${customerCode}\n• المبلغ: ${finalAmount} ج.م${
      bonus ? `\n• المكافأة: ${bonus.label}` : ""
    }\n• وسيلة الدفع: ${m.label}\n\nسأقوم بإرسال إثبات الدفع الآن.`;
    const result = openWhatsApp(
      { phone, text },
      { preferLocation: isMobileWaContext(), source: "WalletTopupDialog:submit" },
    );
    if (!result.ok) toast.error("تعذر فتح واتساب — جرّب مرة أخرى");
    fireConfetti();
    toast.success("تم إرسال طلب الشحن بنجاح! 🎉", {
      description: bonus ? `ستحصل على: ${bonus.label}` : undefined,
    });
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
        className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold">شحن المحفظة</h2>
            <p className="text-[11px] text-muted-foreground">اختر القيمة وطريقة الدفع</p>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {bonus && (
            <motion.div
              key={bonus.label}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary/15 to-accent/15 p-3 ring-1 ring-primary/20"
            >
              <Gift className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-[11px] font-extrabold text-primary">🎁 {bonus.label}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">قيم سريعة (ج.م)</p>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {TOPUP_PRESETS.map((p) => {
            const active = !custom && amount === p;
            return (
              <button
                key={p}
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={`rounded-xl py-2.5 text-xs font-extrabold transition ${
                  active ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5 text-foreground"
                }`}
              >
                {toLatin(p)}
              </button>
            );
          })}
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">مبلغ مخصص</span>
          <div className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2.5">
            <input
              type="text"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
              placeholder="مثال: 750"
              className="flex-1 bg-transparent text-sm font-bold tabular-nums outline-none"
              dir="ltr"
            />
            <span className="text-xs font-bold text-muted-foreground">ج.م</span>
          </div>
        </label>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">طريقة الدفع</p>
        <div className="mb-5 space-y-2">
          {paymentMethods.map((m) => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-right transition ${
                  active ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                </div>
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    active ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <button
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill transition active:scale-[0.98]"
        >
          متابعة عبر واتساب · {fmtMoney(finalAmount || 0)}
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          سيتم تحويلك للواتساب لإتمام الدفع وإضافة الرصيد لمحفظتك
        </p>
      </motion.div>
    </motion.div>
  );
};
