import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import reefLogo from "@/assets/reef-logo.png";
import { useCart } from "@/context/CartContext";
import { fmtMoney } from "@/lib/format";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

const TopBar = ({ title = "ريف المدينة", subtitle = "عبق الريف" }: TopBarProps) => {
  const { count, total } = useCart();

  return (
    <header
      className="header-solid fixed inset-x-0 top-0 z-40"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2 lg:max-w-[1400px] lg:px-6 lg:py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-soft lg:h-11 lg:w-11">
            <img src={reefLogo} alt="" width={32} height={32} className="h-6 w-6 object-contain lg:h-8 lg:w-8" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-foreground lg:text-lg">{title}</p>
            <p className="text-[10px] font-medium text-muted-foreground lg:text-xs">{subtitle}</p>
          </div>
        </Link>

        <Link
          to="/cart"
          aria-label="السلة"
          dir="rtl"
          className="relative flex flex-row-reverse items-center gap-2 rounded-full bg-foreground/[0.06] px-2 py-1.5 transition hover:bg-foreground/[0.1] ease-apple lg:hidden"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
            <ShoppingBag className="h-4 w-4" strokeWidth={2.2} />
          </div>
          {count > 0 && (
            <div
              key={total}
              className="animate-cart-capsule flex flex-row-reverse items-center ps-2 pe-1"
              style={{ transformOrigin: "right center" }}
            >
              <span className="font-display text-sm font-extrabold text-foreground whitespace-nowrap tabular-nums">
                {fmtMoney(total)}
              </span>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
};

export default TopBar;