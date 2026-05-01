import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Check, X, Users } from "lucide-react";
import { toast } from "sonner";
import { fmtMoney } from "@/lib/format";
import { useSharedCartContext } from "@/context/SharedCartContext";
import {
  computeParticipantShares,
  useSharedCartSync,
} from "@/features/cart/hooks/useSharedCartSync";

/**
 * Phase 7 — Global Approval Banner
 * Sits at the root of the app. When the active shared cart enters
 * `pending_approvals`, it surfaces a sticky banner asking the current
 * participant to approve or reject their share.
 */
const GlobalApprovalBanner = () => {
  const { sharedCartId, setSharedCartId } = useSharedCartContext();
  const { cart, participants, items, myParticipant, approve, reject } =
    useSharedCartSync(sharedCartId);
  const [busy, setBusy] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.unit_price * it.quantity, 0),
    [items],
  );

  const myShare = useMemo(() => {
    if (!myParticipant) return 0;
    if (myParticipant.split_type === "itemized") {
      return items
        .filter((it) => it.added_by === myParticipant.user_id)
        .reduce((s, it) => s + it.unit_price * it.quantity, 0);
    }
    const shares = computeParticipantShares(participants, subtotal);
    return shares[myParticipant.user_id] ?? 0;
  }, [items, myParticipant, participants, subtotal]);

  const visible =
    !!cart &&
    cart.status === "pending_approvals" &&
    !!myParticipant &&
    myParticipant.approval_status === "pending";

  const guard = async (fn: () => Promise<void>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الإجراء");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 top-0 z-[60] px-3 pt-[env(safe-area-inset-top)]"
        >
          <div className="mx-auto mt-2 w-full max-w-md rounded-2xl bg-gradient-to-l from-amber-500/95 to-amber-400/95 p-3 text-amber-950 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)] ring-1 ring-amber-700/30 backdrop-blur sm:max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-amber-950/15">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-[13px] font-extrabold leading-tight">
                  السلة العائلية بانتظار موافقتك
                </p>
                <p className="truncate text-[11px] font-bold opacity-80">
                  حصتك: <span className="tabular-nums">{fmtMoney(myShare)}</span>
                </p>
              </div>
              <Link
                to="/cart"
                className="shrink-0 rounded-full bg-amber-950/15 px-2 py-1 text-[10px] font-extrabold"
              >
                عرض
              </Link>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => guard(reject, "تم الرفض — أُعيد فتح السلة")}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-950/15 px-3 py-2 text-[11px] font-extrabold disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                رفض
              </button>
              <button
                onClick={() => guard(approve, "تمت الموافقة وحجز الرصيد ✅")}
                disabled={busy}
                className="flex flex-2 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-950 px-3 py-2 text-[11px] font-extrabold text-amber-50 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                موافق وادفع حصتي
              </button>
            </div>
            {cart && (
              <button
                onClick={() => setSharedCartId(null)}
                className="mt-1.5 w-full text-center text-[10px] font-bold opacity-70 underline"
              >
                مغادرة السلة المشتركة
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalApprovalBanner;
