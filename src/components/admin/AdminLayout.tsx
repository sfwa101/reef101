import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  LogOut,
  Menu,
  Wallet,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/customers", label: "العملاء", icon: Users },
  { to: "/admin/wallets", label: "المحافظ", icon: Wallet },
  { to: "/admin/notifications", label: "الإشعارات", icon: Bell },
  { to: "/admin/reports", label: "التقارير", icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isStaff, isAdmin, loading: roleLoading, error: roleError } = useAdminRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: location.pathname } as never });
    }
  }, [authLoading, user, navigate, location.pathname]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">جارٍ التحميل…</div>
      </div>
    );
  }

  if (!user) return null;

  if (roleError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-tile">
          <h1 className="text-xl font-bold">جارٍ التحقق من الصلاحيات</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            الخلفية تأخرت للحظات بعد تسجيل الدخول. افتح الصفحة مرة أخرى خلال ثوانٍ قليلة.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-tile">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <LogOut className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">لا تملك صلاحية الوصول</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            لوحة الإدارة متاحة فقط للموظفين المصرح لهم. تواصل مع المسؤول لإضافة دورك.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            العودة للمتجر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 border-l border-border bg-card lg:flex lg:flex-col">
        <SidebarContent isAdmin={isAdmin} email={user.email} onSignOut={signOut} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-72 border-l border-border bg-card shadow-float">
            <SidebarContent
              isAdmin={isAdmin}
              email={user.email}
              onSignOut={signOut}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="header-solid sticky top-0 z-30 flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl p-2 hover:bg-muted lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-foreground lg:text-base">
              ريف المدينة — لوحة الإدارة
            </h1>
          </div>
          <Link
            to="/"
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            عرض المتجر
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  isAdmin,
  email,
  onSignOut,
  onNavigate,
}: {
  isAdmin: boolean;
  email: string | undefined;
  onSignOut: () => Promise<void>;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  return (
    <>
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">
            ر
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">ريف المدينة</div>
            <div className="text-[11px] text-muted-foreground">
              {isAdmin ? "مسؤول النظام" : "موظف"}
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-pill"
                  : "text-foreground/80 hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <div className="mb-2 truncate px-2 text-[11px] text-muted-foreground">{email}</div>
        <button
          onClick={() => onSignOut()}
          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </>
  );
}