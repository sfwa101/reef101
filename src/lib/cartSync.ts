// Cart persistence layer.
//
// Responsibilities:
// - Load remote cart for a logged-in user (one shot).
// - Push local cart changes to Supabase (debounced, last-write-wins per line).
// - Merge guest (localStorage) cart with remote cart on login.
//
// Schema: public.cart_items { user_id, product_id, qty, meta jsonb }.
// We treat (user_id, product_id, meta-signature) as the line identity, where
// meta-signature is a stable hash of variant/kind/booking/print fields.
// For the first iteration we keep it simple: one row per (user_id, product_id),
// and store ALL line meta in the `meta` column. If two lines with the same
// product_id but different meta exist locally (rare today), the second one
// wins on push — acceptable for v1.

import { supabase } from "@/integrations/supabase/client";
import { getById, type Product } from "@/lib/products";
import type { CartLineMeta } from "@/context/CartContext";

export type RemoteLine = {
  product_id: string;
  qty: number;
  meta: CartLineMeta;
};

export type LocalLine = { product: Product; qty: number; meta?: CartLineMeta };

/** Fetch the current user's persisted cart. Returns [] if not logged in. */
export async function fetchRemoteCart(userId: string): Promise<LocalLine[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, qty, meta")
    .eq("user_id", userId);

  if (error || !Array.isArray(data)) return [];

  const lines: LocalLine[] = [];
  for (const row of data) {
    const product = getById(row.product_id);
    if (!product) continue; // product no longer exists — skip silently
    lines.push({
      product,
      qty: Math.max(1, Number(row.qty) || 1),
      meta: (row.meta ?? {}) as CartLineMeta,
    });
  }
  return lines;
}

/**
 * Replace the user's remote cart with the given local lines.
 * Uses delete-then-insert for simplicity. Safe because the user owns the rows
 * via RLS, and the operation runs only when the user is authenticated.
 */
export async function pushRemoteCart(
  userId: string,
  lines: LocalLine[],
): Promise<void> {
  // 1) clear current rows
  const del = await supabase.from("cart_items").delete().eq("user_id", userId);
  if (del.error) {
    console.warn("[cart] failed to clear remote cart:", del.error.message);
    return;
  }
  if (lines.length === 0) return;

  // 2) insert fresh rows
  const rows = lines.map((l) => ({
    user_id: userId,
    product_id: l.product.id,
    qty: l.qty,
    meta: (l.meta ?? {}) as CartLineMeta,
  }));
  const ins = await supabase.from("cart_items").insert(rows);
  if (ins.error) {
    console.warn("[cart] failed to insert remote cart:", ins.error.message);
  }
}

/**
 * Merge a guest cart with a remote cart.
 * Strategy (no duplicates):
 *  - Same product_id + matching meta-signature → sum qty.
 *  - Otherwise → keep both as separate lines.
 */
export function mergeCarts(
  guest: LocalLine[],
  remote: LocalLine[],
): LocalLine[] {
  const out: LocalLine[] = [...remote];
  for (const g of guest) {
    const idx = out.findIndex(
      (r) =>
        r.product.id === g.product.id && metaSignature(r.meta) === metaSignature(g.meta),
    );
    if (idx >= 0) {
      out[idx] = { ...out[idx], qty: out[idx].qty + g.qty };
    } else {
      out.push(g);
    }
  }
  return out;
}

/** Stable signature of meta fields that affect line identity. */
function metaSignature(meta?: CartLineMeta): string {
  if (!meta) return "";
  const sig = {
    kind: meta.kind ?? "buy",
    variantId: meta.variantId ?? "",
    bookingDate: meta.bookingDate ?? "",
    bookingSlot: meta.bookingSlot ?? "",
    borrowDuration: meta.borrowDuration ?? "",
    printConfigKey: meta.printConfig
      ? `${meta.printConfig.pages}-${meta.printConfig.copies}-${meta.printConfig.colorMode}-${meta.printConfig.sided}-${meta.printConfig.binding}-${meta.printConfig.fileName ?? ""}`
      : "",
    addonIds: (meta.addonIds ?? []).slice().sort().join(","),
  };
  return JSON.stringify(sig);
}
