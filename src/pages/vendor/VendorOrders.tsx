import { useVendorOperations } from "@/features/vendor/hooks/useVendorOperations";
import { VendorLiveOrdersFeed } from "@/features/vendor/components/VendorLiveOrdersFeed";
import { IOSCard } from "@/components/ios/IOSCard";
import { Activity, CheckCircle2, Clock } from "lucide-react";

export default function VendorOrders() {
  const { items, loading, summary, markOrderItemReady, undoReady, error } = useVendorOperations();

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      <div>
        <h1 className="font-display text-[22px] mb-1">الطلبات المباشرة</h1>
        <p className="text-[12px] text-foreground-secondary flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          متصل لحظياً
        </p>
      </div>

      {error && (
        <IOSCard className="border border-destructive/30 bg-destructive/5 text-destructive text-[12px] !p-3">{error}</IOSCard>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Tile icon={Activity} label="إجمالي" value={summary.totalItems} tone="from-primary to-primary-glow" />
        <Tile icon={Clock} label="بالانتظار" value={summary.pending} tone="from-warning to-accent" />
        <Tile icon={CheckCircle2} label="جاهز" value={summary.ready} tone="from-success to-teal" />
      </div>

      <VendorLiveOrdersFeed items={items} loading={loading} onMarkReady={markOrderItemReady} onUndo={undoReady} />
    </div>
  );
}

function Tile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: string }) {
  return (
    <IOSCard className="!p-3">
      <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${tone} text-white flex items-center justify-center mb-1.5`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] text-foreground-tertiary">{label}</p>
      <p className="font-display text-[18px] num">{value}</p>
    </IOSCard>
  );
}
