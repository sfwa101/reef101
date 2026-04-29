import { Wallet as WalletIcon, Plus, ArrowDownRight, ArrowUpRight, Gift, CreditCard, Loader2, X, Banknote, Smartphone, Building2, TrendingUp, Users, Copy, Share2, Sparkles, ChevronLeft, BarChart3, PiggyBank, Target, Settings2, Minus, Send, Lightbulb, ShieldCheck, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toLatin, fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fireConfetti, fireMiniConfetti } from "@/lib/confetti";
import { tierProgress, type TierDef } from "@/lib/tiers";

type WalletBalance = { balance: number; points: number; coupons: number; cashback: number };
type Tx = { id: string; label: string; amount: number; kind: string; created_at: string; source?: string | null };
type CategoryStat = { name: string; value: number; color: string };
type ReferralRow = { id: string; status: string; commission: number; first_order_at: string | null; created_at: string };
type SavingsJar = { balance: number; auto_save_enabled: boolean; round_to: number; goal: number | null; goal_label: string | null };
type SavingsTx = { id: string; amount: number; kind: string; label: string; created_at: string };

const CATEGORY_LABELS: Record<string, string> = {
  supermarket: "السوبر ماركت",
  produce: "خضار وفاكهة",
  meat: "لحوم ودواجن",
  dairy: "ألبان",
  sweets: "حلويات",
  pharmacy: "صيدلية",
  kitchen: "أدوات مطبخ",
  baskets: "سلال",
  restaurants: "مطاعم",
  village: "منتجات الريف",
  wholesale: "جملة",
  library: "مكتبة",
};
const PIE_COLORS = ["hsl(150 50% 35%)", "hsl(45 85% 55%)", "hsl(200 70% 50%)", "hsl(15 75% 55%)", "hsl(280 50% 55%)", "hsl(170 45% 45%)", "hsl(35 80% 55%)"];

const iconFor = (kind: string) => (kind === "credit" ? ArrowDownRight : kind === "reward" ? Gift : ArrowUpRight);
const isPositive = (kind: string) => kind === "credit" || kind === "reward";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 36e5;
  if (diffH < 24) return `اليوم · ${toLatin(d.getHours().toString().padStart(2, "0"))}:${toLatin(d.getMinutes().toString().padStart(2, "0"))}`;
  if (diffH < 48) return "أمس";
  return toLatin(d.toLocaleDateString("en-GB"));
};

const buildInsight = (topName: string, topPct: number, topValue: number): { text: string; cta?: { to: string; label: string } } => {
  if (topName.includes("لحوم") && topPct >= 30) {
    const save = Math.round(topValue * 0.15);
    return {
      text: `أنت تنفق ${toLatin(topPct)}٪ من ميزانيتك على اللحوم. اشترك في سلة اللحوم العائلية ووفّر حوالي ${toLatin(save)} ج.م شهريًا.`,
      cta: { to: "/store/baskets" as const, label: "تصفّح السلال" },
    };
  }
  if (topName.includes("سوبر") && topPct >= 35) {
    return {
      text: `معظم إنفاقك على السوبر ماركت (${toLatin(topPct)}٪). جرّب اشتراك السلة الأسبوعية لتوفير الوقت والمال.`,
      cta: { to: "/store/baskets-subs" as const, label: "اشتراك ذكي" },
    };
  }
  if (topName.includes("مطاعم") && topPct >= 30) {
    return {
      text: `${toLatin(topPct)}٪ من مصاريفك على المطاعم. اطلب من مطبخ ريف بأقل من نصف السعر مع نفس الجودة.`,
      cta: { to: "/store/kitchen" as const, label: "مطبخ ريف" },
    };
  }
  if (topName.includes("جملة")) {
    return {
      text: `أنت تشتري بذكاء بالجملة! استمر — هذا يوفّر لك مع كل طلب.`,
      cta: { to: "/store/wholesale" as const, label: "تصفّح الجملة" },
    };
  }
  return {
    text: `أعلى إنفاق لديك على "${topName}" بنسبة ${toLatin(topPct)}٪. راجع الأقسام البديلة لتنويع مشترياتك وكسب نقاط أكثر.`,
    cta: { to: "/sections" as const, label: "كل الأقسام" },
  };
};

