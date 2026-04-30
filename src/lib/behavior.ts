/**
 * Behavior tracking — logs user actions to user_behavior_logs via the
 * `log_behavior` RPC. Calls are throttled per (event+key) to avoid spamming
 * the DB on every render.
 */
import { supabase } from "@/integrations/supabase/client";

type Event = "view_product" | "view_category" | "search" | "add_to_cart" | "purchase" | "app_open";

const lastSent = new Map<string, number>();
const THROTTLE_MS = 30_000; // 30s per (event+key)

function shouldSend(key: string): boolean {
  const now = Date.now();
  const prev = lastSent.get(key) ?? 0;
  if (now - prev < THROTTLE_MS) return false;
  lastSent.set(key, now);
  return true;
}

export async function logBehavior(opts: {
  event: Event;
  productId?: string | null;
  category?: string | null;
  query?: string | null;
  dwellMs?: number | null;
  force?: boolean;
}) {
  const key = `${opts.event}:${opts.productId ?? ""}:${opts.category ?? ""}:${opts.query ?? ""}`;
  if (!opts.force && !shouldSend(key)) return;
  try {
    await (supabase as any).rpc("log_behavior", {
      _event: opts.event,
      _product_id: opts.productId ?? null,
      _category: opts.category ?? null,
      _query: opts.query ?? null,
      _dwell_ms: opts.dwellMs ?? null,
    });
  } catch {
    /* silent — non-critical */
  }
}

/** Fetch top categories for current user (last 60 days). */
export async function fetchCategoryAffinity(userId: string | null): Promise<string[]> {
  if (!userId) return [];
  try {
    const { data } = await (supabase as any).rpc("category_affinity", { _user_id: userId });
    return ((data ?? []) as Array<{ category: string; score: number }>)
      .sort((a, b) => Number(b.score) - Number(a.score))
      .map((r) => r.category);
  } catch {
    return [];
  }
}
