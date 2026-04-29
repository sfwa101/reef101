import { useEffect, useMemo, useState } from "react";
import { User, MapPin, CreditCard, Bell, Heart, ShoppingBag, Settings, HelpCircle, LogOut, ChevronLeft, Phone, Wrench, Database, ShieldCheck, BadgeCheck, TrendingUp } from "lucide-react";
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

const groups = [
  { title: "حسابي", items: [
    { icon: User, label: "البيانات الشخصية", sub: "الاسم، النوع، تاريخ الميلاد", to: "/account/profile" as const },
    { icon: ShieldCheck, label: "توثيق الحساب", sub: "الرقم القومي وصورة الهوية", to: "/account/verification" as const },
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

const BACKEND_CONSOLE_URL = "https://supabase.com/dashboard/project/aqqxravppmtdbalsjyam";

const Account = () => {
  const { resolvedMode } = useTheme();
  const { user, profile, signOut } = useAuth();
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

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="font-display text-3xl font-extrabold">حسابي</h1>
            <p className="mt-1 text-xs text-muted-foreground">أدر بياناتك، طلباتك، ومحفظتك في مكان واحد.</p>
          </div>
          <a
            href={BACKEND_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="أدوات المطوّر"
            title="أدوات المطوّر · Backend"
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground ring-1 ring-border/60 transition hover:bg-foreground/10 hover:text-foreground active:scale-95"
          >
            <Wrench className="h-4 w-4" strokeWidth={2.4} />
          </a>
        </div>
      </section>

      {/* VIP Card with Tier Progress */}
      <Link
        to="/account/profile"
        className="relative block rounded-[2rem] bg-card shadow-tile ring-1 ring-border/60"
      >
        <div className={`relative h-28 overflow-hidden rounded-t-[2rem] bg-gradient-to-tr ${progress.tier.gradient}`}>
          <div className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:radial-gradient(circle_at_20%_30%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
          <ChevronLeft className="absolute top-4 right-4 h-5 w-5 text-white/90" />
        </div>

        <div className="relative z-10 -mt-12 px-5 pb-5">
          <div className="flex items-end justify-between gap-3">
            <div className="relative z-20 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground ring-4 ring-card shadow-lg">
              <span className="font-display text-2xl font-extrabold">{initials}</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-extrabold leading-tight">{displayName}</h2>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${progress.tier.chip}`}>
                <TierIcon className="h-3.5 w-3.5" />
                {progress.tier.label}
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-extrabold text-primary ring-1 ring-primary/30">
                  <BadgeCheck className="h-3 w-3" /> موثّق
                </span>
              )}
            </div>
            {displayPhone ? (
              <p dir="ltr" className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                <Phone className="h-3.5 w-3.5" />
                {toLatin(displayPhone)}
              </p>
            ) : null}
          </div>

          {/* Tier progress bar */}
          <div className="mt-4 rounded-2xl bg-foreground/5 p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold">
              <span className="inline-flex items-center gap-1 text-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                مستواك: {progress.tier.label} · مضاعف {toLatin(progress.tier.multiplier)}x
              </span>
              {progress.next ? (
                <span className="text-muted-foreground">{toLatin(progress.pct)}%</span>
              ) : (
                <span className="text-primary">أعلى مستوى ✨</span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${progress.tier.gradient} transition-all`}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            {progress.next ? (
              <p className="mt-2 text-[10px] text-muted-foreground tabular-nums">
                تبقى {toLatin(Math.round(progress.remaining))} ج.م لترقية مستوى <strong className="text-foreground">{progress.next.label}</strong>
              </p>
            ) : (
              <p className="mt-2 text-[10px] text-muted-foreground">استمتع بأقصى مزايا الكاش باك ونقاط الولاء.</p>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-primary-soft/40 p-3">
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
              const isVerifyRow = item.to === "/account/verification";
              return (
                <Link key={item.label} to={item.to} className="flex w-full items-center gap-3 px-4 py-3 text-right transition active:bg-foreground/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft"><Icon className="h-4 w-4 text-primary" strokeWidth={2.4} /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold">{item.label}</p>
                      {isVerifyRow && isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                      {isVerifyRow && kycStatus === "pending" && <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-300">قيد المراجعة</span>}
                      {isVerifyRow && !kycStatus && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">جديد</span>}
                    </div>
                    {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
                  </div>
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
