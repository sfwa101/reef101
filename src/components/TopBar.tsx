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
          <img
            src={reefLogo}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain lg:h-11 lg:w-11"
            style={{ background: "transparent" }}
          />
          <p className="font-display text-base font-extrabold tracking-tight text-foreground lg:text-xl">
            {title}
          </p>
        </Link>

        <Link
          to="/cart"
          aria-label="السلة"
          dir="rtl"
          className="relative flex flex-row-reverse items-center gap-2 rounded-2xl bg-primary/10 px-2 py-1.5 ring-1 ring-primary/15 transition hover:bg-primary/15 ease-apple shadow-soft lg:hidden"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-pill">
            <ShoppingBag className="h-4 w-4" strokeWidth={2.2} />
          </div>
          {count > 0 && (
            <div
              key={total}
              className="animate-cart-capsule flex flex-row-reverse items-center ps-2 pe-1.5"
              style={{ transformOrigin: "right center" }}
            >
              <span className="font-display text-sm font-extrabold text-primary whitespace-nowrap tabular-nums">
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