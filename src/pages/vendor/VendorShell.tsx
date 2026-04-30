import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { Loader2, LayoutDashboard, Package, Wallet, LogOut, Store as StoreIcon } from "lucide-react";

export default function VendorShell() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { roles, loading } = useAdminRoles();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => { if (!loading) setChecked(true); }, [loading]);

  if (authLoading || !checked) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" search={{ redirect: location.pathname }} replace />;
  if (!roles.includes("vendor") && !roles.includes("admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-border/40">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <StoreIcon className="h-8 w-8" />
          </div>
          <h1 className="font-display text-[22px] mb-2">بوابة التجار</h1>
          <p className="text-[13px] text-foreground-secondary mb-5">حسابك ليس مفعّلاً كتاجر. تواصل مع الإدارة.</p>
          <button onClick={signOut} className="rounded-xl h-11 px-6 bg-surface-muted">تسجيل الخروج</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { to: "/vendor", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
    { to: "/vendor/products", label: "منتجاتي", icon: Package },
    { to: "/vendor/wallet", label: "محفظتي", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center">
              <StoreIcon className="h-4 w-4" />
            </div>
            <p className="font-display text-[16px]">بوابة التاجر</p>
          </div>
          <button onClick={signOut} className="text-foreground-tertiary press">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto"><Outlet /></main>
      <nav className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-border/40 z-30">
        <div className="max-w-3xl mx-auto grid grid-cols-3 h-16">
          {tabs.map(t => {
            const active = t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={`flex flex-col items-center justify-center gap-0.5 ${active ? "text-primary" : "text-foreground-tertiary"}`}>
                <t.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
