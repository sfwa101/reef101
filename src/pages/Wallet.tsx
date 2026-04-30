import {
  Wallet as WalletIcon, Plus, ArrowDownRight, ArrowUpRight, Gift, CreditCard, Loader2, X, Banknote,
  Smartphone, Building2, TrendingUp, Users, Copy, Share2, Sparkles, ChevronLeft, BarChart3,
  PiggyBank, Target, Settings2, Minus, Send, Lightbulb, ShieldCheck, Phone, QrCode, ScanLine,
  Wallet2, PieChart as PieIcon, Wand2, Pencil, Check,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toLatin, fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fireConfetti, fireMiniConfetti } from "@/lib/confetti";
import { tierProgress, type TierDef } from "@/lib/tiers";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";

type WalletBalance = { balance: number; points: number; coupons: number; cashback: number };
type Tx = { id: string; label: string; amount: number; kind: string; created_at: string; source?: string | null };
type CategoryStat = { name: string; key: string; value: number; color: string };
type ReferralRow = { id: string; status: string; commission: number; first_order_at: string | null; created_at: string };
type SavingsJar = { balance: number; auto_save_enabled: boolean; round_to: number; goal: number | null; goal_label: string | null };
type SavingsTx = { id: string; amount: number; kind: string; label: string; created_at: string };
type Budget = { category: string; monthly_limit: number };
type Profile = { full_name: string | null };

