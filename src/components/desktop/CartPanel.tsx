import { Link } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { fmtMoney, toLatin } from "@/lib/format";

const CartPanel = () => {
  const { lines, total, count, setQty, remove } = useCart();

  return (
    <aside className="sticky top-[80px] hidden h-[calc(100vh-100px)] w-[320px] shrink-0 flex-col overflow-hidden rounded-3xl bg-card/60 shadow-soft ring-1 ring-border/40 lg:flex">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <p className="font-display text-base font-extrabold">سلتي</p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {toLatin(count)} منتج
          </p>
        </div>
        <ShoppingBag className="h-5 w-5 text-primary" />
      </header>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
            <ShoppingBag className="h-7 w-7 text-primary" strokeWidth={2} />
          </div>
          <p className="text-sm font-bold">السلة فارغة</p>
          <p className="text-[11px] text-muted-foreground">أضف منتجات لتظهر هنا</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {lines.map((l) => (
            <div
              key={l.product.id}
              className="flex gap-2 rounded-2xl bg-background/60 p-2 ring-1 ring-border/40"
            >
              <img
                src={l.product.image}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="line-clamp-2 text-xs font-bold leading-tight">
                    {l.product.name}
                  </h3>
                  <button
                    onClick={() => remove(l.product.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-1">
                  <span className="font-display text-sm font-extrabold text-primary tabular-nums">
                    {fmtMoney(l.product.price * l.qty)}
                  </span>
                  <div className="flex items-center gap-1 rounded-full bg-foreground/5 p-0.5">
                    <button
                      onClick={() => setQty(l.product.id, l.qty - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-background"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold tabular-nums">
                      {toLatin(l.qty)}
                    </span>
                    <button
                      onClick={() => setQty(l.product.id, l.qty + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="border-t border-border/60 p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-bold text-muted-foreground">الإجمالي</span>
          <span className="font-display text-lg font-extrabold text-primary tabular-nums">
            {fmtMoney(total)}
          </span>
        </div>
        <Link
          to="/cart"
          className="flex w-full items-center justify-center rounded-2xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-pill transition active:scale-[0.98]"
        >
          إتمام الطلب
        </Link>
      </footer>
    </aside>
  );
};

export default CartPanel;