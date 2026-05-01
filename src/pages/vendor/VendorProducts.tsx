import { useVendorOperations } from "@/features/vendor/hooks/useVendorOperations";
import { VendorInventoryGrid } from "@/features/vendor/components/VendorInventoryGrid";
import { IOSCard } from "@/components/ios/IOSCard";
import { AlertTriangle, Package } from "lucide-react";

export default function VendorProducts() {
  const { products, loading, summary, updateProductStock, error } = useVendorOperations();

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[22px]">منتجاتي</h1>
        <span className="text-[11px] text-foreground-tertiary">{summary.totalProducts} صنف</span>
      </div>

      {error && (
        <IOSCard className="border border-destructive/30 bg-destructive/5 text-destructive text-[12px] !p-3">{error}</IOSCard>
      )}

      <div className="grid grid-cols-2 gap-2">
        <IOSCard className="!p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-foreground-tertiary">مخزون منخفض</p>
              <p className="font-display text-[16px] num">{summary.lowStock}</p>
            </div>
          </div>
        </IOSCard>
        <IOSCard className="!p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-info/15 text-info flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-foreground-tertiary">موقوفة</p>
              <p className="font-display text-[16px] num">{summary.inactive}</p>
            </div>
          </div>
        </IOSCard>
      </div>

      <VendorInventoryGrid products={products} loading={loading} onUpdate={updateProductStock} />
    </div>
  );
}
