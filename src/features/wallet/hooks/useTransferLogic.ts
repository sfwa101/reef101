import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Allowed spending categories for restricted P2P transfers.
 * Mirrors product taxonomy used across the catalog.
 */
export const RESTRICTED_CATEGORIES = [
  { value: "supermarket", label: "سوبر ماركت" },
  { value: "pharmacy", label: "صيدلية" },
  { value: "fresh_produce", label: "خضار و فاكهة" },
  { value: "bakery", label: "مخبوزات" },
  { value: "butcher", label: "لحوم و دواجن" },
  { value: "household", label: "مستلزمات منزل" },
] as const;

export type RestrictedCategory = (typeof RESTRICTED_CATEGORIES)[number]["value"];

/** KYC level: 0 = unverified, 1 = ID verified, 2 = Address verified. */
export type KycLevel = 0 | 1 | 2;

/** Minimum KYC level required to perform a P2P wallet transfer. */
export const MIN_KYC_LEVEL_FOR_P2P: KycLevel = 1;

export interface TransferPayload {
  recipientPhone: string;
  amount: number;
  note?: string;
  restrictedCategories?: RestrictedCategory[];
  expiresAt?: string; // ISO string
}

export interface TransferLogicState {
  kycLevel: KycLevel;
  kycLoading: boolean;
  canTransfer: boolean;
  refreshKyc: () => Promise<void>;
  submitTransfer: (payload: TransferPayload) => Promise<{ ok: boolean; errorCode?: string }>;
}

/**
 * Centralizes the rules around P2P wallet transfers:
 *  - blocks transfers when KYC level is insufficient,
 *  - relays restricted_categories + expires_at to the RPC,
 *  - normalizes server error codes for the UI layer.
 */
export const useTransferLogic = (): TransferLogicState => {
  const [kycLevel, setKycLevel] = useState<KycLevel>(0);
  const [kycLoading, setKycLoading] = useState(true);

  const refreshKyc = useCallback(async () => {
    setKycLoading(true);
    const { data, error } = await supabase.rpc("get_user_kyc_level");
    if (!error && typeof data === "number") {
      const lvl = Math.max(0, Math.min(2, Math.trunc(data))) as KycLevel;
      setKycLevel(lvl);
    } else {
      setKycLevel(0);
    }
    setKycLoading(false);
  }, []);

  useEffect(() => {
    void refreshKyc();
  }, [refreshKyc]);

  const submitTransfer = useCallback(
    async (payload: TransferPayload): Promise<{ ok: boolean; errorCode?: string }> => {
      if (kycLevel < MIN_KYC_LEVEL_FOR_P2P) {
        return { ok: false, errorCode: "kyc_required" };
      }

      const restricted =
        payload.restrictedCategories && payload.restrictedCategories.length > 0
          ? payload.restrictedCategories
          : null;

      // Forward-compatible: extra fields (_restricted_categories, _expires_at)
      // are accepted by future RPC versions and ignored by the current one.
      const rpcArgs = {
        _recipient_phone: payload.recipientPhone,
        _amount: payload.amount,
        _note: payload.note || undefined,
        _restricted_categories: restricted ?? undefined,
        _expires_at: payload.expiresAt ?? undefined,
      };
      const { error } = await supabase.rpc(
        "wallet_transfer",
        rpcArgs as unknown as Parameters<typeof supabase.rpc<"wallet_transfer">>[1],
      );

      if (error) {
        const msg = error.message || "";
        if (msg.includes("insufficient")) return { ok: false, errorCode: "insufficient" };
        if (msg.includes("recipient_not_found"))
          return { ok: false, errorCode: "recipient_not_found" };
        if (msg.includes("self_transfer")) return { ok: false, errorCode: "self_transfer" };
        if (msg.includes("limit_exceeded")) return { ok: false, errorCode: "limit_exceeded" };
        if (msg.includes("invalid_phone")) return { ok: false, errorCode: "invalid_phone" };
        if (msg.includes("kyc")) return { ok: false, errorCode: "kyc_required" };
        return { ok: false, errorCode: "unknown" };
      }

      return { ok: true };
    },
    [kycLevel],
  );

  return {
    kycLevel,
    kycLoading,
    canTransfer: !kycLoading && kycLevel >= MIN_KYC_LEVEL_FOR_P2P,
    refreshKyc,
    submitTransfer,
  };
};
