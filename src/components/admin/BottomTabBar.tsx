import { Link, useLocation } from "@tanstack/react-router";
import { Home, ShoppingBag, Package, Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/admin",            icon: Home,           label: "الرئيسية", exact: true },
  { to: "/admin/orders",     icon: ShoppingBag,    label: "الطلبات" },
  { to: "/admin/products",   icon: Package,        label: "المنتجات" },
  { to: "/admin/customers",  icon: Users,          label: "العملاء" },
  { to: "/admin/more",       icon: MoreHorizontal, label: "المزيد" },
];

export function BottomTabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border/50"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="grid grid-cols-5 px-1 pt-1.5 pb-1">
        {tabs.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to}>
              <Link to={to} className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 rounded-2xl press transition-base",
                isActive ? "text-primary" : "text-foreground-tertiary"
              )}>
                <div className={cn("h-7 w-12 rounded-xl flex items-center justify-center transition-base", isActive && "bg-primary/10")}>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] leading-none", isActive && "font-semibold")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
