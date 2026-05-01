import { Home, Tag, LayoutGrid, Wallet, User, ShoppingBag, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { useCartCount } from "@/context/CartContext";
import { toLatin } from "@/lib/format";

type TabItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to: "/" | "/offers" | "/sections" | "/wallet" | "/account";
  primary?: boolean;
};

const items: TabItem[] = [
  { id: "home", label: "الرئيسية", icon: Home, to: "/" },
  { id: "offers", label: "العروض", icon: Tag, to: "/offers" },
  { id: "sections", label: "الأقسام", icon: LayoutGrid, to: "/sections", primary: true },
  { id: "wallet", label: "المحفظة", icon: Wallet, to: "/wallet" },
  { id: "account", label: "حسابي", icon: User, to: "/account" },
];

const TabBar = () => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-30 px-4 pb-5 pt-2 lg:hidden"
      style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="glass-strong mx-auto flex max-w-md items-end justify-between rounded-[1.75rem] px-3 py-2 shadow-float">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          if (item.primary) {
            return (
              <Link
                key={item.id}
                to={item.to}
                className="relative -mt-7 flex flex-col items-center"
                aria-label={item.label}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-pill transition ease-apple ${
                    isActive ? "scale-105" : ""
                  }`}
                >
                  <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.4} />
                </div>
                <span className="mt-1 text-[10px] font-semibold text-foreground">
                  {item.label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={item.id}
              to={item.to}
              className="group flex flex-1 flex-col items-center gap-0.5 py-1.5"
              aria-label={item.label}
            >
              <Icon
                className={`h-5 w-5 transition ease-apple ${
                  isActive ? "text-primary scale-110" : "text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-semibold transition ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;