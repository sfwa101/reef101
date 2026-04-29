import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { pairFor } from "@/lib/smartPairs";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";

/**
 * Watches the cart for newly-added supermarket products and suggests a
 * smart partner via a sonner toast. Mounted only inside the supermarket page.
 */
const SmartPairingWatcher = () => {
  const { lines, add } = useCart();
  const lastIdsRef = useRef<Set<string>>(new Set(lines.map((l) => l.product.id)));
  const suggestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(lines.map((l) => l.product.id));
    for (const id of currentIds) {
      if (lastIdsRef.current.has(id)) continue;
      // newly added line
      const pairing = pairFor(id);
      if (!pairing) continue;
      if (currentIds.has(pairing.partner.id)) continue;
      const key = `${id}->${pairing.partner.id}`;
      if (suggestedRef.current.has(key)) continue;
      suggestedRef.current.add(key);
      toast(pairing.copy, {
        description: pairing.partner.name,
        duration: 5000,
        action: {
          label: `أضف بـ ${toLatin(pairing.partner.price)} ج.م`,
          onClick: () => add(pairing.partner),
        },
      });
    }
    lastIdsRef.current = currentIds;
  }, [lines, add]);

  return null;
};

export default SmartPairingWatcher;
