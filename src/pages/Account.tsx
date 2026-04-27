import { User, MapPin, CreditCard, Bell, Heart, ShoppingBag, Settings, HelpCircle, LogOut, ChevronLeft, Crown, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toLatin } from "@/lib/format";

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
  const { isStaff, isAdmin, loading: roleLoading, error: roleError } = useAdminRole();
  const nav = useNavigate();

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
          <div className="flex-1">
            <h2 className="font-display text-lg font-extrabold">{profile?.full_name || "مرحباً بك"}</h2>
            <p dir="ltr" className="text-xs text-muted-foreground tabular-nums">+{toLatin(profile?.phone ?? "")}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
              <Crown className="h-3 w-3" /> عضو ريف +
            </span>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
      {roleLoading && (
        <div className="glass-strong rounded-2xl px-4 py-3 text-sm text-muted-foreground shadow-tile">
          جارٍ التحقق من صلاحيات الحساب…
        </div>
      )}
      {!roleLoading && isStaff && (
        <Link
          to="/admin"
          className="glass-strong flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right shadow-tile ring-1 ring-primary/30"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">لوحة الإدارة</p>
            <p className="text-[10px] text-muted-foreground">
              {isAdmin ? "إدارة كاملة للمتجر والطلبات والمنتجات" : "لوحة الموظفين"}
            </p>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}
      {!roleLoading && roleError && (
        <div className="glass-strong rounded-2xl px-4 py-3 text-xs text-muted-foreground shadow-tile">
          تعذّر جلب الصلاحيات الآن، أعد فتح الصفحة بعد ثوانٍ قليلة.
        </div>
      )}
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
