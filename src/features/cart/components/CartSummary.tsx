import { Sparkles } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import type { AppliedPromo } from "../types/cart.types";
import { NumberFlow } from "./NumberFlow";

type Props = {
  subtotal: number;
  discount: number;
  appliedPromo: AppliedPromo;
  delivery: number;
  billSavings: number;
  tip: number;
  isSplit: boolean;
  walletApplied: number;
  walletShortfall: number;
  secondaryLabel: string;
  grand: number;
};

/**
 * Order summary block: subtotal, promo discount, delivery, savings,
 * split-payment breakdown, and the prominent grand total.
 */
export const CartSummary = ({
  subtotal,
  discount,
  appliedPromo,
  delivery,
  billSavings,
  tip,
  isSplit,
  walletApplied,
  walletShortfall,
  secondaryLabel,
  grand,
}: Props) => {
  return (
    <section className="space-y-2 rounded-2xl bg-card p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] ring-1 ring-border/30">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">المجموع الفرعي</span>
        <span className="font-bold tabular-nums">{fmtMoney(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">خصم ({appliedPromo?.code})</span>
          <span className="font-bold tabular-nums text-primary">-{fmtMoney(discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">التوصيل</span>
        <span className="font-bold tabular-nums">
          {delivery === 0 ? <span className="text-primary">مجاني 🚚</span> : fmtMoney(delivery)}
        </span>
      </div>
      {billSavings > 0 && (
        <div className="flex items-center justify-between rounded-[10px] bg-emerald-500/10 px-2 py-1.5 text-[13px] ring-1 ring-emerald-500/20">
          <span className="flex items-center gap-1 font-black text-emerald-700 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" /> ما وفّرته في هذه الفاتورة
          </span>
          <span className="font-display font-black tabular-nums text-emerald-700 dark:text-emerald-400">
            {fmtMoney(billSavings)}
          </span>
        </div>
      )}
      {tip > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">إكرامية</span>
          <span className="font-bold tabular-nums">{fmtMoney(tip)}</span>
        </div>
      )}
      {isSplit && (
        <div className="rounded-[10px] bg-accent/10 p-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">من المحفظة</span>
            <span className="font-extrabold text-primary tabular-nums">{fmtMoney(walletApplied)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{secondaryLabel}</span>
            <span className="font-extrabold tabular-nums">{fmtMoney(walletShortfall)}</span>
          </div>
        </div>
      )}
      <div className="my-2 h-px bg-border" />
      <div className="flex items-baseline justify-between">
        <span className="font-display text-base font-bold">الإجمالي</span>
        <span className="font-display text-2xl font-extrabold text-primary">
          <NumberFlow value={grand} /> <span className="text-sm font-medium text-muted-foreground">ج.م</span>
        </span>
      </div>
    </section>
  );
};
