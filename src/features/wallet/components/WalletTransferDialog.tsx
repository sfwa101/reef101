import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Phone, Send, ShieldCheck, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import {
  useTransferLogic,
  RESTRICTED_CATEGORIES,
  type RestrictedCategory,
} from "../hooks/useTransferLogic";

/**
 * WalletTransferDialog — KYC-gated peer-to-peer transfer.
 * Phase 4: surfaces KYC blocker + optional category restriction picker.
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
  const { kycLevel, kycLoading, canTransfer, submitTransfer } = useTransferLogic();

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [restrictEnabled, setRestrictEnabled] = useState(false);
  const [selectedCats, setSelectedCats] = useState<RestrictedCategory[]>([]);
  const [busy, setBusy] = useState(false);

  const amt = Number(amount || 0);
  const valid =
    canTransfer &&
    amt > 0 &&
    amt <= balance &&
    amt <= 5000 &&
    phone.replace(/\D/g, "").length >= 10 &&
    (!restrictEnabled || selectedCats.length > 0);

  const toggleCat = (c: RestrictedCategory) => {
    setSelectedCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    const result = await submitTransfer({
      recipientPhone: phone,
      amount: amt,
      note: note || undefined,
      restrictedCategories: restrictEnabled ? selectedCats : undefined,
    });
    setBusy(false);
    if (!result.ok) {
      switch (result.errorCode) {
        case "kyc_required":
          toast.error("يجب توثيق حسابك أولاً قبل التحويل");
          break;
        case "insufficient":
          toast.error("الرصيد غير كافٍ");
          break;
        case "recipient_not_found":
          toast.error("لا يوجد مستخدم مسجل بهذا الرقم");
          break;
        case "self_transfer":
          toast.error("لا يمكنك التحويل لنفسك");
          break;
        case "limit_exceeded":
          toast.error("الحد الأقصى للتحويل 5000 ج.م");
          break;
        case "invalid_phone":
          toast.error("رقم الهاتف غير صحيح");
          break;
        default:
          toast.error("تعذّر التحويل");
      }
      return;
    }
    fireMiniConfetti();
    toast.success(`تم تحويل ${toLatin(amt)} ج.م بنجاح ✅`);
    onDone(balance - amt);
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

        {/* KYC blocker */}
        {!kycLoading && kycLevel < 1 && (
          <div className="mb-4 rounded-2xl bg-rose-500/10 p-4 ring-1 ring-rose-500/30">
            <div className="mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <h3 className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                التحويل يتطلب توثيق الحساب
              </h3>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-rose-700/90 dark:text-rose-300/90">
              لحماية المستخدمين، يجب توثيق هويتك (KYC) قبل إجراء أي تحويل بين المحافظ.
            </p>
            <Link
              to="/account/settings"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white shadow-pill active:scale-95"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              توثيق الحساب الآن
            </Link>
          </div>
        )}

        <fieldset disabled={!canTransfer} className="contents">
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
              className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
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
              className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-lg font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
          </label>

          <div className="mb-3 grid grid-cols-4 gap-2">
            {[50, 100, 200, 500].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="rounded-xl bg-foreground/5 py-2 text-xs font-extrabold transition active:scale-95 disabled:opacity-50"
              >
                {toLatin(v)}
              </button>
            ))}
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-bold text-muted-foreground">
              ملاحظة (اختياري)
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 40))}
              placeholder="مثال: مصاريف الأسبوع"
              className="w-full rounded-xl bg-foreground/5 px-3 py-2.5 text-sm font-bold outline-none disabled:opacity-50"
            />
          </label>

          {/* Restricted spending toggle */}
          <div className="mb-3 rounded-2xl bg-foreground/5 p-3 ring-1 ring-border/40">
            <label className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-extrabold">تقييد الصرف بفئات معينة</span>
              </div>
              <input
                type="checkbox"
                checked={restrictEnabled}
                onChange={(e) => {
                  setRestrictEnabled(e.target.checked);
                  if (!e.target.checked) setSelectedCats([]);
                }}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              مثال: مصروف خاص بالسوبر ماركت فقط — لن يستطيع المستلم صرفه في فئات أخرى.
            </p>
            {restrictEnabled && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {RESTRICTED_CATEGORIES.map((c) => {
                  const active = selectedCats.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleCat(c.value)}
                      className={`rounded-xl px-2.5 py-2 text-[11px] font-extrabold transition active:scale-95 ${
                        active
                          ? "bg-primary text-primary-foreground shadow-pill"
                          : "bg-background ring-1 ring-border/60"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
        </fieldset>
      </motion.div>
    </motion.div>
  );
};
