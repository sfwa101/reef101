import { useEffect, useMemo, useState } from "react";
import {
  User, MapPin, CreditCard, Bell, Heart, ShoppingBag, Settings, HelpCircle,
  LogOut, ChevronLeft, Phone, Wrench, ShieldCheck, BadgeCheck, TrendingUp,
  Sparkles, Wallet as WalletIcon, Gift, Crown, Lock,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { toLatin } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { tierProgress } from "@/lib/tiers";

const formatPhone = (raw: string): string => {
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("20") && d.length >= 11) {
    return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
  }
  return `+${d}`;
};

/* ─────────────────  Tier visual palettes — metallic shimmer  ───────────────── */
const TIER_VISUALS: Record<string, { mesh: string; ink: string; shine: string; glow: string }> = {
  bronze: {
    mesh:
      "radial-gradient(at 18% 22%, hsl(28 75% 70%) 0px, transparent 55%)," +
      "radial-gradient(at 80% 16%, hsl(36 85% 75%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(20 60% 38%) 0px, transparent 65%)," +
      "linear-gradient(135deg, hsl(28 60% 60%), hsl(20 55% 36%))",
    ink: "0 0% 100%",
    shine: "linear-gradient(115deg, transparent 30%, hsl(40 85% 90% / 0.45) 45%, transparent 60%)",
    glow: "hsl(28 80% 55% / 0.45)",
  },
  silver: {
    mesh:
      "radial-gradient(at 20% 18%, hsl(220 15% 92%) 0px, transparent 55%)," +
      "radial-gradient(at 80% 20%, hsl(210 12% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(220 10% 50%) 0px, transparent 65%)," +
      "linear-gradient(135deg, hsl(220 10% 80%), hsl(220 10% 48%))",
    ink: "220 30% 18%",
    shine: "linear-gradient(115deg, transparent 30%, hsl(0 0% 100% / 0.55) 45%, transparent 60%)",
    glow: "hsl(220 10% 70% / 0.4)",
  },
  gold: {
    mesh:
      "radial-gradient(at 18% 18%, hsl(48 95% 78%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 22%, hsl(38 90% 70%) 0px, transparent 55%)," +
      "radial-gradient(at 55% 92%, hsl(28 80% 45%) 0px, transparent 65%)," +
      "linear-gradient(135deg, hsl(45 95% 65%), hsl(32 85% 48%))",
    ink: "30 60% 18%",
    shine: "linear-gradient(115deg, transparent 30%, hsl(50 100% 95% / 0.6) 45%, transparent 60%)",
    glow: "hsl(45 95% 60% / 0.55)",
  },
  platinum: {
    mesh:
      "radial-gradient(at 20% 20%, hsl(195 80% 88%) 0px, transparent 55%)," +
      "radial-gradient(at 80% 22%, hsl(220 65% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 55% 92%, hsl(220 35% 35%) 0px, transparent 65%)," +
      "linear-gradient(135deg, hsl(200 60% 78%), hsl(220 40% 45%))",
    ink: "220 50% 16%",
    shine: "linear-gradient(115deg, transparent 30%, hsl(200 100% 96% / 0.6) 45%, transparent 60%)",
    glow: "hsl(200 70% 60% / 0.5)",
  },
  vip: {
    mesh:
      "radial-gradient(at 18% 20%, hsl(285 80% 70%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 18%, hsl(330 85% 65%) 0px, transparent 55%)," +
      "radial-gradient(at 50% 92%, hsl(45 90% 55%) 0px, transparent 65%)," +
      "linear-gradient(135deg, hsl(290 65% 50%), hsl(330 70% 50%) 60%, hsl(38 90% 55%))",
    ink: "0 0% 100%",
    shine: "linear-gradient(115deg, transparent 30%, hsl(45 100% 90% / 0.55) 45%, transparent 60%)",
    glow: "hsl(310 80% 60% / 0.55)",
  },
};