const CATEGORY_LABELS: Record<string, string> = {
  supermarket: "السوبر ماركت", produce: "خضار وفاكهة", meat: "لحوم ودواجن", dairy: "ألبان",
  sweets: "حلويات", pharmacy: "صيدلية", kitchen: "أدوات مطبخ", baskets: "سلال",
  restaurants: "مطاعم", village: "منتجات الريف", wholesale: "جملة", library: "مكتبة",
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

/** monthly category insight */
const monthAdvisor = (
  monthByCat: Record<string, number>,
  budgets: Record<string, number>,
): { text: string; cta?: { to: string; label: string } } | null => {
  // 1) overspend warning vs budget
  const overspend = Object.entries(monthByCat)
    .map(([k, v]) => ({ k, v, lim: budgets[k] || 0, pct: budgets[k] ? v / budgets[k] : 0 }))
    .filter((x) => x.lim > 0 && x.pct >= 0.85)
    .sort((a, b) => b.pct - a.pct)[0];
  if (overspend) {
    const lbl = CATEGORY_LABELS[overspend.k] || overspend.k;
    if (overspend.pct >= 1) {
      return {
        text: `تجاوزت ميزانية "${lbl}" بنسبة ${toLatin(Math.round((overspend.pct - 1) * 100))}٪. خفّض الإنفاق أو ارفع حدّك الشهري.`,
        cta: { to: "/sections" as const, label: "تصفّح أقسام أخرى" },
      };
    }
    return {
      text: `اقتربت من سقف ميزانية "${lbl}" — استخدمت ${toLatin(Math.round(overspend.pct * 100))}٪. باقي ${toLatin(Math.max(0, Math.round(overspend.lim - overspend.v)))} ج.م لهذا الشهر.`,
    };
  }
  // 2) dairy → subscription tip
  if ((monthByCat["dairy"] || 0) >= 350) {
    const save = Math.round(monthByCat["dairy"] * 0.15);
    return {
      text: `أنفقت ${toLatin(Math.round(monthByCat["dairy"]))} ج.م على الألبان هذا الشهر. وفّر حوالي ${toLatin(save)} ج.م مع سلة الألبان الأسبوعية!`,
      cta: { to: "/store/baskets-subs" as const, label: "اشترك الآن" },
    };
  }
  // 3) restaurants → kitchen
  if ((monthByCat["restaurants"] || 0) >= 500) {
    return {
      text: `وفّر حتى 40٪ على المطاعم — جرّب وجبات مطبخ ريف بنفس الجودة وبأقل من نصف السعر.`,
      cta: { to: "/store/kitchen" as const, label: "مطبخ ريف" },
    };
  }
  return {
    text: `بناءً على عاداتك، السلال الأسبوعية أوفر لك بحوالي 12-18٪ شهريًا. جرّبها وراقب الفرق في حصّالتك.`,
    cta: { to: "/store/baskets" as const, label: "اعرض السلال" },
  };
};

const Wallet = () => {
  const [tab, setTab] = useState<"balance" | "budgets" | "affiliate">("balance");
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      if (!mounted) return;
      setUserId(user.id);

      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

      const [{ data: bal }, { data: prof }, { data: tx }, { data: items }, { data: refRows }, { data: jarRow }, { data: jarTx }, { data: spent }, { data: trust }, { data: refCode }, { data: budgetRows }] = await Promise.all([
        supabase.from("wallet_balances").select("balance,points,coupons,cashback").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("wallet_transactions").select("id,label,amount,kind,created_at,source").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
        supabase.from("order_items").select("price,quantity,product_id,created_at,products(category, old_price, price)").in("order_id",
          (await supabase.from("orders").select("id").eq("user_id", user.id)).data?.map((o: any) => o.id) ?? []
        ),
        supabase.from("referrals").select("id,status,commission,first_order_at,created_at").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("savings_jar").select("balance,auto_save_enabled,round_to,goal,goal_label").eq("user_id", user.id).maybeSingle(),
        supabase.from("savings_transactions").select("id,amount,kind,label,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
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
      setJar((jarRow ?? { balance: 0, auto_save_enabled: false, round_to: 5, goal: null, goal_label: null }) as SavingsJar);
      setJarTxs((jarTx ?? []) as SavingsTx[]);
      setTier(tierProgress(Number(spent ?? 0)).tier);
      setTrustLimit(Number(trust ?? 0));
      setReferralCode((refCode as any)?.code ?? null);
      const bMap: Record<string, number> = {};
      ((budgetRows ?? []) as Budget[]).forEach((b) => { bMap[b.category] = Number(b.monthly_limit); });
      setBudgets(bMap);

      const lastReward = (tx ?? []).find((t: any) => t.kind === "reward" && t.source === "referral");
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
          savings += (Number(it.products.old_price) - Number(it.products.price)) * Number(it.quantity);
        }
      }
      const stats = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k, v], i) => ({ key: k, name: CATEGORY_LABELS[k] || k, value: Math.round(v), color: PIE_COLORS[i % PIE_COLORS.length] }));
      setCategoryStats(stats);
      setMonthByCat(monthCat);
      setTotalSavings(Math.round(savings));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const ensureReferralCode = async (): Promise<string | null> => {
    if (!userId) return null;
    if (referralCode) return referralCode;
    const { data, error } = await supabase.rpc("ensure_referral_code", { _user_id: userId });
    if (error) { toast.error("تعذّر إنشاء كود الدعوة"); return null; }
    setReferralCode(data as string);
    return data as string;
  };

  const openTopup = () => {
    if (!userId) { toast.error("سجّل الدخول أولاً"); return; }
    setShowTopup(true);
  };

  const openAffiliateTab = async () => {
    setTab("affiliate");
    if (!referralCode) await ensureReferralCode();
  };

  if (loading) {
    return <div className="flex h-60 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const successfulRefs = referrals.filter((r) => r.status === "purchased").length;
  const totalCommission = referrals.reduce((s, r) => s + Number(r.commission || 0), 0);
  const customerCode = (userId ?? "00000000").slice(0, 12).toUpperCase().replace(/-/g, "");

  return (
    <div className="space-y-5 pb-4">
      {/* HEADER */}
      <motion.section
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">محفظتي</h1>
          <p className="mt-1 text-xs text-muted-foreground">بنكك الرقمي · مدير ميزانياتك · شركاء النجاح</p>
        </div>
        {tier && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold text-primary ring-1 ring-primary/20">
            {tier.label} · {toLatin(tier.multiplier)}x
          </span>
        )}
      </motion.section>

      {/* DIGITAL CARD — always visible */}
      <DigitalCard
        name={profile?.full_name || "عميل ريف"}
        balance={Number(balance?.balance ?? 0)}
        points={balance?.points ?? 0}
        savings={totalSavings}
        tierLabel={tier?.label}
        trustLimit={trustLimit}
        onTopup={openTopup}
        onTransfer={() => setShowTransfer(true)}
        onPos={() => setShowPos(true)}
      />

      {/* TABS */}
      <SlidingTabs
        tabs={[
          { id: "balance", label: "الرصيد", icon: Wallet2 },
          { id: "budgets", label: "التحليلات", icon: PieIcon },
          { id: "affiliate", label: "الإحالات", icon: Users },
        ]}
        active={tab}
        onChange={(t) => {
          if (t === "affiliate") openAffiliateTab();
          else setTab(t as any);
        }}
      />

      <AnimatePresence mode="wait">
        {tab === "balance" && (
          <motion.div key="balance" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }} className="space-y-5">
            <MiniStatGrid coupons={balance?.coupons ?? 0} cashback={balance?.cashback ?? 0} refs={successfulRefs} />
            <SavingsJarTile jar={jar} onOpen={() => setShowJar(true)} />
            <TransactionsList txs={txs} />
          </motion.div>
        )}

        {tab === "budgets" && (
          <motion.div key="budgets" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }} className="space-y-5">
            <SpendingDonut stats={categoryStats} />
            <AIAdvisor monthByCat={monthByCat} budgets={budgets} />
            <BudgetTracker
              userId={userId!}
              monthByCat={monthByCat}
              budgets={budgets}
              onChange={setBudgets}
            />
          </motion.div>
        )}

        {tab === "affiliate" && (
          <motion.div key="affiliate" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}>
            <AffiliateHub
              code={referralCode}
              referrals={referrals}
              totalCommission={totalCommission}
              successfulRefs={successfulRefs}
              onEnsureCode={ensureReferralCode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTopup && <TopupDialog onClose={() => setShowTopup(false)} phone="201080068689" userId={userId!} />}
        {showJar && jar && (
          <SavingsJarDialog
            onClose={() => setShowJar(false)} userId={userId!} jar={jar} txs={jarTxs}
            onUpdate={(j, t) => { setJar(j); setJarTxs(t); }}
          />
        )}
        {showTransfer && (
          <TransferDialog
            onClose={() => setShowTransfer(false)} balance={Number(balance?.balance ?? 0)}
            onDone={(newBal) => setBalance((b) => b ? { ...b, balance: newBal } : b)}
          />
        )}
        {showPos && (
          <PosBarcodeDialog
            onClose={() => setShowPos(false)}
            customerCode={customerCode}
            name={profile?.full_name || "عميل ريف"}
            balance={Number(balance?.balance ?? 0)}
            points={balance?.points ?? 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default Wallet;

/* ================= DIGITAL CARD ================= */
const DigitalCard = ({ name, balance, points, savings, tierLabel, trustLimit, onTopup, onTransfer, onPos }: {
  name: string; balance: number; points: number; savings: number; tierLabel?: string; trustLimit: number;
  onTopup: () => void; onTransfer: () => void; onPos: () => void;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-float ring-1 ring-white/10"
    style={{
      background: "linear-gradient(135deg, hsl(150 45% 14%) 0%, hsl(160 40% 22%) 50%, hsl(45 60% 30%) 100%)",
    }}
  >
    <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl" style={{ background: "hsl(45 80% 55% / 0.25)" }} />
    <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full blur-3xl" style={{ background: "hsl(150 60% 40% / 0.25)" }} />
    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

    <div className="relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20"><WalletIcon className="h-3.5 w-3.5 text-white" /></div>
          <span className="text-[11px] font-bold tracking-[0.18em] text-white/85">REEF · DIGITAL</span>
        </div>
        <CreditCard className="h-5 w-5 text-white/50" />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">حامل البطاقة</p>
          <p className="mt-0.5 font-display text-sm font-extrabold text-white">{name}</p>
        </div>
        {tierLabel && (
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-white ring-1 ring-white/20">
            {tierLabel}
          </span>
        )}
      </div>

      <p className="mt-3 text-[11px] font-bold text-white/70">الرصيد المتاح</p>
      <motion.p
        key={balance} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl font-extrabold text-white tabular-nums"
      >
        {toLatin(Math.round(balance))} <span className="text-base font-medium text-white/70">ج.م</span>
      </motion.p>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-2.5 ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(45_90%_70%)]" />
          <div>
            <p className="text-[9px] text-white/70">نقاط الولاء</p>
            <p className="font-display text-sm font-extrabold text-white tabular-nums">{toLatin(points)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-white/15 pr-2">
          <TrendingUp className="h-3.5 w-3.5 text-[hsl(140_70%_70%)]" />
          <div>
            <p className="text-[9px] text-white/70">وفّرت معنا</p>
            <p className="font-display text-sm font-extrabold text-white tabular-nums">{toLatin(savings)} ج</p>
          </div>
        </div>
      </div>

      {/* primary actions */}
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <button onClick={onPos} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white py-2.5 text-foreground shadow-pill transition active:scale-95">
          <ScanLine className="h-4 w-4" strokeWidth={2.4} />
          <span className="text-[10px] font-extrabold leading-none">الدفع في الفرع</span>
        </button>
        <button onClick={onTopup} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 py-2.5 text-white ring-1 ring-white/20 transition active:scale-95">
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          <span className="text-[10px] font-extrabold leading-none">شحن الرصيد</span>
        </button>
        <button onClick={onTransfer} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 py-2.5 text-white ring-1 ring-white/20 transition active:scale-95">
          <Send className="h-4 w-4" strokeWidth={2.4} />
          <span className="text-[10px] font-extrabold leading-none">تحويل</span>
        </button>
      </div>

      {trustLimit > 0 && (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white/10 p-2 ring-1 ring-white/15">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-white/90" />
          <p className="flex-1 text-[10px] font-bold text-white/90">
            رصيد ثقة متاح حتى <span className="font-extrabold tabular-nums">{toLatin(trustLimit)} ج.م</span> · يُستخدم تلقائيًا عند الحاجة
          </p>
        </div>
      )}
    </div>
  </motion.section>
);

/* ================= SLIDING TABS ================= */
const SlidingTabs = ({ tabs, active, onChange }: {
  tabs: { id: string; label: string; icon: any }[];
  active: string;
  onChange: (id: string) => void;
}) => {
  const idx = tabs.findIndex((t) => t.id === active);
  return (
    <div className="relative grid grid-cols-3 gap-1 rounded-2xl bg-foreground/5 p-1 ring-1 ring-border/40">
      <motion.div
        className="absolute inset-y-1 rounded-xl bg-card shadow-soft ring-1 ring-border/40"
        initial={false}
        animate={{ left: `calc(${(idx / tabs.length) * 100}% + 4px)`, width: `calc(${100 / tabs.length}% - 8px)` }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      />
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-extrabold transition ${isActive ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

/* ================= MINI STAT GRID ================= */
const MiniStatGrid = ({ coupons, cashback, refs }: { coupons: number; cashback: number; refs: number }) => (
  <section className="grid grid-cols-3 gap-2.5">
    {[
      { label: "كوبوناتي", value: toLatin(coupons), icon: Gift },
      { label: "كاش باك", value: toLatin(Math.round(cashback)), icon: Banknote, suffix: "ج" },
      { label: "إحالات", value: toLatin(refs), icon: Users },
    ].map((p, i) => (
      <motion.div
        key={p.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 * i, duration: 0.35 }}
        className="glass-strong rounded-2xl p-3 shadow-soft"
      >
        <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <p.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </div>
        <p className="font-display text-lg font-extrabold tabular-nums">
          {p.value}{p.suffix && <span className="text-[10px] text-muted-foreground"> {p.suffix}</span>}
        </p>
        <p className="text-[10px] text-muted-foreground">{p.label}</p>
      </motion.div>
    ))}
  </section>
);

/* ================= SAVINGS TILE ================= */
const SavingsJarTile = ({ jar, onOpen }: { jar: SavingsJar | null; onOpen: () => void }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
    onClick={onOpen}
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
          {jar?.auto_save_enabled && <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">تلقائي ON</span>}
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
);

/* ================= TRANSACTIONS LIST ================= */
const TransactionsList = ({ txs }: { txs: Tx[] }) => (
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
              key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
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
);

/* ================= SPENDING DONUT ================= */
const SpendingDonut = ({ stats }: { stats: CategoryStat[] }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
    className="glass-strong rounded-2xl p-4 shadow-soft"
  >
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><BarChart3 className="h-4 w-4" /></div>
      <div>
        <h2 className="font-display text-sm font-extrabold">تحليل الإنفاق</h2>
        <p className="text-[10px] text-muted-foreground">توزيع مصاريفك على الأقسام (الإجمالي)</p>
      </div>
    </div>

    {stats.length === 0 ? (
      <div className="py-8 text-center text-xs text-muted-foreground">ابدأ التسوق لرؤية تحليل ذكي لمصاريفك</div>
    ) : (
      <div className="grid grid-cols-[140px_1fr] items-center gap-3">
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2} stroke="none">
                {stats.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${toLatin(v)} ج.م`, ""]}
                contentStyle={{ borderRadius: 10, border: "none", fontSize: 11, background: "hsl(var(--card))", boxShadow: "var(--shadow-soft)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {stats.map((c) => {
            const total = stats.reduce((s, x) => s + x.value, 0);
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
  </motion.section>
);

/* ================= AI ADVISOR ================= */
const AIAdvisor = ({ monthByCat, budgets }: { monthByCat: Record<string, number>; budgets: Record<string, number> }) => {
  const tip = useMemo(() => monthAdvisor(monthByCat, budgets), [monthByCat, budgets]);
  if (!tip) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-4 shadow-soft ring-1 ring-primary/15"
      style={{ background: "linear-gradient(135deg, hsl(var(--primary-soft)) 0%, hsl(200 60% 92%) 100%)" }}
    >
      <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(200_70%_45%)] text-white shadow-pill">
          <Wand2 className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">المستشار المالي الذكي</p>
          <p className="mt-1 text-[12px] font-bold leading-relaxed text-foreground">{tip.text}</p>
          {tip.cta && (
            <Link to={tip.cta.to} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-pill">
              {tip.cta.label} ←
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  );
};

/* ================= BUDGET TRACKER ================= */
const BUDGETABLE_CATEGORIES = ["meat", "dairy", "produce", "supermarket", "restaurants", "sweets"];
const progressTone = (pct: number) => {
  if (pct >= 1) return { bar: "bg-destructive", text: "text-destructive", chip: "bg-destructive/10 text-destructive" };
  if (pct >= 0.75) return { bar: "bg-orange-500", text: "text-orange-600", chip: "bg-orange-500/10 text-orange-600" };
  return { bar: "bg-primary", text: "text-primary", chip: "bg-primary/10 text-primary" };
};

const BudgetTracker = ({ userId, monthByCat, budgets, onChange }: {
  userId: string;
  monthByCat: Record<string, number>;
  budgets: Record<string, number>;
  onChange: (b: Record<string, number>) => void;
}) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const start = (cat: string) => { setEditing(cat); setDraft(String(budgets[cat] || "")); };

  const save = async (cat: string) => {
    const n = Number(draft.replace(/\D/g, "")) || 0;
    setBusy(true);
    if (n === 0) {
      await supabase.from("category_budgets").delete().eq("user_id", userId).eq("category", cat);
    } else {
      await supabase.from("category_budgets").upsert({ user_id: userId, category: cat, monthly_limit: n }, { onConflict: "user_id,category" });
    }
    const next = { ...budgets };
    if (n === 0) delete next[cat]; else next[cat] = n;
    onChange(next);
    setEditing(null);
    setBusy(false);
    toast.success("تم حفظ الميزانية");
  };

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-base font-extrabold">ميزانياتي الشهرية</h2>
        <span className="text-[10px] font-bold text-muted-foreground">حدّد سقف لكل قسم</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {BUDGETABLE_CATEGORIES.map((cat) => {
          const spent = Math.round(monthByCat[cat] || 0);
          const limit = budgets[cat] || 0;
          const pct = limit > 0 ? spent / limit : 0;
          const tone = progressTone(pct);
          const isEditing = editing === cat;
          return (
            <motion.div
              key={cat} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-3.5 shadow-soft ring-1 ring-border/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[13px] font-extrabold">{CATEGORY_LABELS[cat]}</span>
                  {limit > 0 && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${tone.chip}`}>
                      {toLatin(Math.round(Math.min(pct, 9.99) * 100))}٪
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text" inputMode="numeric" dir="ltr" autoFocus
                      value={draft} onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="w-20 rounded-lg bg-foreground/5 px-2 py-1 text-right text-[12px] font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button onClick={() => save(cat)} disabled={busy}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => start(cat)} className="flex items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1 text-[10px] font-extrabold text-foreground">
                    <Pencil className="h-3 w-3" />
                    {limit > 0 ? `${toLatin(limit)} ج` : "حدّد سقف"}
                  </button>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-bold">أنفقت <span className={`tabular-nums ${tone.text}`}>{toLatin(spent)}</span> ج.م هذا الشهر</span>
                {limit > 0 && (
                  <span className="font-bold tabular-nums">المتبقي {toLatin(Math.max(0, limit - spent))} ج</span>
                )}
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${tone.bar}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

/* ================= AFFILIATE HUB ================= */
const AffiliateHub = ({ code, referrals, totalCommission, successfulRefs, onEnsureCode }: {
  code: string | null;
  referrals: ReferralRow[];
  totalCommission: number;
  successfulRefs: number;
  onEnsureCode: () => Promise<string | null>;
}) => {
  const [busy, setBusy] = useState(false);
  const totalRegistered = referrals.length;

  const ensure = async () => {
    if (code) return code;
    setBusy(true);
    const c = await onEnsureCode();
    setBusy(false);
    return c;
  };

  const copyCode = async () => {
    const c = await ensure(); if (!c) return;
    try { await navigator.clipboard.writeText(c); toast.success("تم نسخ الكود"); }
    catch { toast.error("تعذّر النسخ"); }
  };

  const share = async () => {
    const c = await ensure(); if (!c) return;
    const text = `🌿 انضم إلى ريف المدينة عبر كود الدعوة: *${c}* واحصل على خصم خاص على أول طلب! 🎁`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ text }); return; } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      {/* HERO CARD — gold/dark green */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-float"
        style={{ background: "linear-gradient(135deg, hsl(150 50% 10%) 0%, hsl(155 45% 18%) 50%, hsl(45 75% 45%) 100%)" }}
      >
        <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-[hsl(45_85%_60%)]/30 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }} />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">شركاء النجاح</p>
              <p className="text-[12px] font-bold text-white/90">ادعُ — اربح — كرّر</p>
            </div>
          </div>

          <p className="mt-4 text-[10px] font-bold text-white/65">كود الدعوة الخاص بك</p>
          <p className="my-1.5 font-display text-3xl font-extrabold tracking-[0.22em] text-white">
            {code || "·····"}
          </p>

          <div className="mt-3 flex gap-2">
            <button onClick={copyCode} disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/20 py-2.5 text-[11px] font-extrabold text-white ring-1 ring-white/20 transition active:scale-95 disabled:opacity-50">
              <Copy className="h-3.5 w-3.5" /> نسخ الكود
            </button>
            <button onClick={share} disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-[11px] font-extrabold text-foreground transition active:scale-95 disabled:opacity-50">
              <Share2 className="h-3.5 w-3.5" /> مشاركة عبر واتساب
            </button>
          </div>
        </div>
      </motion.div>

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "مسجلين", value: toLatin(totalRegistered), icon: Users, tone: "primary" },
          { label: "أوّل طلب", value: toLatin(successfulRefs), icon: ShoppingBagIcon, tone: "amber" },
          { label: "أرباحك", value: `${toLatin(Math.round(totalCommission))} ج`, icon: Banknote, tone: "green" },
        ].map((m, i) => (
          <motion.div
            key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
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
          احصل على <b>10٪ عمولة نقدية</b> أو <b>50 نقطة</b> عند أول طلب ناجح يقوم به العميل الذي سجّل بكودك. تُضاف العمولة تلقائيًا إلى محفظتك.
        </p>
      </div>

      {/* RECENT REFERRALS */}
      {referrals.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[11px] font-bold text-muted-foreground">آخر الإحالات</p>
          <div className="divide-y divide-border/60 rounded-2xl bg-card shadow-soft ring-1 ring-border/40">
            {referrals.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5 text-[11px]">
                <span className="font-bold">عميل #{r.id.slice(0, 6)}</span>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${r.status === "purchased" ? "bg-primary/15 text-primary" : "bg-foreground/10 text-muted-foreground"}`}>
                  {r.status === "purchased" ? `+${toLatin(Math.round(r.commission))} ج` : "بانتظار الشراء"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// shopping bag icon (lucide doesn't expose ShoppingBagIcon by that name in older imports)
function ShoppingBagIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

/* ================= POS BARCODE DIALOG ================= */
const PosBarcodeDialog = ({ onClose, customerCode, name, balance, points }: {
  onClose: () => void; customerCode: string; name: string; balance: number; points: number;
}) => {
  const payload = JSON.stringify({ t: "reef-pos", c: customerCode, ts: Date.now() });
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-extrabold">الدفع في الفرع</h2>
              <p className="text-[11px] text-muted-foreground">اعرض الكود للكاشير لكسب نقاطك</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border/40">
          <div className="mb-3 flex items-center justify-between text-[11px]">
            <span className="font-bold text-muted-foreground">{name}</span>
            <span className="font-extrabold tabular-nums text-primary">{toLatin(Math.round(balance))} ج · {toLatin(points)} pt</span>
          </div>
          <div className="flex items-center justify-center rounded-xl bg-white p-3">
            <QRCodeSVG value={payload} size={200} bgColor="#ffffff" fgColor="#0f1f17" level="M" includeMargin={false} />
          </div>
          <div className="mt-4 flex flex-col items-center">
            <Barcode value={customerCode} format="CODE128" width={1.6} height={60} fontSize={12} margin={0} background="#ffffff" />
            <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">{customerCode}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="flex-1 text-[10px] font-bold leading-relaxed text-amber-700 dark:text-amber-300">
            هذا الكود ديناميكي ويُستخدم لمرة واحدة عند الكاشير. لا تشاركه مع أي شخص خارج الفرع.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
    if (!finalAmount || finalAmount < 50) { toast.error("الحد الأدنى للشحن 50 ج.م"); return; }
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
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

        <AnimatePresence mode="wait">
          {bonus && (
            <motion.div key={bonus.label} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary/15 to-accent/15 p-3 ring-1 ring-primary/20">
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
              <button key={p} onClick={() => { setAmount(p); setCustom(""); }}
                className={`rounded-xl py-2.5 text-xs font-extrabold transition ${active ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5 text-foreground"}`}>
                {toLatin(p)}
              </button>
            );
          })}
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">مبلغ مخصص</span>
          <div className="flex items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2.5">
            <input type="text" inputMode="numeric" value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
              placeholder="مثال: 750"
              className="flex-1 bg-transparent text-sm font-bold tabular-nums outline-none" dir="ltr" />
            <span className="text-xs font-bold text-muted-foreground">ج.م</span>
          </div>
        </label>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">طريقة الدفع</p>
        <div className="mb-5 space-y-2">
          {paymentMethods.map((m) => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-right transition ${active ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
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

        <button onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill transition active:scale-[0.98]">
          متابعة عبر واتساب · {fmtMoney(finalAmount || 0)}
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">سيتم تحويلك للواتساب لإتمام الدفع وإضافة الرصيد لمحفظتك</p>
      </motion.div>
    </motion.div>
  );
};

/* ================= SAVINGS JAR DIALOG ================= */
const SavingsJarDialog = ({ onClose, userId, jar, txs, onUpdate }: {
  onClose: () => void; userId: string; jar: SavingsJar; txs: SavingsTx[];
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
      auto_save_enabled: autoSave, round_to: roundTo,
      goal: goal ? Number(goal) : null, goal_label: goalLabel || null,
    });
    setBusy(false);
    if (ok) { toast.success("تم حفظ إعدادات الحصّالة"); await refresh(); }
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
      await refresh(); setDepositAmount("");
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
      await refresh(); setDepositAmount("");
    }
    setBusy(false);
  };

  const goalPct = jar.goal && jar.goal > 0 ? Math.min(100, (Number(jar.balance) / Number(jar.goal)) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
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

        <div className="relative mb-4 overflow-hidden rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, hsl(220 25% 12%), hsl(150 35% 18%) 60%, hsl(45 55% 28%))" }}>
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[hsl(45_80%_55%)]/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
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
          <input type="text" inputMode="numeric" dir="ltr" value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="مبلغ مخصص"
            className="flex-1 rounded-xl bg-foreground/5 px-3 py-2.5 text-sm font-bold tabular-nums outline-none" />
          <button onClick={() => deposit(Number(depositAmount), `إيداع يدوي ${depositAmount} ج.م`)} disabled={busy || !depositAmount}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
          <button onClick={withdraw} disabled={busy || !depositAmount}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground/10 text-foreground disabled:opacity-50">
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl bg-foreground/5 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <p className="text-[12px] font-extrabold">الادخار التلقائي</p>
            </div>
            <button onClick={() => setAutoSave((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition ${autoSave ? "bg-primary" : "bg-foreground/20"}`}>
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
            <input type="text" value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)}
              placeholder="اسم الهدف (مثلاً: عمرة)"
              className="rounded-lg bg-background px-3 py-2 text-[12px] font-bold outline-none" />
            <input type="text" inputMode="numeric" dir="ltr" value={goal}
              onChange={(e) => setGoal(e.target.value.replace(/\D/g, ""))}
              placeholder="مبلغ الهدف"
              className="rounded-lg bg-background px-3 py-2 text-[12px] font-bold tabular-nums outline-none" />
          </div>

          <button onClick={saveSettings} disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-extrabold text-primary-foreground disabled:opacity-50">
            حفظ الإعدادات
          </button>
        </div>

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
      _recipient_phone: phone, _amount: amt, _note: note || undefined,
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
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
          <input type="tel" inputMode="tel" dir="ltr" value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder="01xxxxxxxxx"
            className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/40" />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">المبلغ (ج.م) · حد أقصى 5000</span>
          <input type="text" inputMode="numeric" dir="ltr" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="w-full rounded-xl bg-foreground/5 px-3 py-3 text-lg font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-primary/40" />
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
          <input type="text" value={note} onChange={(e) => setNote(e.target.value.slice(0, 40))}
            placeholder="مثال: مصاريف الأسبوع"
            className="w-full rounded-xl bg-foreground/5 px-3 py-2.5 text-sm font-bold outline-none" />
        </label>

        <div className="mb-4 rounded-xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20">
          <p className="text-[10px] font-bold leading-relaxed text-amber-700 dark:text-amber-300">
            ⚠️ التحويل فوري ولا يمكن إلغاؤه. تأكد من رقم المستلم.
          </p>
        </div>

        <button onClick={submit} disabled={!valid || busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill transition active:scale-[0.98] disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          تحويل {amt > 0 ? `${toLatin(amt)} ج.م` : ""}
        </button>
      </motion.div>
    </motion.div>
  );
};
