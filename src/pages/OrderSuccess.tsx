import { Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Package, Clock, Home, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { fmtMoney, toLatin } from "@/lib/format";
import { buildWaUrl, copyTextToClipboard, normalizeWaPhone } from "@/lib/whatsapp";

type StoredWaFallback = {
  phone: string;
  text: string;
  orderId?: string;
  total?: number;
};

const OrderSuccess = () => {
  const { id, total } = useSearch({ from: "/_app/order-success" });
  const shortId = (id || "").slice(0, 8).toUpperCase() || "RF000000";
  const [waFallback, setWaFallback] = useState<StoredWaFallback | null>(null);
  const waUrl = useMemo(
    () => (waFallback ? buildWaUrl(waFallback) : ""),
    [waFallback],
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("reef:checkout:wa-fallback");
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredWaFallback;
      if (parsed?.text) setWaFallback(parsed);
    } catch (e) {
      console.warn("[checkout] failed to read WhatsApp fallback", e);
    }
  }, []);

  const copySummary = async () => {
    if (!waFallback?.text) return;
    const ok = await copyTextToClipboard(waFallback.text);
    if (ok) toast.success("تم نسخ ملخص الطلب");
    else toast.error("تعذر النسخ — انسخ النص يدويًا");
  };

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
        <p className="text-sm text-muted-foreground">
          {waFallback ? "إذا لم يفتح واتساب تلقائيًا، أرسل الملخص من هنا" : "تواصلنا معك على واتساب لتأكيد التفاصيل"}
        </p>
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

      {waFallback && (
        <div className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-4 text-start shadow-soft">
          <div>
            <p className="text-sm font-extrabold">إكمال الإرسال عبر واتساب</p>
            {waFallback.phone && (
              <p className="text-xs text-muted-foreground" dir="ltr">
                +{normalizeWaPhone(waFallback.phone)}
              </p>
            )}
          </div>
          <pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-xl bg-foreground/5 p-3 text-[11px] leading-relaxed" dir="rtl">
            {waFallback.text}
          </pre>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={copySummary} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-3 text-xs font-bold">
              <Copy className="h-4 w-4" /> نسخ الملخص
            </button>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-xs font-extrabold text-primary-foreground">
              <ExternalLink className="h-4 w-4" /> فتح واتساب
            </a>
          </div>
        </div>
      )}

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