/* ─────────────────  Smart store routing (changes by tier)  ───────────────── */
const SMART_PICKS_BY_TIER: Record<string, { title: string; sub: string; to: string; tone: string }[]> = {
  bronze: [
    { title: "السوبرماركت", sub: "وفّر على احتياجاتك اليومية", to: "/store/supermarket", tone: "150 55% 90%" },
    { title: "خصومات حارة", sub: "حتى ٤٠٪ على المختار", to: "/offers", tone: "20 85% 88%" },
    { title: "ابني سلتك", sub: "خطط الأسبوع بنفسك", to: "/store/baskets", tone: "45 90% 88%" },
  ],
  silver: [
    { title: "اشتراكات أسبوعية", sub: "وفّر مع التوصيل المنتظم", to: "/store/baskets-subs", tone: "200 70% 90%" },
    { title: "وصفات الشيف", sub: "تجارب طهي ممتعة", to: "/store/recipes", tone: "265 70% 90%" },
    { title: "خضار وفاكهة فاخرة", sub: "طازج بانتقاء يدوي", to: "/store/produce", tone: "100 55% 88%" },
  ],
  gold: [
    { title: "مطبخ ريف الذهبي", sub: "تجربة تذوّق مختارة", to: "/store/kitchen", tone: "45 90% 86%" },
    { title: "اللحوم على الطلب", sub: "الجزار الشخصي يصلك اليوم", to: "/store/meat", tone: "0 70% 88%" },
    { title: "محفظتك الذكية", sub: "كاش باك ١.٥x على كل طلب", to: "/wallet", tone: "150 55% 88%" },
  ],
  platinum: [
    { title: "مفهوم البلاتيني", sub: "خصومات مضاعفة على المنتقى", to: "/sections", tone: "200 65% 88%" },
    { title: "خدمة استلام مميزة", sub: "أولوية في التوصيل والتجهيز", to: "/account/orders", tone: "220 55% 90%" },
    { title: "كاش باك ٢x", sub: "احصل على ضعف النقاط", to: "/wallet", tone: "265 60% 90%" },
  ],
  vip: [
    { title: "مدير حساب شخصي", sub: "تواصل مباشر VIP", to: "/account/help", tone: "330 75% 90%" },
    { title: "حصري للـ VIP", sub: "منتجات وعروض لا تظهر إلا لك", to: "/sections", tone: "285 65% 90%" },
    { title: "الشراء بالآجل", sub: "مرن وبدون رسوم", to: "/wallet", tone: "45 90% 88%" },
  ],
};

const groups = [
  { title: "حسابي", items: [
    { icon: User, label: "البيانات الشخصية", sub: "الاسم، النوع، تاريخ الميلاد", to: "/account/profile" as const, tint: "200 60% 90%" },
    { icon: ShieldCheck, label: "توثيق الحساب", sub: "الرقم القومي وصورة الهوية", to: "/account/verification" as const, tint: "150 55% 90%" },
    { icon: MapPin, label: "العناوين", sub: "إدارة عناوين التوصيل", to: "/account/addresses" as const, tint: "265 70% 92%" },
    { icon: CreditCard, label: "وسائل الدفع", sub: "بطاقات والمحفظة", to: "/account/payments" as const, tint: "45 90% 90%" },
  ]},
  { title: "الطلبات والمفضلة", items: [
    { icon: ShoppingBag, label: "طلباتي", sub: "تتبع وإعادة طلب", to: "/account/orders" as const, tint: "20 85% 90%" },
    { icon: Heart, label: "المفضلة", sub: "منتجاتك المحفوظة", to: "/account/favorites" as const, tint: "340 75% 92%" },
    { icon: Bell, label: "التنبيهات", sub: "العروض والوصول", to: "/account/notifications" as const, tint: "38 90% 90%" },
  ]},
  { title: "أخرى", items: [
    { icon: Settings, label: "الإعدادات", sub: "اللغة، الوضع، الألوان", to: "/account/settings" as const, tint: "220 30% 90%" },
    { icon: HelpCircle, label: "المساعدة والدعم", sub: "تواصل معنا", to: "/account/help" as const, tint: "175 55% 90%" },
  ]},
];

