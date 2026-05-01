import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, HandHeart, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, toLatin } from "@/lib/format";
import {
  CATEGORY_LABELS,
  type CharityCampaign,
} from "@/features/wallet/types/wallet.types";

/**
 * WalletCharityHub — directs wallet funds to verified community auditors
 * (charity_auditor role) or the General Pool. All transfers go through the
 * `donate_to_campaign` RPC which atomically debits the wallet and credits
 * the campaign inside a transaction.
 *
 * Restricted-category chips are read from `charity_campaigns.restricted_categories`
 * — those funds may only be spent by the auditor on those product categories.
 */
const DONATE_PRESETS = [10, 25, 50, 100];

async function fetchCampaigns(): Promise<CharityCampaign[]> {
  const { data, error } = await supabase
    .from("charity_campaigns")
    .select(
      "id,auditor_id,title,description,cover_url,target_amount,current_amount,restricted_categories,is_active,ends_at,created_at",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CharityCampaign[];
}

export const WalletCharityHub = ({
  walletBalance,
}: {
  walletBalance: number;
}) => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<CharityCampaign | null>(null);
  const [amount, setAmount] = useState<number>(25);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["charity_campaigns", "active"],
    queryFn: fetchCampaigns,
    staleTime: 60_000,
  });

  const donate = useMutation({
    mutationFn: async (vars: {
      campaignId: string | null;
      amount: number;
      source: "direct" | "general_pool";
    }) => {
      const { data, error } = await supabase.rpc("donate_to_campaign", {
        _campaign_id: vars.campaignId as unknown as string,
        _amount: vars.amount,
        _source: vars.source,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("جزاك الله خيراً ✨ تم التبرع بنجاح");
      qc.invalidateQueries({ queryKey: ["charity_campaigns"] });
      setSelected(null);
    },
    onError: (e: any) => {
      const msg = String(e?.message ?? e);
      if (msg.includes("insufficient_balance"))
        toast.error("رصيد المحفظة غير كافٍ");
      else toast.error("تعذّر إتمام التبرع");
    },
  });

  return (
    <section className="space-y-4">
      {/* General pool card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/15 via-primary/10 to-amber-500/15 p-4 ring-1 ring-rose-500/25"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
            <HandHeart className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <p className="font-display text-base font-extrabold">
              الصندوق العام للخير
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              يُوزَّع تلقائيًا على أكثر الحملات احتياجاً عبر الـ Auditors المعتمدين.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DONATE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={donate.isPending || walletBalance < p}
              onClick={() =>
                donate.mutate({ campaignId: null, amount: p, source: "general_pool" })
              }
              className="rounded-full bg-card px-3 py-1.5 text-[11px] font-extrabold ring-1 ring-rose-500/25 transition hover:bg-rose-500/10 disabled:opacity-50"
            >
              {toLatin(p)} ج.م
            </button>
          ))}
        </div>
      </motion.div>

      {/* Campaign list */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-extrabold">حملات Auditors معتمدين</p>
          <span className="text-[10px] text-muted-foreground">
            متاح للتبرع: {fmtMoney(walletBalance)}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl bg-muted/40 p-6 text-center text-xs text-muted-foreground">
            لا توجد حملات نشطة حالياً.
          </div>
        ) : (
          <div className="space-y-2.5">
            {campaigns.map((c) => {
              const pct =
                c.target_amount > 0
                  ? Math.min(100, (c.current_amount / c.target_amount) * 100)
                  : 0;
              return (
                <motion.button
                  key={c.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelected(c);
                    setAmount(25);
                  }}
                  className="flex w-full items-stretch gap-3 rounded-2xl bg-card p-3 text-right shadow-[0_2px_10px_-6px_rgba(0,0,0,0.08)] ring-1 ring-border/40 transition hover:ring-primary/30"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-rose-500/15">
                    {c.cover_url ? (
                      <img
                        src={c.cover_url}
                        alt={c.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Heart className="h-6 w-6 text-rose-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-extrabold">{c.title}</p>
                    {c.description && (
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                    {c.restricted_categories.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.restricted_categories.slice(0, 3).map((k) => (
                          <span
                            key={k}
                            className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold text-primary"
                          >
                            {CATEGORY_LABELS[k] ?? k}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-rose-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-bold tabular-nums">
                      <span className="text-primary">
                        {fmtMoney(c.current_amount)}
                      </span>
                      <span className="text-muted-foreground">
                        من {fmtMoney(c.target_amount)}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Donation dialog */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-extrabold">
                    {selected.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    تبرع مباشر للحملة — يُحوَّل من رصيدك فوراً.
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full bg-muted p-1.5"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 grid grid-cols-4 gap-2">
                {DONATE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`rounded-xl px-2 py-2 text-[12px] font-extrabold transition ${
                      amount === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-primary/10"
                    }`}
                  >
                    {toLatin(p)}
                  </button>
                ))}
              </div>

              <label className="mb-3 block">
                <span className="text-[11px] font-bold text-muted-foreground">
                  مبلغ مخصّص (ج.م)
                </span>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl bg-background p-2.5 text-center font-display text-lg font-extrabold tabular-nums ring-1 ring-border focus:ring-primary"
                />
              </label>

              {selected.restricted_categories.length > 0 && (
                <div className="mb-3 rounded-xl bg-primary/8 p-2.5 ring-1 ring-primary/20">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-extrabold text-primary">
                      صرف مقيّد
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-foreground/80">
                    لا يمكن للـ Auditor صرف هذه الأموال إلا على:{" "}
                    {selected.restricted_categories
                      .map((k) => CATEGORY_LABELS[k] ?? k)
                      .join(" · ")}
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={
                  donate.isPending || amount <= 0 || amount > walletBalance
                }
                onClick={() =>
                  donate.mutate({
                    campaignId: selected.id,
                    amount,
                    source: "direct",
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-primary py-3 font-extrabold text-white shadow-lg disabled:opacity-50"
              >
                {donate.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <HandHeart className="h-4 w-4" />
                )}
                تبرّع بمبلغ {toLatin(amount)} ج.م
              </button>
              {amount > walletBalance && (
                <p className="mt-2 text-center text-[10px] font-bold text-destructive">
                  الرصيد غير كافٍ
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
