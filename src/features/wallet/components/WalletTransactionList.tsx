import { motion } from "framer-motion";
import { toLatin } from "@/lib/format";
import { formatDate, iconFor, isPositive } from "@/features/wallet/lib/walletAdvisor";
import type { Tx } from "@/features/wallet/types/wallet.types";

/**
 * WalletTransactionList — scrolling ledger preview (top 8 entries).
 * Empty-state aware. Pure prop-driven view.
 */
export const WalletTransactionList = ({ txs }: { txs: Tx[] }) => (
  <section>
    <div className="mb-2.5 flex items-baseline justify-between px-1">
      <h2 className="font-display text-base font-extrabold">سجل المعاملات</h2>
      <button className="text-[11px] font-bold text-primary">عرض الكل</button>
    </div>
    {txs.length === 0 ? (
      <div className="glass-strong rounded-2xl p-8 text-center text-xs text-muted-foreground shadow-soft">
        لا توجد عمليات بعد
      </div>
    ) : (
      <div className="glass-strong divide-y divide-border/60 rounded-2xl shadow-soft">
        {txs.slice(0, 8).map((t, i) => {
          const Icon = iconFor(t.kind);
          const pos = isPositive(t.kind);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  pos ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(t.created_at)}</p>
              </div>
              <span
                className={`font-display text-sm font-extrabold tabular-nums ${
                  pos ? "text-primary" : "text-destructive"
                }`}
              >
                {pos ? "+" : "-"}
                {toLatin(Math.round(Math.abs(t.amount)))} ج
              </span>
            </motion.div>
          );
        })}
      </div>
    )}
  </section>
);