const Wallet = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [showAffiliate, setShowAffiliate] = useState(false);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [jar, setJar] = useState<SavingsJar | null>(null);
  const [jarTxs, setJarTxs] = useState<SavingsTx[]>([]);
  const [showJar, setShowJar] = useState(false);
  const [tier, setTier] = useState<TierDef | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [trustLimit, setTrustLimit] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      if (!mounted) return;
      setUserId(user.id);

      const [{ data: bal }, { data: tx }, { data: items }, { data: refRows }, { data: jarRow }, { data: jarTx }, { data: spent }, { data: trust }] = await Promise.all([
        supabase.from("wallet_balances").select("balance,points,coupons,cashback").eq("user_id", user.id).maybeSingle(),
        supabase.from("wallet_transactions").select("id,label,amount,kind,created_at,source").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
        supabase.from("order_items").select("price,quantity,product_id, products(category, old_price, price)").in("order_id",
          (await supabase.from("orders").select("id").eq("user_id", user.id)).data?.map((o: any) => o.id) ?? []
        ),
        supabase.from("referrals").select("id,status,commission,first_order_at,created_at").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("savings_jar").select("balance,auto_save_enabled,round_to,goal,goal_label").eq("user_id", user.id).maybeSingle(),
        supabase.from("savings_transactions").select("id,amount,kind,label,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.rpc("user_total_spent", { _user_id: user.id }),
        supabase.rpc("user_trust_limit", { _user_id: user.id }),
      ]);

      if (!mounted) return;
      setBalance(bal ?? { balance: 0, points: 0, coupons: 0, cashback: 0 });
      setTxs((tx ?? []) as Tx[]);
      setReferrals((refRows ?? []) as ReferralRow[]);
      setJar((jarRow ?? { balance: 0, auto_save_enabled: false, round_to: 5, goal: null, goal_label: null }) as SavingsJar);
      setJarTxs((jarTx ?? []) as SavingsTx[]);
      setTier(tierProgress(Number(spent ?? 0)).tier);
      setTrustLimit(Number(trust ?? 0));

      // detect previous successful commission to celebrate on entry
      const lastReward = (tx ?? []).find((t: any) => t.kind === "reward" && t.source === "referral");
      if (lastReward) {
        const ageH = (Date.now() - new Date(lastReward.created_at).getTime()) / 36e5;
        if (ageH < 0.1) setTimeout(fireConfetti, 400);
      }

      // analytics
      const byCat: Record<string, number> = {};
      let savings = 0;
      for (const it of (items ?? []) as any[]) {
        const cat = it.products?.category || "other";
        const lineTotal = Number(it.price) * Number(it.quantity);
        byCat[cat] = (byCat[cat] || 0) + lineTotal;
        if (it.products?.old_price && it.products?.old_price > it.products?.price) {
          savings += (Number(it.products.old_price) - Number(it.products.price)) * Number(it.quantity);
        }
      }
      const stats = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k, v], i) => ({ name: CATEGORY_LABELS[k] || k, value: Math.round(v), color: PIE_COLORS[i % PIE_COLORS.length] }));
      setCategoryStats(stats);
      setTotalSavings(Math.round(savings));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const ensureReferralCode = async () => {
    if (!userId) return;
    if (referralCode) { setShowAffiliate(true); return; }
    const { data, error } = await supabase.rpc("ensure_referral_code", { _user_id: userId });
    if (error) { toast.error("تعذّر إنشاء كود الدعوة"); return; }
    setReferralCode(data as string);
    setShowAffiliate(true);
  };

  const openTopup = () => {
    if (!userId) { toast.error("سجّل الدخول أولاً"); return; }
    setShowTopup(true);
  };

  if (loading) {
    return <div className="flex h-60 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const successfulRefs = referrals.filter((r) => r.status === "purchased").length;
  const totalCommission = referrals.reduce((s, r) => s + Number(r.commission || 0), 0);

  return (
    <div className="space-y-5 pb-4">
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">محفظتي</h1>
          <p className="mt-1 text-xs text-muted-foreground">رصيد، تحليل، ومكافآت ذكية</p>
        </div>
        <button onClick={ensureReferralCode} className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-[11px] font-extrabold text-primary ring-1 ring-primary/20">
          <Users className="h-3.5 w-3.5" /> شركاء النجاح
        </button>
      </motion.section>

      {/* المحفظة الكبرى */}
      <motion.section
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card-elevated relative overflow-hidden rounded-[1.75rem] p-5 shadow-float ring-1 ring-white/5"
      >
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl" style={{ background: "hsl(var(--glow-wallet-a) / 0.25)" }} />
        <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full blur-3xl" style={{ background: "hsl(var(--glow-wallet-b) / 0.18)" }} />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                <WalletIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[11px] font-bold tracking-wider text-white/85">REEF · WALLET</span>
            </div>
            <div className="flex items-center gap-2">
              {tier && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur">
                  {tier.label} · {toLatin(tier.multiplier)}x
                </span>
              )}
              <CreditCard className="h-5 w-5 text-white/60" />
            </div>
          </div>

          <p className="mt-4 text-[11px] font-bold text-white/70">الرصيد المتاح</p>
          <motion.p
            key={balance?.balance ?? 0}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-extrabold text-white"
          >
            {toLatin(Math.round(balance?.balance ?? 0))} <span className="text-base font-medium text-white/70">ج.م</span>
          </motion.p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-2.5 backdrop-blur-sm ring-1 ring-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-white/80" />
              <div>
                <p className="text-[9px] text-white/70">نقاط الولاء</p>
                <p className="font-display text-sm font-extrabold text-white tabular-nums">{toLatin(balance?.points ?? 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-r border-white/15 pr-2">
              <TrendingUp className="h-3.5 w-3.5 text-white/80" />
              <div>
                <p className="text-[9px] text-white/70">وفّرت معنا</p>
                <p className="font-display text-sm font-extrabold text-white tabular-nums">{toLatin(totalSavings)} ج</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={openTopup} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-xs font-extrabold text-foreground shadow-pill transition active:scale-95">
              <Plus className="h-3.5 w-3.5" /> شحن الرصيد
            </button>
            <button onClick={() => setShowTransfer(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/15 py-2.5 text-xs font-extrabold text-white backdrop-blur transition active:scale-95">
              <Send className="h-3.5 w-3.5" /> تحويل
            </button>
          </div>

          {trustLimit > 0 && (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white/10 p-2 backdrop-blur ring-1 ring-white/15">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-white/90" />
              <p className="flex-1 text-[10px] font-bold text-white/90">
                رصيد ثقة متاح حتى <span className="font-extrabold tabular-nums">{toLatin(trustLimit)} ج.م</span> · يُستخدم تلقائيًا عند الحاجة
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* بطاقات صغيرة */}
      <section className="grid grid-cols-3 gap-2.5">
        {[
          { label: "كوبوناتي", value: toLatin(balance?.coupons ?? 0), icon: Gift },
          { label: "كاش باك", value: `${toLatin(Math.round(balance?.cashback ?? 0))}`, icon: Banknote, suffix: "ج" },
          { label: "إحالات", value: toLatin(successfulRefs), icon: Users },
        ].map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="glass-strong rounded-2xl p-3 shadow-soft"
          >
            <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <p.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
            </div>
            <p className="font-display text-lg font-extrabold tabular-nums">{p.value}{p.suffix && <span className="text-[10px] text-muted-foreground"> {p.suffix}</span>}</p>
            <p className="text-[10px] text-muted-foreground">{p.label}</p>
          </motion.div>
        ))}
      </section>

      {/* تحليل الإنفاق */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="glass-strong rounded-2xl p-4 shadow-soft"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-extrabold">تحليل الإنفاق</h2>
              <p className="text-[10px] text-muted-foreground">توزيع مصاريفك على الأقسام</p>
            </div>
          </div>
        </div>

        {categoryStats.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">ابدأ التسوق لرؤية تحليل ذكي لمصاريفك</div>
        ) : (
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryStats} dataKey="value" innerRadius={32} outerRadius={55} paddingAngle={2} stroke="none">
                    {categoryStats.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [`${toLatin(v)} ج.م`, ""]}
                    contentStyle={{ borderRadius: 10, border: "none", fontSize: 11, background: "hsl(var(--card))", boxShadow: "var(--shadow-soft)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {categoryStats.map((c) => {
                const total = categoryStats.reduce((s, x) => s + x.value, 0);
                const pct = Math.round((c.value / total) * 100);
                return (
                  <div key={c.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                      <span className="truncate font-bold">{c.name}</span>
                    </div>
                    <span className="font-extrabold tabular-nums text-muted-foreground">{toLatin(pct)}٪</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {categoryStats.length > 0 && (() => {
          const top = categoryStats[0];
          const total = categoryStats.reduce((s, x) => s + x.value, 0);
          const topPct = Math.round((top.value / total) * 100);
          const tip = buildInsight(top.name, topPct, top.value);
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 flex items-start gap-2 rounded-xl bg-gradient-to-l from-primary/10 to-accent/10 p-3 ring-1 ring-primary/15"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Lightbulb className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold leading-relaxed text-foreground">{tip.text}</p>
                {tip.cta && (
                  <Link to={tip.cta.to} className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-extrabold text-primary-foreground">
                    {tip.cta.label} ←
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })()}
      </motion.section>

      {/* الحصّالة الذكية */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        onClick={() => setShowJar(true)}
        className="relative cursor-pointer overflow-hidden rounded-2xl p-4 shadow-soft ring-1 ring-border/50"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary-soft)) 0%, hsl(45 70% 92%) 100%)" }}
      >
        <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(45_80%_55%)] text-white shadow-pill">
            <PiggyBank className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-extrabold text-foreground">حصّالتي</h3>
              {jar?.auto_save_enabled && (
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">تلقائي ON</span>
              )}
            </div>
            <p className="text-[10px] text-foreground/70">تقريب القروش من كل طلب لتوفير ذكي</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold text-foreground tabular-nums">{toLatin(Math.round(jar?.balance ?? 0))}</p>
            <p className="text-[9px] text-foreground/60">ج.م مُدّخَرة</p>
          </div>
        </div>
        {jar?.goal && jar.goal > 0 && (
          <div className="relative mt-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-foreground/70">{jar.goal_label || "هدفك"}</span>
              <span className="font-extrabold tabular-nums text-foreground">{toLatin(Math.min(100, Math.round((jar.balance / jar.goal) * 100)))}٪</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(45_80%_55%)]" style={{ width: `${Math.min(100, (jar.balance / jar.goal) * 100)}%` }} />
            </div>
          </div>
        )}
      </motion.section>

      {/* السجل */}
      <section>
        <div className="mb-2.5 flex items-baseline justify-between px-1">
          <h2 className="font-display text-base font-extrabold">سجل المعاملات</h2>
          <button className="text-[11px] font-bold text-primary">عرض الكل</button>
        </div>
        {txs.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center text-xs text-muted-foreground shadow-soft">لا توجد عمليات بعد</div>
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
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${pos ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(t.created_at)}</p>
                  </div>
                  <span className={`font-display text-sm font-extrabold tabular-nums ${pos ? "text-primary" : "text-destructive"}`}>
                    {pos ? "+" : "-"}{toLatin(Math.round(Math.abs(t.amount)))} ج
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {showTopup && <TopupDialog onClose={() => setShowTopup(false)} phone="201080068689" userId={userId!} />}
        {showAffiliate && referralCode && (
          <AffiliateDialog onClose={() => setShowAffiliate(false)} code={referralCode} referrals={referrals} totalCommission={totalCommission} />
        )}
        {showJar && jar && (
          <SavingsJarDialog
            onClose={() => setShowJar(false)}
            userId={userId!}
            jar={jar}
            txs={jarTxs}
            onUpdate={(j, t) => { setJar(j); setJarTxs(t); }}
          />
        )}
        {showTransfer && (
          <TransferDialog
            onClose={() => setShowTransfer(false)}
            balance={Number(balance?.balance ?? 0)}
            onDone={(newBal) => setBalance((b) => b ? { ...b, balance: newBal } : b)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default Wallet;

/* ================= TOPUP ================= */
type PaymentMethod = { id: string; label: string; icon: any; sub: string };
const paymentMethods: PaymentMethod[] = [
  { id: "instapay", label: "إنستا باي", icon: Banknote, sub: "تحويل بنكي فوري" },
  { id: "vodafone-cash", label: "فودافون كاش", icon: Smartphone, sub: "تحويل فوري" },
  { id: "bank", label: "تحويل بنكي", icon: Building2, sub: "حساب البنك" },
  { id: "cash", label: "كاش عند المندوب", icon: Banknote, sub: "تحصيل مباشر" },
];

const presets = [200, 500, 1000, 2000];

const bonusFor = (amount: number): { cash: number; points: number; label: string } | null => {
  if (amount >= 2000) return { cash: 150, points: 200, label: "هدية 150 ج.م + 200 نقطة" };
  if (amount >= 1000) return { cash: 50, points: 100, label: "هدية 50 ج.م + 100 نقطة" };
  if (amount >= 500) return { cash: 20, points: 40, label: "هدية 20 ج.م + 40 نقطة" };
  if (amount >= 200) return { cash: 0, points: 20, label: "20 نقطة هدية" };
  return null;
};

const TopupDialog = ({ onClose, phone, userId }: { onClose: () => void; phone: string; userId: string }) => {
  const [amount, setAmount] = useState<number>(500);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<string>(paymentMethods[0].id);

  const finalAmount = custom ? Number(custom.replace(/\D/g, "")) : amount;
  const bonus = bonusFor(finalAmount);

  const submit = () => {
    if (!finalAmount || finalAmount < 50) {
      toast.error("الحد الأدنى للشحن 50 ج.م");
      return;
    }
    const m = paymentMethods.find((p) => p.id === method)!;
    const customerCode = userId.slice(0, 8).toUpperCase();
    const text = `🌿 *ريف المدينة - شحن محفظة*\n\n• كود العميل: ${customerCode}\n• المبلغ: ${finalAmount} ج.م${bonus ? `\n• المكافأة: ${bonus.label}` : ""}\n• وسيلة الدفع: ${m.label}\n\nسأقوم بإرسال إثبات الدفع الآن.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    fireConfetti();
    toast.success("تم إرسال طلب الشحن بنجاح! 🎉", { description: bonus ? `ستحصل على: ${bonus.label}` : undefined });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold">شحن المحفظة</h2>
            <p className="text-[11px] text-muted-foreground">اختر القيمة وطريقة الدفع</p>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* مكافأة حية */}
        <AnimatePresence mode="wait">
          {bonus && (
            <motion.div
              key={bonus.label}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary/15 to-accent/15 p-3 ring-1 ring-primary/20"
            >
              <Gift className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-[11px] font-extrabold text-primary">🎁 {bonus.label}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">قيم سريعة (ج.م)</p>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {presets.map((p) => {
            const active = !custom && amount === p;
            return (
              <button
                key={p}
                onClick={() => { setAmount(p); setCustom(""); }}
                className={`rounded-xl py-2.5 text-xs font-extrabold transition ${active ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5 text-foreground"}`}
              >
                {toLatin(p)}
              </button>
            );
          })}
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">مبلغ مخصص</span>
          <div className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2.5">
            <input
              type="text"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
              placeholder="مثال: 750"
              className="flex-1 bg-transparent text-sm font-bold tabular-nums outline-none"
              dir="ltr"
            />
            <span className="text-xs font-bold text-muted-foreground">ج.م</span>
          </div>
        </label>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">طريقة الدفع</p>
        <div className="mb-5 space-y-2">
          {paymentMethods.map((m) => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-right transition ${active ? "border-primary bg-primary/5" : "border-border bg-background"}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-foreground"}`}>
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
              </button>
            );
          })}
        </div>

        <button
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill transition active:scale-[0.98]"
        >
          متابعة عبر واتساب · {fmtMoney(finalAmount || 0)}
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">سيتم تحويلك للواتساب لإتمام الدفع وإضافة الرصيد لمحفظتك</p>
      </motion.div>
    </motion.div>
  );
};

/* ================= SAVINGS JAR ================= */
const SavingsJarDialog = ({ onClose, userId, jar, txs, onUpdate }: {
  onClose: () => void;
  userId: string;
  jar: SavingsJar;
  txs: SavingsTx[];
  onUpdate: (j: SavingsJar, t: SavingsTx[]) => void;
}) => {
  const [autoSave, setAutoSave] = useState(jar.auto_save_enabled);
  const [roundTo, setRoundTo] = useState(jar.round_to);
  const [goal, setGoal] = useState(jar.goal ? String(jar.goal) : "");
  const [goalLabel, setGoalLabel] = useState(jar.goal_label ?? "");
  const [depositAmount, setDepositAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [{ data: j }, { data: t }] = await Promise.all([
      supabase.from("savings_jar").select("balance,auto_save_enabled,round_to,goal,goal_label").eq("user_id", userId).maybeSingle(),
      supabase.from("savings_transactions").select("id,amount,kind,label,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);
    onUpdate((j ?? { balance: 0, auto_save_enabled: false, round_to: 5, goal: null, goal_label: null }) as SavingsJar, (t ?? []) as SavingsTx[]);
  };

  const upsertJar = async (patch: Partial<SavingsJar> & { balance?: number }) => {
    const next = { ...jar, ...patch, user_id: userId };
    const { error } = await supabase.from("savings_jar").upsert(next as any, { onConflict: "user_id" });
    if (error) { toast.error("تعذّر الحفظ"); return false; }
    return true;
  };

  const saveSettings = async () => {
    setBusy(true);
    const ok = await upsertJar({
      auto_save_enabled: autoSave,
      round_to: roundTo,
      goal: goal ? Number(goal) : null,
      goal_label: goalLabel || null,
    });
    setBusy(false);
    if (ok) {
      toast.success("تم حفظ إعدادات الحصّالة");
      await refresh();
    }
  };

  const deposit = async (amount: number, label: string, kind = "deposit") => {
    if (amount <= 0) return;
    setBusy(true);
    const newBalance = Number(jar.balance || 0) + amount;
    const ok = await upsertJar({ balance: newBalance });
    if (ok) {
      await supabase.from("savings_transactions").insert({ user_id: userId, amount, kind, label });
      fireMiniConfetti();
      toast.success(`+${toLatin(amount)} ج.م في حصّالتك 🐷`);
      await refresh();
      setDepositAmount("");
    }
    setBusy(false);
  };

  const withdraw = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) return;
    if (amt > Number(jar.balance || 0)) { toast.error("الرصيد غير كافٍ"); return; }
    setBusy(true);
    const newBalance = Number(jar.balance || 0) - amt;
    const ok = await upsertJar({ balance: newBalance });
    if (ok) {
      await supabase.from("savings_transactions").insert({ user_id: userId, amount: amt, kind: "withdraw", label: "سحب من الحصّالة" });
      toast.success(`تم تحويل ${toLatin(amt)} ج.م إلى محفظتك`);
      await refresh();
      setDepositAmount("");
    }
    setBusy(false);
  };

  const goalPct = jar.goal && jar.goal > 0 ? Math.min(100, (Number(jar.balance) / Number(jar.goal)) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="font-display text-lg font-extrabold">الحصّالة الذكية</h2>
              <p className="text-[11px] text-muted-foreground">ادّخر بدون أن تشعر</p>
            </div>
          </div>
        </div>

        {/* بطاقة الحصّالة */}
        <div className="relative mb-4 overflow-hidden rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, hsl(220 25% 12%), hsl(150 35% 18%) 60%, hsl(45 55% 28%))" }}>
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[hsl(45_80%_55%)]/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <PiggyBank className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/70">الرصيد المُدّخَر</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">{toLatin(Math.round(jar.balance))} <span className="text-sm text-white/70">ج.م</span></p>
            </div>
          </div>
          {jar.goal && jar.goal > 0 && (
            <div className="relative mt-4">
              <div className="flex items-center justify-between text-[10px] text-white/85">
                <span className="flex items-center gap-1 font-bold"><Target className="h-3 w-3" /> {jar.goal_label || "هدفك"}</span>
                <span className="font-extrabold tabular-nums">{toLatin(Math.round(jar.balance))} / {toLatin(Math.round(jar.goal))} ج</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/15">
                <motion.div initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-[hsl(45_85%_60%)] to-white" />
              </div>
            </div>
          )}
        </div>

        {/* إيداع/سحب سريع */}
        <p className="mb-2 text-[11px] font-bold text-muted-foreground">إيداع سريع (ج.م)</p>
        <div className="mb-2 grid grid-cols-4 gap-2">
          {[5, 10, 25, 50].map((v) => (
            <button key={v} onClick={() => deposit(v, `إيداع يدوي ${v} ج.م`)} disabled={busy}
              className="rounded-xl bg-primary/10 py-2.5 text-xs font-extrabold text-primary transition active:scale-95 disabled:opacity-50">
              +{toLatin(v)}
            </button>
          ))}
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text" inputMode="numeric" dir="ltr"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="مبلغ مخصص"
            className="flex-1 rounded-xl bg-foreground/5 px-3 py-2.5 text-sm font-bold tabular-nums outline-none"
          />
          <button
            onClick={() => deposit(Number(depositAmount), `إيداع يدوي ${depositAmount} ج.م`)}
            disabled={busy || !depositAmount}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
          <button
            onClick={withdraw}
            disabled={busy || !depositAmount}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground/10 text-foreground disabled:opacity-50"
          >
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>

        {/* الإعدادات */}
        <div className="mb-4 rounded-2xl bg-foreground/5 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <p className="text-[12px] font-extrabold">الادخار التلقائي</p>
            </div>
            <button
              onClick={() => setAutoSave((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition ${autoSave ? "bg-primary" : "bg-foreground/20"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${autoSave ? "right-0.5" : "right-[calc(100%-1.375rem)]"}`} />
            </button>
          </div>
          <p className="mb-2 text-[10px] text-muted-foreground">يُقرّب كل طلب لأقرب مضاعف ويضع الفرق في حصّالتك تلقائيًا</p>
          <p className="mb-1.5 text-[10px] font-bold text-muted-foreground">قرّب لأقرب</p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 25].map((r) => (
              <button key={r} onClick={() => setRoundTo(r)}
                className={`rounded-lg py-2 text-[11px] font-extrabold transition ${roundTo === r ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}>
                {toLatin(r)} ج
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="text" value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)}
              placeholder="اسم الهدف (مثلاً: عمرة)"
              className="rounded-lg bg-background px-3 py-2 text-[12px] font-bold outline-none"
            />
            <input
              type="text" inputMode="numeric" dir="ltr" value={goal}
              onChange={(e) => setGoal(e.target.value.replace(/\D/g, ""))}
              placeholder="مبلغ الهدف"
              className="rounded-lg bg-background px-3 py-2 text-[12px] font-bold tabular-nums outline-none"
            />
          </div>

          <button
            onClick={saveSettings} disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-extrabold text-primary-foreground disabled:opacity-50"
          >
            حفظ الإعدادات
          </button>
        </div>

        {/* السجل */}
        {txs.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-bold text-muted-foreground">آخر العمليات</p>
            <div className="space-y-1.5">
              {txs.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-foreground/5 px-3 py-2 text-[11px]">
                  <div>
                    <p className="font-bold">{t.label}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDate(t.created_at)}</p>
                  </div>
                  <span className={`font-extrabold tabular-nums ${t.kind === "withdraw" ? "text-destructive" : "text-primary"}`}>
                    {t.kind === "withdraw" ? "-" : "+"}{toLatin(Math.round(Math.abs(Number(t.amount))))} ج
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ================= AFFILIATE ================= */
const AffiliateDialog = ({ onClose, code, referrals, totalCommission }: { onClose: () => void; code: string; referrals: ReferralRow[]; totalCommission: number }) => {
  const totalRegistered = referrals.length;
  const totalPurchased = referrals.filter((r) => r.status === "purchased").length;

  const inviteText = `🌿 انضم إلى ريف المدينة عبر كود الدعوة: *${code}* واحصل على خصم خاص على أول طلب! 🎁\nحمّل التطبيق الآن.`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("تم نسخ الكود");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ text: inviteText }); return; } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="font-display text-lg font-extrabold">شركاء النجاح</h2>
              <p className="text-[11px] text-muted-foreground">ادعُ أصدقاءك واربح عمولات</p>
            </div>
          </div>
        </div>

        {/* بطاقة الكود */}
        <div className="relative mb-4 overflow-hidden rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(45 80% 55%))" }}>
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">كود الدعوة الخاص بك</p>
          <p className="my-2 font-display text-3xl font-extrabold tracking-[0.2em]">{code}</p>
          <div className="flex gap-2">
            <button onClick={copyCode} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/20 py-2 text-[11px] font-extrabold text-white backdrop-blur transition active:scale-95">
              <Copy className="h-3.5 w-3.5" /> نسخ
            </button>
            <button onClick={share} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-[11px] font-extrabold text-foreground transition active:scale-95">
              <Share2 className="h-3.5 w-3.5" /> مشاركة
            </button>
          </div>
        </div>

        {/* لوحة التتبع */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { label: "مسجلين", value: totalRegistered },
            { label: "اشتروا", value: totalPurchased },
            { label: "عمولاتك", value: `${toLatin(Math.round(totalCommission))} ج` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-foreground/5 p-3 text-center">
              <p className="font-display text-xl font-extrabold tabular-nums">{typeof s.value === "number" ? toLatin(s.value) : s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* قاعدة المكافأة */}
        <div className="mb-4 rounded-2xl bg-primary/8 p-3 ring-1 ring-primary/15">
          <p className="text-[11px] font-extrabold text-primary">🎯 كيف تعمل العمولة؟</p>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">
            احصل على <b>10٪ عمولة نقدية</b> أو <b>50 نقطة</b> عند أول طلب ناجح يقوم به العميل الذي سجّل بكودك. تُضاف العمولة تلقائيًا إلى محفظتك.
          </p>
        </div>

        {/* قائمة الإحالات */}
        {referrals.length > 0 && (
          <div className="mb-2">
            <p className="mb-2 text-[11px] font-bold text-muted-foreground">آخر الإحالات</p>
            <div className="space-y-1.5">
              {referrals.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-foreground/5 px-3 py-2 text-[11px]">
                  <span className="font-bold">عميل #{r.id.slice(0, 6)}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${r.status === "purchased" ? "bg-primary/15 text-primary" : "bg-foreground/10 text-muted-foreground"}`}>
                    {r.status === "purchased" ? `+${toLatin(Math.round(r.commission))} ج` : "بانتظار الشراء"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ================= P2P TRANSFER ================= */
const TransferDialog = ({ onClose, balance, onDone }: { onClose: () => void; balance: number; onDone: (newBal: number) => void }) => {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const amt = Number(amount || 0);
  const valid = amt > 0 && amt <= balance && amt <= 5000 && phone.replace(/\D/g, "").length >= 10;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("wallet_transfer", {
      _recipient_phone: phone,
      _amount: amt,
      _note: note || undefined,
    });
    setBusy(false);
    if (error) {
      const msg = error.message || "";
      if (msg.includes("insufficient")) toast.error("الرصيد غير كافٍ");
      else if (msg.includes("recipient_not_found")) toast.error("لا يوجد مستخدم مسجل بهذا الرقم");
      else if (msg.includes("self_transfer")) toast.error("لا يمكنك التحويل لنفسك");
      else if (msg.includes("limit_exceeded")) toast.error("الحد الأقصى للتحويل 5000 ج.م");
      else if (msg.includes("invalid_phone")) toast.error("رقم الهاتف غير صحيح");
      else toast.error("تعذّر التحويل");
      return;
    }
    if (data) {
      fireMiniConfetti();
      toast.success(`تم تحويل ${toLatin(amt)} ج.م بنجاح ✅`);
      onDone(balance - amt);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="font-display text-lg font-extrabold">تحويل رصيد</h2>
              <p className="text-[11px] text-muted-foreground">إلى أي مستخدم في ريف المدينة</p>
            </div>
          </div>
          <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-extrabold text-primary">
            متاح: {toLatin(Math.round(balance))} ج
          </span>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <Phone className="h-3 w-3" /> رقم هاتف المستلم
          </span>
          <input
            type="tel" inputMode="tel" dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder="01xxxxxxxxx"
            className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">المبلغ (ج.م) · حد أقصى 5000</span>
          <input
            type="text" inputMode="numeric" dir="ltr"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-lg font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <div className="mb-3 grid grid-cols-4 gap-2">
          {[50, 100, 200, 500].map((v) => (
            <button key={v} onClick={() => setAmount(String(v))}
              className="rounded-xl bg-foreground/5 py-2 text-xs font-extrabold transition active:scale-95">
              {toLatin(v)}
            </button>
          ))}
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">ملاحظة (اختياري)</span>
          <input
            type="text" value={note} onChange={(e) => setNote(e.target.value.slice(0, 40))}
            placeholder="مثال: مصاريف الأسبوع"
            className="w-full rounded-xl bg-foreground/5 px-3 py-2.5 text-sm font-bold outline-none"
          />
        </label>

        <div className="mb-4 rounded-xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20">
          <p className="text-[10px] font-bold leading-relaxed text-amber-700 dark:text-amber-300">
            ⚠️ التحويل فوري ولا يمكن إلغاؤه. تأكد من رقم المستلم.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={!valid || busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill transition active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          تحويل {amt > 0 ? `${toLatin(amt)} ج.م` : ""}
        </button>
      </motion.div>
    </motion.div>
  );
};
