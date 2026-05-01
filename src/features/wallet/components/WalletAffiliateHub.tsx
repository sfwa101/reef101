import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Copy, Lock, Share2, Sparkles, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import type { ReferralRow } from "@/features/wallet/types/wallet.types";
import { useAffiliateEngine } from "@/features/wallet/hooks/useAffiliateEngine";
import { WithdrawDialog } from "@/features/wallet/components/WithdrawDialog";
import { supabase } from "@/integrations/supabase/client";

// shopping bag icon (lucide doesn't expose ShoppingBagIcon by that name in older imports)
function ShoppingBagIcon(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

/**
 * WalletAffiliateHub — referral / commission surface, tier-aware.
 * Phase 11: pulls live tier state via `useAffiliateEngine` and exposes a
 * gamified progress bar at the top. Copy/share UX intact.
 */
export const WalletAffiliateHub = ({
  userId,
  code,
  referrals,
  totalCommission,
  successfulRefs,
  onEnsureCode,
}: {
  userId?: string | null;
  code: string | null;
  referrals: ReferralRow[];
  totalCommission: number;
  successfulRefs: number;
  onEnsureCode: () => Promise<string | null>;
}) => {
  const [busy, setBusy] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const totalRegistered = referrals.length;

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("wallet_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancel) setBalance(Number(data?.balance ?? 0));
    })();
    return () => { cancel = true; };
  }, [userId, withdrawOpen]);

  const {
    currentTier,
    nextTier,
    successfulInvites,
    invitesToNext,
    progressPct,
    unlocksWholesale,
  } = useAffiliateEngine(userId ?? null);

  const liveInvites = Math.max(successfulInvites, successfulRefs);

  const ensure = async () => {
    if (code) return code;
    setBusy(true);
    const c = await onEnsureCode();
    setBusy(false);
    return c;
  };

  const copyCode = async () => {
    const c = await ensure();
    if (!c) return;
    try {
      await navigator.clipboard.writeText(c);
      toast.success("تم نسخ الكود");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const share = async () => {
    const c = await ensure();
    if (!c) return;
    const text = `🌿 انضم إلى ريف المدينة عبر كود الدعوة: *${c}* واحصل على خصم خاص على أول طلب! 🎁`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ text });
        return;
      } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      {/* TIER PROGRESS — gamified */}
      {currentTier && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border/40"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">
                {currentTier.badge_emoji ?? "🌱"}
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                  مستواك الحالي
                </p>
                <p className="text-sm font-extrabold">
                  {currentTier.name}
                  <span className="ms-1.5 text-[10px] font-bold text-primary">
                    +{toLatin(Math.round(currentTier.commission_fixed))} ج لكل دعوة
                  </span>
                </p>
              </div>
            </div>
            {unlocksWholesale && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 ring-1 ring-amber-500/30">
                <Sparkles className="h-3 w-3" /> أسعار جملة
              </span>
            )}
          </div>

          <div className="mt-3">
            <Progress value={progressPct} className="h-2" />
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
              <span>{toLatin(liveInvites)} دعوة ناجحة</span>
              {nextTier ? (
                <span className="text-primary">
                  {toLatin(invitesToNext)} متبقية لـ {nextTier.name}
                  {nextTier.unlocks_wholesale && !unlocksWholesale && (
                    <span className="ms-1 inline-flex items-center gap-0.5 text-amber-600">
                      <Lock className="h-2.5 w-2.5" /> جملة
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-primary">أعلى مستوى 🏆</span>
              )}
            </div>
          </div>

          {nextTier && (
            <p className="mt-2 text-[10px] leading-relaxed text-foreground/70">
              ادعُ {toLatin(invitesToNext)} أصدقاء للوصول إلى{" "}
              <b>{nextTier.name}</b> والحصول على{" "}
              <b>{toLatin(Math.round(nextTier.commission_fixed))} ج</b> لكل دعوة
              {nextTier.unlocks_wholesale && !unlocksWholesale ? (
                <> + فتح أسعار الجملة 🛒</>
              ) : null}
              .
            </p>
          )}
        </motion.div>
      )}

      {/* HERO CARD — gold/dark green */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-float"
        style={{
          background:
            "linear-gradient(135deg, hsl(150 50% 10%) 0%, hsl(155 45% 18%) 50%, hsl(45 75% 45%) 100%)",
        }}
      >
        <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-[hsl(45_85%_60%)]/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, white 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
                شركاء النجاح
              </p>
              <p className="text-[12px] font-bold text-white/90">ادعُ — اربح — كرّر</p>
            </div>
          </div>

          <p className="mt-4 text-[10px] font-bold text-white/65">كود الدعوة الخاص بك</p>
          <p className="my-1.5 font-display text-3xl font-extrabold tracking-[0.22em] text-white">
            {code || "·····"}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={copyCode}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/20 py-2.5 text-[11px] font-extrabold text-white ring-1 ring-white/20 transition active:scale-95 disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" /> نسخ الكود
            </button>
            <button
              onClick={share}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-[11px] font-extrabold text-foreground transition active:scale-95 disabled:opacity-50"
            >
              <Share2 className="h-3.5 w-3.5" /> مشاركة عبر واتساب
            </button>
          </div>
        </div>
      </motion.div>

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "مسجلين", value: toLatin(totalRegistered), icon: Users, tone: "primary" },
          {
            label: "أوّل طلب",
            value: toLatin(liveInvites),
            icon: ShoppingBagIcon,
            tone: "amber",
          },
          {
            label: "أرباحك",
            value: `${toLatin(Math.round(totalCommission))} ج`,
            icon: Banknote,
            tone: "green",
          },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="rounded-2xl bg-card p-3 text-center shadow-soft ring-1 ring-border/40"
          >
            <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <m.icon className="h-4 w-4" strokeWidth={2.4} />
            </div>
            <p className="font-display text-lg font-extrabold tabular-nums">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div className="rounded-2xl bg-primary/8 p-3.5 ring-1 ring-primary/15">
        <p className="text-[11px] font-extrabold text-primary">🎯 كيف تعمل العمولة؟</p>
        <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">
          تكسب <b>مكافأة ثابتة</b> عن كل دعوة ناجحة، والمبلغ يرتفع كلما صعدت في
          المستويات. عند بلوغ <b>Gold Partner</b> تُفتح لك <b>أسعار الجملة</b>
          تلقائيًا.
        </p>
      </div>

      {/* RECENT REFERRALS */}
      {referrals.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[11px] font-bold text-muted-foreground">آخر الإحالات</p>
          <div className="divide-y divide-border/60 rounded-2xl bg-card shadow-soft ring-1 ring-border/40">
            {referrals.slice(0, 6).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-2.5 text-[11px]"
              >
                <span className="font-bold">عميل #{r.id.slice(0, 6)}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                    r.status === "purchased"
                      ? "bg-primary/15 text-primary"
                      : "bg-foreground/10 text-muted-foreground"
                  }`}
                >
                  {r.status === "purchased"
                    ? `+${toLatin(Math.round(r.commission))} ج`
                    : "بانتظار الشراء"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
