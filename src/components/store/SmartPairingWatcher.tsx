import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { pairFor } from "@/lib/smartPairs";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";

/**
 * Smart upsell: watches the cart for newly-added supermarket items and
 * suggests one complementary partner. Coalesces into a single sticky toast
 * id so rapid-fire additions don't stack — the most recent suggestion wins.
 */
const TOAST_ID = "smart-upsell";
const COOLDOWN_MS = 6000;

const SmartPairingWatcher = () => {
  const { lines, add } = useCart();
  const lastIdsRef = useRef<Set<string>>(new Set(lines.map((l) => l.product.id)));
  const suggestedRef = useRef<Set<string>>(new Set());
  const lastShownAtRef = useRef(0);

  useEffect(() => {
    const currentIds = new Set(lines.map((l) => l.product.id));
    const newlyAdded: string[] = [];
    for (const id of currentIds) {
      if (!lastIdsRef.current.has(id)) newlyAdded.push(id);
    }
    lastIdsRef.current = currentIds;
    if (newlyAdded.length === 0) return;

    // Pick the freshest pairing whose partner isn't already in the cart and
    // hasn't been suggested in this session.
    for (let i = newlyAdded.length - 1; i >= 0; i--) {
      const id = newlyAdded[i];
      const pairing = pairFor(id);
      if (!pairing) continue;
      if (currentIds.has(pairing.partner.id)) continue;
      const key = `${id}->${pairing.partner.id}`;
      if (suggestedRef.current.has(key)) continue;

      const now = Date.now();
      if (now - lastShownAtRef.current < COOLDOWN_MS) {
        // dismiss any current upsell so we don't pile up
        toast.dismiss(TOAST_ID);
      }
      suggestedRef.current.add(key);
      lastShownAtRef.current = now;

      toast(pairing.copy, {
        id: TOAST_ID,
        description: `${pairing.partner.name} · ${toLatin(pairing.partner.price)} ج.م`,
        icon: "💡",
        duration: 5000,
        action: {
          label: `أضف +1`,
          onClick: () => add(pairing.partner),
        },
      });
      return;
    }
  }, [lines, add]);

  return null;
};

export default SmartPairingWatcher;
