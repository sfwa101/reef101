import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AffiliateTier = {
  id: string;
  name: string;
  rank: number;
  min_successful_invites: number;
  commission_fixed: number;
  unlocks_wholesale: boolean;
  badge_emoji: string | null;
};

export type AffiliateState = {
  currentTier: AffiliateTier | null;
  nextTier: AffiliateTier | null;
  successfulInvites: number;
  totalCommission: number;
  unlocksWholesale: boolean;
  invitesToNext: number;
  progressPct: number; // 0..100 within current tier band
  loading: boolean;
};

const DEFAULT: AffiliateState = {
  currentTier: null,
  nextTier: null,
  successfulInvites: 0,
  totalCommission: 0,
  unlocksWholesale: false,
  invitesToNext: 0,
  progressPct: 0,
  loading: true,
};

/**
 * useAffiliateEngine — gamification surface for the tiered affiliate network.
 * Reads the user's current tier, total successful invites, and the next achievable
 * tier so the UI can render a progress bar and unlock callouts.
 */
export const useAffiliateEngine = (userId: string | null | undefined) => {
  const [state, setState] = useState<AffiliateState>(DEFAULT);

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ ...DEFAULT, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));

    // Make sure a code + state row exists.
    try {
      await (supabase.rpc as any)("ensure_referral_code", { _user_id: userId });
    } catch {
      /* non-fatal */
    }

    const [{ data: tiers }, { data: stateRow }] = await Promise.all([
      (supabase.from as any)("affiliate_tiers")
        .select("*")
        .order("rank", { ascending: true }),
      (supabase.from as any)("user_affiliate_state")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const allTiers: AffiliateTier[] = (tiers as any[]) ?? [];
    const invites: number = stateRow?.successful_invites ?? 0;

    const currentTier =
      allTiers.find((t) => t.id === stateRow?.current_tier_id) ??
      allTiers[0] ??
      null;
    const nextTier =
      allTiers.find(
        (t) => currentTier && t.rank > currentTier.rank,
      ) ?? null;

    const floor = currentTier?.min_successful_invites ?? 0;
    const ceil = nextTier?.min_successful_invites ?? floor + 1;
    const span = Math.max(1, ceil - floor);
    const progressPct = nextTier
      ? Math.min(100, Math.max(0, ((invites - floor) / span) * 100))
      : 100;
    const invitesToNext = nextTier
      ? Math.max(0, (nextTier.min_successful_invites ?? 0) - invites)
      : 0;

    setState({
      currentTier,
      nextTier,
      successfulInvites: invites,
      totalCommission: stateRow?.total_commission_earned ?? 0,
      unlocksWholesale:
        stateRow?.unlocks_wholesale ?? currentTier?.unlocks_wholesale ?? false,
      invitesToNext,
      progressPct,
      loading: false,
    });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
};
