import { useEffect, useMemo, useState } from "react";
import { User, MapPin, CreditCard, Bell, Heart, ShoppingBag, Settings, HelpCircle, LogOut, ChevronLeft, Award, Medal, Crown, Gem, Sparkles, Phone, Wrench, Database } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { toLatin } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

type TierKey = "bronze" | "silver" | "gold" | "platinum" | "vip";
const TIERS: Record<TierKey, { label: string; min: number; icon: typeof Award; chip: string; gradient: string }> = {
  bronze:   { label: "برونزي",  min: 0,    icon: Award,
    chip: "bg-[#b87333]/15 text-[#a66425] ring-[#b87333]/40 dark:text-[#e3a06c]",
    gradient: "from-[#a86a3d] via-[#c98a52] to-[#7a4a28]" },
  silver:   { label: "فضي",    min: 200,  icon: Medal,
    chip: "bg-slate-400/15 text-slate-600 ring-slate-400/40 dark:text-slate-200",
    gradient: "from-slate-400 via-slate-300 to-slate-500" },
  gold:     { label: "ذهبي",   min: 500,  icon: Crown,
    chip: "bg-yellow-500/15 text-yellow-700 ring-yellow-500/40 dark:text-yellow-300",
    gradient: "from-amber-400 via-yellow-300 to-amber-600" },
  platinum: { label: "بلاتيني", min: 1000, icon: Gem,
    chip: "bg-cyan-500/15 text-cyan-700 ring-cyan-500/40 dark:text-cyan-200",
    gradient: "from-cyan-300 via-sky-200 to-indigo-400" },
  vip:      { label: "VIP",    min: 2500, icon: Sparkles,
    chip: "bg-fuchsia-500/15 text-fuchsia-700 ring-fuchsia-500/40 dark:text-fuchsia-200",
    gradient: "from-fuchsia-500 via-purple-400 to-amber-400" },
};
const tierFor = (points: number): TierKey => {
  if (points >= TIERS.vip.min) return "vip";
  if (points >= TIERS.platinum.min) return "platinum";
  if (points >= TIERS.gold.min) return "gold";
  if (points >= TIERS.silver.min) return "silver";
  return "bronze";
};

const formatPhone = (raw: string): string => {
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  // Egypt: 20 1X XXXX XXXX
  if (d.startsWith("20") && d.length >= 11) {
    return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
  }
  return `+${d}`;
};

const groups = [
  { title: "حسابي", items: [
    { icon: User, label: "البيانات الشخصية", sub: "الاسم، النوع، تاريخ الميلاد", to: "/account/profile" as const },
    { icon: MapPin, label: "العناوين", sub: "إدارة عناوين التوصيل", to: "/account/addresses" as const },
    { icon: CreditCard, label: "وسائل الدفع", sub: "بطاقات والمحفظة", to: "/account/payments" as const },
  ]},
  { title: "الطلبات والمفضلة", items: [
    { icon: ShoppingBag, label: "طلباتي", sub: "تتبع وإعادة طلب", to: "/account/orders" as const },
    { icon: Heart, label: "المفضلة", sub: "منتجاتك المحفوظة", to: "/account/favorites" as const },
    { icon: Bell, label: "التنبيهات", sub: "العروض والوصول", to: "/account/notifications" as const },
  ]},
  { title: "أخرى", items: [
    { icon: Settings, label: "الإعدادات", sub: "اللغة، الوضع، الألوان", to: "/account/settings" as const },
    { icon: HelpCircle, label: "المساعدة والدعم", sub: "تواصل معنا", to: "/account/help" as const },
  ]},
];

// Direct link to the project's backend (Lovable Cloud) console.
const BACKEND_CONSOLE_URL = "https://supabase.com/dashboard/project/omdyopbpwhzduuqfnxbk";

