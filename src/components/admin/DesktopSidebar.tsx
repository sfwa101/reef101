import { Link, useLocation } from "@tanstack/react-router";
import {
  Home, ShoppingBag, Package, Users, ShieldCheck, Wallet, Receipt, TrendingUp,
  Sparkles, Image, BellRing, Gift, Truck, MapPin, UserCog, MessagesSquare,
  Star, BarChart3, Settings, FileClock, Warehouse, Store, Printer, FolderTree,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  { title: "نظرة عامة", items: [
    { to: "/admin", icon: Home, label: "الرئيسية", exact: true },
    { to: "/admin/analytics", icon: BarChart3, label: "التحليلات" },
  ]},
  { title: "العمليات", items: [
    { to: "/admin/orders", icon: ShoppingBag, label: "الطلبات" },
    { to: "/admin/products", icon: Package, label: "المنتجات" },
    { to: "/admin/categories", icon: FolderTree, label: "الفئات" },
    { to: "/admin/print-jobs", icon: Printer, label: "طلبات الطباعة" },
    { to: "/admin/inventory", icon: Warehouse, label: "المخزون والأسعار" },
    { to: "/admin/stores", icon: Store, label: "المتاجر" },
  ]},
  { title: "العملاء", items: [
    { to: "/admin/customers", icon: Users, label: "العملاء" },
    { to: "/admin/kyc", icon: ShieldCheck, label: "التحقق KYC" },
    { to: "/admin/reviews", icon: Star, label: "التقييمات" },
  ]},
  { title: "المالية", items: [
    { to: "/admin/wallets", icon: Wallet, label: "المحافظ" },
    { to: "/admin/savings", icon: Receipt, label: "الادخار" },
    { to: "/admin/finance", icon: TrendingUp, label: "التقارير المالية" },
  ]},
  { title: "التسويق", items: [
    { to: "/admin/marketing/promos", icon: Sparkles, label: "الكوبونات" },
    { to: "/admin/marketing/banners", icon: Image, label: "البانرات" },
    { to: "/admin/marketing/notifications", icon: BellRing, label: "الإشعارات" },
    { to: "/admin/marketing/referrals", icon: Gift, label: "الإحالات" },
  ]},
  { title: "التوصيل", items: [
    { to: "/admin/delivery", icon: Truck, label: "مهام التوصيل" },
    { to: "/admin/delivery/zones", icon: MapPin, label: "المناطق" },
  ]},
  { title: "الإدارة", items: [
    { to: "/admin/staff", icon: UserCog, label: "الموظفون" },
    { to: "/admin/support", icon: MessagesSquare, label: "الدعم" },
    { to: "/admin/audit-log", icon: FileClock, label: "سجل العمليات" },
    { to: "/admin/settings", icon: Settings, label: "الإعدادات" },
  ]},
];

export function DesktopSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l bg-sidebar h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <span className="text-primary-foreground font-display text-sm">ر</span>
        </div>
        <div>
          <p className="font-display text-[15px] leading-tight">ريف المدينة</p>
          <p className="text-[10px] text-foreground-tertiary leading-tight">لوحة الإدارة ERP</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-foreground-tertiary px-3 mb-1.5">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = it.exact ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + "/");
                return (
                  <li key={it.to}>
                    <Link to={it.to} className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-base press",
                      active ? "bg-sidebar-accent text-foreground font-semibold shadow-sm"
                             : "text-foreground-secondary hover:bg-sidebar-accent/60 hover:text-foreground"
                    )}>
                      <it.icon className={cn("h-[18px] w-[18px]", active && "text-primary")} strokeWidth={active ? 2.5 : 2} />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
