import { Link, useSearch } from "@tanstack/react-router";
import { Check, Package, Clock, Home } from "lucide-react";
import { fmtMoney, toLatin } from "@/lib/format";

const OrderSuccess = () => {
  const { id, total } = useSearch({ from: "/_app/order-success" });
  const shortId = (id || "").slice(0, 8).toUpperCase() || "RF000000";

  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(142_70%_42%)] shadow-float">
          <Check className="h-16 w-16 text-white" strokeWidth={3} />
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold">تم استلام طلبك!</h1>
        <p className="text-sm text-muted-foreground">تواصلنا معك على واتساب لتأكيد التفاصيل</p>
      </div>

      <div className="glass-strong w-full max-w-sm space-y-3 rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><Package className="h-4 w-4 text-primary" /> رقم الطلب</span>
          <span className="font-display text-sm font-extrabold tabular-nums">RF-{shortId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><Clock className="h-4 w-4 text-primary" /> التوصيل المتوقع</span>
          <span className="text-sm font-bold tabular-nums">60 - 90 دقيقة</span>
        </div>
        {total > 0 && (
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">الإجمالي</span>
            <span className="font-display text-lg font-extrabold text-primary tabular-nums">{fmtMoney(total)}</span>
          </div>
        )}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <Link to="/account/orders" className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-pill">
          <Package className="h-4 w-4" /> تتبّع طلبك
        </Link>
        <Link to="/" className="flex items-center justify-center gap-2 rounded-2xl bg-foreground/5 py-3.5 text-sm font-bold">
          <Home className="h-4 w-4" /> تسوّق أكثر
        </Link>
      </div>

      <p className="text-[10px] text-muted-foreground tabular-nums">{toLatin("شكرًا لاختيارك ريف المدينة")}</p>
    </div>
  );
};

export default OrderSuccess;