const Account = () => {
  const { resolvedMode } = useTheme();
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const [points, setPoints] = useState(0);
  const [balance, setBalance] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const [{ data: w }, { count }] = await Promise.all([
        supabase.from("wallet_balances").select("balance, points").eq("user_id", user.id).maybeSingle(),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (!alive) return;
      setPoints(Number(w?.points ?? 0));
      setBalance(Number(w?.balance ?? 0));
      setOrdersCount(count ?? 0);
    })().catch(() => {});
    return () => { alive = false; };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
    nav({ to: "/auth", replace: true });
  };

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

  // Resolve display data with safe fallbacks (DB → auth metadata)
  const displayName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as { full_name?: string };
    return profile?.full_name || meta.full_name || "عضو ريف";
  }, [profile, user]);
  const displayPhone = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as { phone?: string };
    const raw = profile?.phone || meta.phone || "";
    return formatPhone(raw);
  }, [profile, user]);
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("") || "ر م";
  const tierKey = tierFor(points);
  const tier = TIERS[tierKey];
  const TierIcon = tier.icon;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-extrabold">حسابي</h1>
        <p className="mt-1 text-xs text-muted-foreground">أدر بياناتك، طلباتك، ومحفظتك في مكان واحد.</p>
      </section>
      <Link
        to="/account/profile"
        className="relative block overflow-hidden rounded-[2rem] bg-card shadow-tile ring-1 ring-border/60"
      >
        {/* Gradient header band */}
        <div className={`relative h-28 bg-gradient-to-tr ${tier.gradient}`}>
          <div className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:radial-gradient(circle_at_20%_30%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-extrabold ring-1 backdrop-blur ${tier.chip}`}>
              <TierIcon className="h-3.5 w-3.5" />
              {tier.label}
            </span>
          </div>
          <ChevronLeft className="absolute top-4 right-4 h-5 w-5 text-white/90" />
        </div>

        {/* Avatar floating over the band */}
        <div className="-mt-12 px-5 pb-5">
          <div className="flex items-end justify-between gap-3">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground ring-4 ring-card shadow-lg">
              <span className="font-display text-2xl font-extrabold">{initials}</span>
            </div>
          </div>

          <div className="mt-3">
            <h2 className="font-display text-2xl font-extrabold leading-tight">{displayName}</h2>
            {displayPhone ? (
              <p dir="ltr" className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                <Phone className="h-3.5 w-3.5" />
                {toLatin(displayPhone)}
              </p>
            ) : null}
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-primary-soft/40 p-3">
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-primary tabular-nums leading-none">{toLatin(points)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">نقطة</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="font-display text-2xl font-extrabold text-primary tabular-nums leading-none">{toLatin(balance.toFixed(0))}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">ج.م في المحفظة</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-primary tabular-nums leading-none">{toLatin(ordersCount)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">طلب</p>
            </div>
          </div>
        </div>
      </Link>
      {groups.map((g) => (
        <section key={g.title} className="space-y-2">
          <h3 className="px-2 text-xs font-bold text-muted-foreground">{g.title}</h3>
          <div className="glass-strong divide-y divide-border rounded-2xl shadow-soft">
            {g.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} to={item.to} className="flex w-full items-center gap-3 px-4 py-3 text-right transition active:bg-foreground/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft"><Icon className="h-4 w-4 text-primary" strokeWidth={2.4} /></div>
                  <div className="flex-1"><p className="text-sm font-bold">{item.label}</p>{item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}</div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
            {g.title === "أخرى" && (
              <a
                href={BACKEND_CONSOLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 px-4 py-3 text-right transition active:bg-foreground/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
                  <Database className="h-4 w-4 text-primary" strokeWidth={2.4} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">أدوات المطوّر</p>
                  <p className="text-[10px] text-muted-foreground">لوحة الـ Backend والتكاملات</p>
                </div>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
          </div>
        </section>
      ))}
      <button onClick={handleSignOut} className="glass-strong flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right shadow-soft">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10"><LogOut className="h-4 w-4 text-destructive" strokeWidth={2.4} /></div>
        <span className="flex-1 text-sm font-bold text-destructive">تسجيل الخروج</span>
      </button>
      <p className="pt-4 text-center text-[10px] text-muted-foreground tabular-nums">ريف المدينة · الإصدار 1.0.0 · الوضع: {resolvedMode === "dark" ? "داكن" : "فاتح"}</p>
    </div>
  );
};
export default Account;
