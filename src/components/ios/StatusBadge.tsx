import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled" | "refunded";
type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded" | "failed";
type ProductStatus = "active" | "draft" | "archived" | "out_of_stock";

const orderStatusMap: Record<OrderStatus, { label: string; tone: string; dot: string }> = {
  pending:          { label: "بانتظار التأكيد", tone: "bg-warning/12 text-warning",        dot: "bg-warning" },
  confirmed:        { label: "مؤكد",            tone: "bg-info/12 text-info",              dot: "bg-info" },
  preparing:        { label: "قيد التحضير",      tone: "bg-[hsl(var(--purple))]/12 text-[hsl(var(--purple))]", dot: "bg-[hsl(var(--purple))]" },
  ready:            { label: "جاهز",            tone: "bg-[hsl(var(--teal))]/12 text-[hsl(var(--teal))]",     dot: "bg-[hsl(var(--teal))]" },
  out_for_delivery: { label: "قيد التوصيل",     tone: "bg-[hsl(var(--indigo))]/12 text-[hsl(var(--indigo))]", dot: "bg-[hsl(var(--indigo))]" },
  delivered:        { label: "تم التسليم",       tone: "bg-success/12 text-success",        dot: "bg-success" },
  cancelled:        { label: "ملغي",            tone: "bg-destructive/12 text-destructive", dot: "bg-destructive" },
  refunded:         { label: "مُسترد",          tone: "bg-muted text-muted-foreground",    dot: "bg-muted-foreground" },
};

const payStatusMap: Record<PaymentStatus, { label: string; tone: string }> = {
  unpaid:   { label: "غير مدفوع", tone: "bg-warning/12 text-warning" },
  paid:     { label: "مدفوع",     tone: "bg-success/12 text-success" },
  partial:  { label: "جزئي",      tone: "bg-info/12 text-info" },
  refunded: { label: "مُسترد",    tone: "bg-muted text-muted-foreground" },
  failed:   { label: "فشل",       tone: "bg-destructive/12 text-destructive" },
};

const productStatusMap: Record<ProductStatus, { label: string; tone: string }> = {
  active:        { label: "نشط",       tone: "bg-success/12 text-success" },
  draft:         { label: "مسودة",     tone: "bg-muted text-muted-foreground" },
  archived:      { label: "مؤرشف",    tone: "bg-foreground-tertiary/15 text-foreground-secondary" },
  out_of_stock:  { label: "نفد",       tone: "bg-destructive/12 text-destructive" },
};

export function OrderStatusBadge({ status, size = "sm" }: { status: OrderStatus; size?: "sm" | "md" }) {
  const c = orderStatusMap[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
      size === "sm" ? "text-[11px] px-2 py-0.5" : "text-[12px] px-2.5 py-1",
      c.tone
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const c = payStatusMap[status];
  return <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", c.tone)}>{c.label}</span>;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const c = productStatusMap[status];
  return <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", c.tone)}>{c.label}</span>;
}