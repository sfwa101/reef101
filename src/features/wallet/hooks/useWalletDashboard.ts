import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { tierProgress, type TierDef } from "@/lib/tiers";
import {
  CATEGORY_LABELS,
  PIE_COLORS,
  type Budget,
  type CategoryStat,
  type Profile,
  type ReferralRow,
  type SavingsJar,
  type SavingsTx,
  type Tx,
  type WalletBalance,
  type WalletTab,
} from "@/features/wallet/types/wallet.types";

/**
 * useWalletDashboard — single controller hook for the Wallet page.
 *
 * Owns the full data graph (balance, profile, txs, jar, referrals, tier,
 * budgets, monthly category aggregates) and exposes plain props so view
 * components stay dumb / stateless.
 *
 * No business logic was changed during extraction — this is a verbatim
 * relocation of the original Wallet.tsx state machine. Future FinTech
 * features (KYC gating, split billing, charity routing) hook in HERE,
 * not in the page shell.
 */
export const useWalletDashboard = () => {
  const [tab, setTab] = useState<WalletTab>("balance");
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [showPos, setShowPos] = useState(false);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [monthByCat, setMonthByCat] = useState<Record<string, number>>({});
  const [totalSavings, setTotalSavings] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [jar, setJar] = useState<SavingsJar | null>(null);
  const [jarTxs, setJarTxs] = useState<SavingsTx[]>([]);
  const [showJar, setShowJar] = useState(false);
  const [tier, setTier] = useState<TierDef | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [trustLimit, setTrustLimit] = useState<number>(0);
  const [budgets, setBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      if (!mounted) return;
      setUserId(user.id);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [
        { data: bal },
        { data: prof },
        { data: tx },
        { data: items },
        { data: refRows },
        { data: jarRow },
        { data: jarTx },
        { data: spent },
        { data: trust },
        { data: refCode },
        { data: budgetRows },
      ] = await Promise.all([
        supabase
          .from("wallet_balances")
          .select("balance,points,coupons,cashback")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("wallet_transactions")
          .select("id,label,amount,kind,created_at,source")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("order_items")
          .select("price,quantity,product_id,created_at,products(category, old_price, price)")
          .in(
            "order_id",
            (await supabase.from("orders").select("id").eq("user_id", user.id)).data?.map(
              (o: any) => o.id,
            ) ?? [],
          ),
        supabase
          .from("referrals")
          .select("id,status,commission,first_order_at,created_at")
          .eq("referrer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("savings_jar")
          .select("balance,auto_save_enabled,round_to,goal,goal_label")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("savings_transactions")
          .select("id,amount,kind,label,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.rpc("user_total_spent", { _user_id: user.id }),
        supabase.rpc("user_trust_limit", { _user_id: user.id }),
        supabase.from("referral_codes").select("code").eq("user_id", user.id).maybeSingle(),
        supabase.from("category_budgets").select("category,monthly_limit").eq("user_id", user.id),
      ]);

      if (!mounted) return;
      setBalance(bal ?? { balance: 0, points: 0, coupons: 0, cashback: 0 });
      setProfile((prof ?? { full_name: null }) as Profile);
      setTxs((tx ?? []) as Tx[]);
      setReferrals((refRows ?? []) as ReferralRow[]);
      setJar(
        (jarRow ?? {
          balance: 0,
          auto_save_enabled: false,
          round_to: 5,
          goal: null,
          goal_label: null,
        }) as SavingsJar,
      );
      setJarTxs((jarTx ?? []) as SavingsTx[]);
      setTier(tierProgress(Number(spent ?? 0)).tier);
      setTrustLimit(Number(trust ?? 0));
      setReferralCode((refCode as any)?.code ?? null);
      const bMap: Record<string, number> = {};
      ((budgetRows ?? []) as Budget[]).forEach((b) => {
        bMap[b.category] = Number(b.monthly_limit);
      });
      setBudgets(bMap);

      const lastReward = (tx ?? []).find(
        (t: any) => t.kind === "reward" && t.source === "referral",
      );
      if (lastReward) {
        const ageH = (Date.now() - new Date(lastReward.created_at).getTime()) / 36e5;
        if (ageH < 0.1) setTimeout(fireConfetti, 400);
      }

      // analytics — all-time + current month
      const byCat: Record<string, number> = {};
      const monthCat: Record<string, number> = {};
      let savings = 0;
      for (const it of (items ?? []) as any[]) {
        const cat = it.products?.category || "other";
        const lineTotal = Number(it.price) * Number(it.quantity);
        byCat[cat] = (byCat[cat] || 0) + lineTotal;
        const ts = it.created_at ? new Date(it.created_at) : null;
        if (ts && ts >= monthStart) monthCat[cat] = (monthCat[cat] || 0) + lineTotal;
        if (it.products?.old_price && it.products?.old_price > it.products?.price) {
          savings +=
            (Number(it.products.old_price) - Number(it.products.price)) * Number(it.quantity);
        }
      }
      const stats = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k, v], i) => ({
          key: k,
          name: CATEGORY_LABELS[k] || k,
          value: Math.round(v),
          color: PIE_COLORS[i % PIE_COLORS.length],
        }));
      setCategoryStats(stats);
      setMonthByCat(monthCat);
      setTotalSavings(Math.round(savings));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const ensureReferralCode = async (): Promise<string | null> => {
    if (!userId) return null;
    if (referralCode) return referralCode;
    const { data, error } = await supabase.rpc("ensure_referral_code", { _user_id: userId });
    if (error) {
      toast.error("تعذّر إنشاء كود الدعوة");
      return null;
    }
    setReferralCode(data as string);
    return data as string;
  };

  const openTopup = () => {
    if (!userId) {
      toast.error("سجّل الدخول أولاً");
      return;
    }
    setShowTopup(true);
  };

  const openAffiliateTab = async () => {
    setTab("affiliate");
    if (!referralCode) await ensureReferralCode();
  };

  // Derived values
  const successfulRefs = referrals.filter((r) => r.status === "purchased").length;
  const totalCommission = referrals.reduce((s, r) => s + Number(r.commission || 0), 0);
  const customerCode = (userId ?? "00000000").slice(0, 12).toUpperCase().replace(/-/g, "");

  return {
    // state
    tab,
    setTab,
    balance,
    setBalance,
    profile,
    txs,
    loading,
    userId,
    showTopup,
    setShowTopup,
    showPos,
    setShowPos,
    categoryStats,
    monthByCat,
    totalSavings,
    referralCode,
    referrals,
    jar,
    setJar,
    jarTxs,
    setJarTxs,
    showJar,
    setShowJar,
    tier,
    showTransfer,
    setShowTransfer,
    trustLimit,
    budgets,
    setBudgets,
    // derived
    successfulRefs,
    totalCommission,
    customerCode,
    // actions
    ensureReferralCode,
    openTopup,
    openAffiliateTab,
  };
};

export type WalletDashboardController = ReturnType<typeof useWalletDashboard>;
