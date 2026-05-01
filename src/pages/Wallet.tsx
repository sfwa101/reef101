import { Heart, Loader2, PieChart as PieIcon, Users, Wallet2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toLatin } from "@/lib/format";

import { useWalletDashboard } from "@/features/wallet/hooks/useWalletDashboard";
import { WalletBalanceCard } from "@/features/wallet/components/WalletBalanceCard";
import {
  SlidingTabs,
  MiniStatGrid,
} from "@/features/wallet/components/WalletActionGrid";
import { WalletTransactionList } from "@/features/wallet/components/WalletTransactionList";
import {
  SavingsJarTile,
  SavingsJarDialog,
} from "@/features/wallet/components/WalletSavingsJars";
import {
  SpendingDonut,
  AIAdvisor,
  BudgetTracker,
} from "@/features/wallet/components/WalletAnalytics";
import { WalletAffiliateHub } from "@/features/wallet/components/WalletAffiliateHub";
import { WalletTopupDialog } from "@/features/wallet/components/WalletTopupDialog";
import { WalletTransferDialog } from "@/features/wallet/components/WalletTransferDialog";
import { WalletPosBarcode } from "@/features/wallet/components/WalletPosBarcode";
import { WalletCharityHub } from "@/features/wallet/components/WalletCharityHub";

/**
 * Wallet — page shell.
 *
 * After the Phase-3 decomposition this file is intentionally thin:
 * it only orchestrates `useWalletDashboard` (the controller) and the
 * stem-cell components in `src/features/wallet/`. Future FinTech features
 * (KYC-gated transfers, split billing, charity routing) attach to the
 * controller — never to this aggregator.
 */
const Wallet = () => {
  const c = useWalletDashboard();

  if (c.loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {/* HEADER */}
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">محفظتي</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            بنكك الرقمي · مدير ميزانياتك · شركاء النجاح
          </p>
        </div>
        {c.tier && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold text-primary ring-1 ring-primary/20">
            {c.tier.label} · {toLatin(c.tier.multiplier)}x
          </span>
        )}
      </motion.section>

      {/* DIGITAL CARD — always visible */}
      <WalletBalanceCard
        name={c.profile?.full_name || "عميل ريف"}
        balance={Number(c.balance?.balance ?? 0)}
        points={c.balance?.points ?? 0}
        savings={c.totalSavings}
        tierLabel={c.tier?.label}
        trustLimit={c.trustLimit}
        onTopup={c.openTopup}
        onTransfer={() => c.setShowTransfer(true)}
        onPos={() => c.setShowPos(true)}
      />

      {/* TABS */}
      <SlidingTabs
        tabs={[
          { id: "balance", label: "الرصيد", icon: Wallet2 },
          { id: "budgets", label: "التحليلات", icon: PieIcon },
          { id: "charity", label: "الصدقات", icon: Heart },
          { id: "affiliate", label: "الإحالات", icon: Users },
        ]}
        active={c.tab}
        onChange={(t) => {
          if (t === "affiliate") c.openAffiliateTab();
          else c.setTab(t as any);
        }}
      />

      <AnimatePresence mode="wait">
        {c.tab === "balance" && (
          <motion.div
            key="balance"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <MiniStatGrid
              coupons={c.balance?.coupons ?? 0}
              cashback={c.balance?.cashback ?? 0}
              refs={c.successfulRefs}
            />
            <SavingsJarTile jar={c.jar} onOpen={() => c.setShowJar(true)} />
            <WalletTransactionList txs={c.txs} />
          </motion.div>
        )}

        {c.tab === "budgets" && (
          <motion.div
            key="budgets"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <SpendingDonut stats={c.categoryStats} />
            <AIAdvisor monthByCat={c.monthByCat} budgets={c.budgets} />
            <BudgetTracker
              userId={c.userId!}
              monthByCat={c.monthByCat}
              budgets={c.budgets}
              onChange={c.setBudgets}
            />
          </motion.div>
        )}

        {c.tab === "charity" && (
          <motion.div
            key="charity"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
          >
            <WalletCharityHub walletBalance={Number(c.balance?.balance ?? 0)} />
          </motion.div>
        )}

        {c.tab === "affiliate" && (
          <motion.div
            key="affiliate"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
          >
            <WalletAffiliateHub
              userId={c.userId}
              code={c.referralCode}
              referrals={c.referrals}
              totalCommission={c.totalCommission}
              successfulRefs={c.successfulRefs}
              onEnsureCode={c.ensureReferralCode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {c.showTopup && (
          <WalletTopupDialog
            onClose={() => c.setShowTopup(false)}
            phone="201080068689"
            userId={c.userId!}
          />
        )}
        {c.showJar && c.jar && (
          <SavingsJarDialog
            onClose={() => c.setShowJar(false)}
            userId={c.userId!}
            jar={c.jar}
            txs={c.jarTxs}
            onUpdate={(j, t) => {
              c.setJar(j);
              c.setJarTxs(t);
            }}
          />
        )}
        {c.showTransfer && (
          <WalletTransferDialog
            onClose={() => c.setShowTransfer(false)}
            balance={Number(c.balance?.balance ?? 0)}
            onDone={(newBal) =>
              c.setBalance((b) => (b ? { ...b, balance: newBal } : b))
            }
          />
        )}
        {c.showPos && (
          <WalletPosBarcode
            onClose={() => c.setShowPos(false)}
            customerCode={c.customerCode}
            name={c.profile?.full_name || "عميل ريف"}
            balance={Number(c.balance?.balance ?? 0)}
            points={c.balance?.points ?? 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
