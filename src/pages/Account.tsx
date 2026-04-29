import { useEffect, useState } from "react";
import { User, MapPin, CreditCard, Bell, Heart, ShoppingBag, Settings, HelpCircle, LogOut, ChevronLeft, Award, Medal, Crown, Gem, Sparkles } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { toLatin } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

type TierKey = "bronze" | "silver" | "gold" | "platinum" | "vip";
const TIERS: Record<TierKey, { label: string; min: number; icon: typeof Award; cls: string }> = {
  bronze:   { label: "برونزي",  min: 0,    icon: Award,    cls: "bg-amber-700/15 text-amber-700 dark:text-amber-400 ring-amber-700/30" },
  silver:   { label: "فضي",    min: 200,  icon: Medal,    cls: "bg-slate-400/15 text-slate-600 dark:text-slate-300 ring-slate-400/30" },
  gold:     { label: "ذهبي",   min: 500,  icon: Crown,    cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-yellow-500/30" },
  platinum: { label: "بلاتيني", min: 1000, icon: Gem,      cls: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 ring-cyan-500/30" },
  vip:      { label: "VIP",    min: 2500, icon: Sparkles, cls: "bg-gradient-to-r from-fuchsia-500/20 to-amber-400/20 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-500/30" },
};
const tierFor = (points: number): TierKey => {
  if (points >= TIERS.vip.min) return "vip";
  if (points >= TIERS.platinum.min) return "platinum";
  if (points >= TIERS.gold.min) return "gold";
  if (points >= TIERS.silver.min) return "silver";
  return "bronze";
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

  const initials = (profile?.full_name || "ر م").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("");
  const tierKey = tierFor(points);
  const tier = TIERS[tierKey];
  const TierIcon = tier.icon;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-extrabold">حسابي</h1>
        <p className="mt-1 text-xs text-muted-foreground">أدر بياناتك، طلباتك، ومحفظتك في مكان واحد.</p>
      </section>
      <Link to="/account/profile" className="glass-strong block overflow-hidden rounded-[1.75rem] p-5 shadow-tile">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
            <span className="font-display text-xl font-extrabold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-extrabold truncate">{profile?.full_name || "مرحباً بك"}</h2>
            <p dir="ltr" className="text-xs text-muted-foreground tabular-nums">+{toLatin(profile?.phone ?? "")}</p>
            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${tier.cls}`}>
              <TierIcon className="h-3 w-3" /> {tier.label}
            </span>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-x-reverse divide-border border-t border-border pt-4">
          <div className="text-center">
            <p className="font-display text-xl font-extrabold text-primary tabular-nums">{toLatin(points)}</p>
            <p className="text-[10px] text-muted-foreground">نقطة</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-extrabold text-primary tabular-nums">{toLatin(balance.toFixed(0))}</p>
            <p className="text-[10px] text-muted-foreground">ج.م في المحفظة</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-extrabold text-primary tabular-nums">{toLatin(ordersCount)}</p>
            <p className="text-[10px] text-muted-foreground">طلب</p>
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
