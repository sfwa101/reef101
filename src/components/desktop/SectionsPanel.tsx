import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  ShoppingBasket,
  ChefHat,
  Apple,
  Milk,
  Sparkles,
  GraduationCap,
  Pill,
  Package,
  Wrench,
  LayoutGrid,
  Tag,
  Wallet as WalletIcon,
  User,
} from "lucide-react";

const stores: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/", label: "الرئيسية", icon: Home, exact: true },
  { to: "/sections", label: "كل الأقسام", icon: LayoutGrid },
  { to: "/store/supermarket", label: "السوبرماركت", icon: ShoppingBasket },
  { to: "/store/kitchen", label: "مطبخ ريف", icon: ChefHat },
  { to: "/store/produce", label: "الخضار والفواكه", icon: Apple },
  { to: "/store/dairy", label: "الألبان", icon: Milk },
  { to: "/store/recipes", label: "وصفات الشيف", icon: Sparkles },
  { to: "/store/library", label: "مكتبة الطلبة", icon: GraduationCap },
  { to: "/store/pharmacy", label: "الصيدلية", icon: Pill },
  { to: "/store/wholesale", label: "ريف الجملة", icon: Package },
  { to: "/store/home", label: "الأدوات المنزلية", icon: Wrench },
];

const utility: { to: string; label: string; icon: any }[] = [
  { to: "/offers", label: "العروض", icon: Tag },
  { to: "/wallet", label: "المحفظة", icon: WalletIcon },
  { to: "/account", label: "حسابي", icon: User },
];

const SectionsPanel = () => {
  const { pathname } = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="sticky top-[80px] hidden h-[calc(100vh-100px)] w-[260px] shrink-0 flex-col gap-1 overflow-y-auto rounded-3xl bg-card/60 p-3 shadow-soft ring-1 ring-border/40 lg:flex">
      <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        المتاجر
      </p>
      {stores.map(({ to, label, icon: Icon, exact }) => {
        const active = isActive(to, exact);
        return (
          <Link
            key={to}
            to={to as any}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-primary text-primary-foreground shadow-pill"
                : "text-foreground hover:bg-foreground/5"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.4} />
            <span>{label}</span>
          </Link>
        );
      })}
      <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        أدوات
      </p>
      {utility.map(({ to, label, icon: Icon }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to as any}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-primary text-primary-foreground shadow-pill"
                : "text-foreground hover:bg-foreground/5"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2.4} />
            <span>{label}</span>
          </Link>
        );
      })}
    </aside>
  );
};

export default SectionsPanel;