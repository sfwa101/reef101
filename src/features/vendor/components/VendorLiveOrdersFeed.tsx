import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney } from "@/lib/format";
import { CheckCircle2, Clock, Package2, Undo2, Loader2 } from "lucide-react";
import type { VendorLiveOrderItem } from "../types/vendor-ops.types";

type Props = {
  items: VendorLiveOrderItem[];
  loading: boolean;
  onMarkReady: (id: string) => void;
  onUndo: (id: string) => void;
};

const statusLabel: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكَّد",
  preparing: "قيد التجهيز",
  ready: "جاهز",
  out_for_delivery: "في الطريق",
};

const timeAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  return `قبل ${h} س`;
};

export function VendorLiveOrdersFeed({ items, loading, onMarkReady, onUndo }: Props) {
  if (loading) {
    return <div className="p-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const pending = items.filter(i => !i.ready);
  const ready = items.filter(i => i.ready);

  if (items.length === 0) {
    return (
      <IOSCard className="text-center py-10">
        <Package2 className="h-10 w-10 mx-auto text-foreground-tertiary mb-2" />
        <p className="text-[14px] font-semibold mb-1">لا طلبات نشطة الآن</p>
        <p className="text-[12px] text-foreground-tertiary">سيظهر هنا أي طلب جديد لمنتجاتك فوراً.</p>
      </IOSCard>
    );
  }

  return (
    <div className="space-y-4">
      <Section title="بانتظار التجهيز" count={pending.length} accent="warning">
        {pending.length === 0 ? (
          <IOSCard className="text-center text-foreground-tertiary text-[12px] py-6">لا يوجد ما يُجهَّز.</IOSCard>
        ) : (
          <div className="space-y-2">
            {pending.map(i => (
              <ItemCard key={i.id} item={i}>
                <button
                  onClick={() => onMarkReady(i.id)}
                  className="w-full mt-3 h-12 rounded-2xl bg-success text-success-foreground font-semibold text-[14px] flex items-center justify-center gap-2 press shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5" /> تم التجهيز
                </button>
              </ItemCard>
            ))}
          </div>
        )}
      </Section>

      {ready.length > 0 && (
        <Section title="جاهز للتسليم" count={ready.length} accent="success">
          <div className="space-y-2">
            {ready.map(i => (
              <ItemCard key={i.id} item={i} dim>
                <button
                  onClick={() => onUndo(i.id)}
                  className="mt-3 h-9 px-3 rounded-xl bg-surface-muted text-[12px] font-semibold flex items-center gap-1.5 press"
                >
                  <Undo2 className="h-3.5 w-3.5" /> تراجع
                </button>
              </ItemCard>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, accent, children }: { title: string; count: number; accent: "warning" | "success"; children: React.ReactNode }) {
  const dot = accent === "warning" ? "bg-warning" : "bg-success";
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h3 className="font-display text-[15px]">{title}</h3>
        <span className="text-[11px] text-foreground-tertiary">({count})</span>
      </div>
      {children}
    </div>
  );
}

function ItemCard({ item, dim, children }: { item: VendorLiveOrderItem; dim?: boolean; children: React.ReactNode }) {
  return (
    <IOSCard className={`!p-3 ${dim ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-xl bg-surface-muted overflow-hidden shrink-0">
          {item.product_image && <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] truncate">{item.product_name}</p>
          <div className="flex items-center gap-2 text-[11px] text-foreground-tertiary mt-0.5">
            <Clock className="h-3 w-3" /> <span>{timeAgo(item.created_at)}</span>
            <span>•</span>
            <span>{statusLabel[item.order_status] ?? item.order_status}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[12px]">
            <span className="font-semibold">×{item.quantity}</span>
            <span className="text-primary font-semibold num">{fmtMoney(item.price * item.quantity)}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-muted text-foreground-secondary">
              #{item.order_id.slice(0, 6)}
            </span>
          </div>
        </div>
      </div>
      {children}
    </IOSCard>
  );
}
