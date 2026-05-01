import { motion } from "framer-motion";
import { Loader2, MessageCircle } from "lucide-react";
import { fmtMoney, toLatin } from "@/lib/format";

type Props = {
  grand: number;
  minOrderTotal: number;
  submitting: boolean;
  onCheckout: () => void;
};

/**
 * Sticky bottom checkout bar — shows minimum-order warning, animated entrance,
 * and the WhatsApp-driven submit button with grand total pill.
 */
export const CartCheckoutActions = ({
  grand,
  minOrderTotal,
  submitting,
  onCheckout,
}: Props) => {
  const blocked = minOrderTotal > 0 && grand < minOrderTotal;
  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 240 }}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      {blocked && (
        <div className="mx-auto mb-2 max-w-md rounded-2xl border border-amber-500/40 bg-amber-50 px-3 py-2 text-center text-[11.5px] font-bold text-amber-800 shadow-sm dark:bg-amber-500/10 dark:text-amber-200">
          ⚠️ الحد الأدنى للطلب هو {toLatin(minOrderTotal)} ج.م — أضف بـ {toLatin(Math.ceil(minOrderTotal - grand))} ج.م لإتمام الطلب
        </div>
      )}
      <div
        className={`mx-auto max-w-md rounded-[20px] p-0.5 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.55)] ${
          blocked ? "bg-foreground/20" : "bg-gradient-to-r from-primary via-[hsl(var(--primary)/0.85)] to-primary"
        }`}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onCheckout}
          disabled={submitting || blocked}
          className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-primary px-4 py-3.5 font-extrabold text-primary-foreground transition disabled:cursor-not-allowed disabled:bg-foreground/30 disabled:text-foreground/60 disabled:opacity-90"
        >
          <span className="flex items-center gap-2">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
            <span className="text-sm">
              {blocked
                ? `الحد الأدنى ${toLatin(minOrderTotal)} ج.م`
                : submitting
                  ? "جارٍ تجهيز الفاتورة ⏳"
                  : "إتمام عبر واتساب"}
            </span>
          </span>
          <span className="rounded-[12px] bg-primary-foreground/15 px-3 py-1.5 text-sm font-extrabold">
            {fmtMoney(grand)}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};