const Account = () => {
  const { resolvedMode } = useTheme();
  const { user, profile, signOut, isInitializing } = useAuth();
  const nav = useNavigate();
  const [points, setPoints] = useState(0);
  const [balance, setBalance] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [kycStatus, setKycStatus] = useState<"pending" | "verified" | "rejected" | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const [{ data: w }, { count }, { data: spent }, { data: kyc }] = await Promise.all([
        supabase.from("wallet_balances").select("balance, points").eq("user_id", user.id).maybeSingle(),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.rpc("user_total_spent", { _user_id: user.id }),
        supabase.from("kyc_verifications").select("status").eq("user_id", user.id).maybeSingle<{ status: "pending" | "verified" | "rejected" }>(),
      ]);
      if (!alive) return;
      setPoints(Number(w?.points ?? 0));
      setBalance(Number(w?.balance ?? 0));
      setOrdersCount(count ?? 0);
      setTotalSpent(Number(spent ?? 0));
      setKycStatus(kyc?.status ?? null);
    })().catch(() => {});
    return () => { alive = false; };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
    nav({ to: "/auth", replace: true });
  };

  const displayName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as { full_name?: string };
    return profile?.full_name || meta.full_name || "عضو ريف";
  }, [profile, user]);
  const displayPhone = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as { phone?: string };
    const raw = profile?.phone || meta.phone || "";
    return formatPhone(raw);
  }, [profile, user]);

  if (isInitializing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">جاري تحميل بيانات الحساب...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-extrabold">حسابي</h1>
        <div className="glass-strong rounded-3xl p-8 text-center shadow-soft">
          <p className="text-sm text-muted-foreground mb-4">سجّل الدخول لتتابع طلباتك ومحفظتك</p>
          <Link to="/auth" className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pill">تسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("") || "ر م";
  const progress = tierProgress(totalSpent);
  const TierIcon = progress.tier.icon;
  const isVerified = kycStatus === "verified";
  const visuals = TIER_VISUALS[progress.tier.key] ?? TIER_VISUALS.bronze;
  const smartPicks = SMART_PICKS_BY_TIER[progress.tier.key] ?? SMART_PICKS_BY_TIER.bronze;

  return (
    <div className="space-y-6 pb-2">
      <section>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">حسابي</h1>
            <p className="mt-1 text-xs text-muted-foreground">لوحة قيادة فاخرة لإدارة بياناتك ومكافآتك.</p>
          </div>
        </div>
      </section>

      {/* ───────────  VIP CARD — metallic mesh, shimmer, glow  ─────────── */}
      <Link
        to="/account/profile"
        className="group relative block overflow-hidden rounded-[2rem] shadow-tile ring-1 ring-white/15"
        style={{
          background: visuals.mesh,
          color: `hsl(${visuals.ink})`,
          contain: "layout paint",
        }}
        aria-label="بطاقة العميل وملف الولاء"
      >
        {/* Subtle metallic shimmer (very cheap CSS) */}
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-70" style={{ background: visuals.shine, mixBlendMode: "overlay" }} />
        <span aria-hidden className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full blur-3xl" style={{ background: visuals.glow }} />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full blur-3xl" style={{ background: visuals.glow }} />

        <div className="relative p-5">
          {/* Top row: brand + tier chip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/25 ring-1 ring-white/30">
                <Sparkles className="h-3 w-3" strokeWidth={2.6} />
              </span>
              <span className="text-[10px] font-extrabold tracking-[0.2em] opacity-90">REEF · MEMBER</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/22 px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-white/35 backdrop-blur-md">
              <TierIcon className="h-3.5 w-3.5" /> {progress.tier.label}
            </span>
          </div>

          {/* Identity */}
          <div className="mt-5 flex items-end gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/22 ring-1 ring-white/35 backdrop-blur-md font-display text-xl font-extrabold">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-extrabold leading-tight truncate">{displayName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold opacity-95">
                {displayPhone && (
                  <span dir="ltr" className="inline-flex items-center gap-1 tabular-nums">
                    <Phone className="h-3 w-3" /> {toLatin(displayPhone)}
                  </span>
                )}
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[9.5px] ring-1 ring-white/35">
                    <BadgeCheck className="h-3 w-3" /> موثّق
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tier progress */}
          <div className="mt-5 rounded-2xl bg-white/15 p-3 ring-1 ring-white/25 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-extrabold">
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                مضاعف المكافآت {toLatin(progress.tier.multiplier)}x
              </span>
              {progress.next ? (
                <span className="opacity-90">{toLatin(progress.pct)}%</span>
              ) : (
                <span>أعلى مستوى ✨</span>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/15">
              <div
                className="h-full rounded-full bg-white/85 transition-all duration-700 ease-apple"
                style={{ width: `${progress.pct}%`, boxShadow: "0 0 12px hsl(0 0% 100% / 0.55)" }}
              />
            </div>
            {progress.next ? (
              <p className="mt-2 text-[10.5px] font-bold opacity-95 tabular-nums">
                تبقى <strong>{toLatin(Math.round(progress.remaining))} ج.م</strong> للترقية إلى{" "}
                <strong>{progress.next.label}</strong>
              </p>
            ) : (
              <p className="mt-2 text-[10.5px] font-bold opacity-95">
                استمتع بأقصى مزايا الكاش باك ونقاط الولاء.
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/12 p-3 ring-1 ring-white/15 backdrop-blur-md">
            <Stat value={toLatin(points)} label="نقطة" />
            <Stat value={toLatin(Math.round(balance))} label="ج.م رصيد" divider />
            <Stat value={toLatin(ordersCount)} label="طلب" />
          </div>
        </div>
      </Link>

      {/* ───────────  Smart wallet rail — clear, transparent  ─────────── */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/wallet"
          className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border/60 transition active:scale-[0.99]"
        >
          <div
            className="absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl"
            style={{ background: "hsl(var(--primary) / 0.22)" }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-pill">
              <WalletIcon className="h-4 w-4" strokeWidth={2.4} />
            </div>
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="relative mt-3 font-display text-2xl font-extrabold tabular-nums leading-none">
            {toLatin(Math.round(balance))}
            <span className="ms-1 text-[10px] font-bold text-muted-foreground">ج.م</span>
          </p>
          <p className="relative mt-1 text-[10.5px] text-muted-foreground">رصيد المحفظة الذكية</p>
        </Link>

        <Link
          to="/wallet"
          className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border/60 transition active:scale-[0.99]"
        >
          <div
            className="absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl"
            style={{ background: "hsl(var(--accent) / 0.28)" }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-pill">
              <Gift className="h-4 w-4" strokeWidth={2.4} />
            </div>
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="relative mt-3 font-display text-2xl font-extrabold tabular-nums leading-none">
            {toLatin(points)}
          </p>
          <p className="relative mt-1 text-[10.5px] text-muted-foreground">نقطة ولاء قابلة للاستبدال</p>
        </Link>
      </section>

      {/* ───────────  Smart Routing — store recommendations by tier  ─────────── */}
      <section>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-primary" strokeWidth={2.4} />
            <h2 className="font-display text-base font-extrabold">المتجر الذكي لك</h2>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">مخصص حسب مستواك</span>
        </div>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar snap-x snap-mandatory">
          {smartPicks.map((p, i) => (
            <Link
              key={i}
              to={p.to}
              className="snap-start min-w-[180px] rounded-2xl p-3.5 ring-1 ring-border/40 shadow-soft transition active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, hsl(${p.tone}), hsl(${p.tone.split(" ").map((v, idx) => idx === 2 ? `${Math.max(parseInt(v), 78)}%` : v).join(" ")}))`,
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card/80 ring-1 ring-white/40 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.6} />
              </div>
              <p className="mt-3 font-display text-sm font-extrabold text-foreground leading-snug">{p.title}</p>
              <p className="mt-0.5 text-[10.5px] font-medium text-muted-foreground leading-relaxed">{p.sub}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold text-primary">
                ادخل الآن <ChevronLeft className="h-3 w-3" strokeWidth={3} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────  Secure Vault — KYC promotion when needed  ─────────── */}
      {!isVerified && (
        <Link
          to="/account/verification"
          className="relative block overflow-hidden rounded-2xl p-4 ring-1 ring-primary/30 shadow-soft"
          style={{
            background:
              "radial-gradient(at 90% 0%, hsl(var(--primary) / 0.15), transparent 60%)," +
              "linear-gradient(135deg, hsl(var(--card)), hsl(var(--primary-soft)))",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-pill">
              <Lock className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-extrabold text-foreground">
                خزنتك الآمنة — افتح المزايا الحصرية
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                وثّق حسابك لتفعيل استعارة كتب المكتبة، الشراء بالآجل، ورفع حدود الدفع.
              </p>
            </div>
            <ChevronLeft className="h-4 w-4 text-primary" strokeWidth={2.4} />
          </div>
        </Link>
      )}

      {/* ───────────  Settings groups — 3D-style icons  ─────────── */}
      {groups.map((g) => (
        <section key={g.title} className="space-y-2">
          <h3 className="px-2 text-[11px] font-extrabold text-muted-foreground tracking-wider">{g.title}</h3>
          <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border/60 divide-y divide-border/60">
            {g.items.map((item) => {
              const Icon = item.icon;
              const isVerifyRow = item.to === "/account/verification";
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex w-full items-center gap-3 px-4 py-3 text-right transition active:bg-foreground/5"
                >
                  <div
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/40"
                    style={{
                      background: `radial-gradient(at 30% 25%, hsl(${item.tint}), transparent 70%), linear-gradient(135deg, hsl(${item.tint}), hsl(${item.tint.split(" ").map((v,i)=>i===2?`${Math.max(parseInt(v)-10,75)}%`:v).join(" ")}))`,
                      boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.55), 0 4px 10px -4px hsl(var(--foreground) / 0.15)",
                    }}
                  >
                    <Icon className="h-4 w-4 text-foreground/80" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold">{item.label}</p>
                      {isVerifyRow && isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                      {isVerifyRow && kycStatus === "pending" && (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-300">
                          قيد المراجعة
                        </span>
                      )}
                      {isVerifyRow && !kycStatus && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">
                          جديد
                        </span>
                      )}
                    </div>
                    {item.sub && <p className="text-[10.5px] text-muted-foreground">{item.sub}</p>}
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-right shadow-soft ring-1 ring-border/60"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
          <LogOut className="h-4 w-4 text-destructive" strokeWidth={2.4} />
        </div>
        <span className="flex-1 text-sm font-bold text-destructive">تسجيل الخروج</span>
      </button>
      <p className="pt-4 text-center text-[10px] text-muted-foreground tabular-nums">
        ريف المدينة · الإصدار 1.0.0 · الوضع: {resolvedMode === "dark" ? "داكن" : "فاتح"}
      </p>
    </div>
  );
};

const Stat = ({ value, label, divider }: { value: string; label: string; divider?: boolean }) => (
  <div className={`text-center ${divider ? "border-x border-white/20" : ""}`}>
    <p className="font-display text-lg font-extrabold tabular-nums leading-none">{value}</p>
    <p className="mt-1 text-[10px] font-bold opacity-90">{label}</p>
  </div>
);

export default Account;
