import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/* ============================================================
 * Phase 6 — Real-Time Shared Carts FSM
 * ------------------------------------------------------------
 * STATE 1: 'active'             → contributors can mutate items
 * STATE 2: 'pending_approvals'  → cart locked; each participant must approve
 * STATE 3: 'frozen'             → all approved; ready for checkout
 * Terminal: 'completed' | 'cancelled'
 * Transitions are owner-driven except auto-frozen (DB trigger when
 * every participant approves).
 * ============================================================ */

export type SharedCartStatus =
  | "active"
  | "pending_approvals"
  | "frozen"
  | "completed"
  | "cancelled";

export type SharedCartRole = "owner" | "contributor";
export type SharedCartSplitType = "percentage" | "fixed" | "itemized";
export type SharedCartApproval = "pending" | "approved" | "rejected";

export type SharedCart = {
  id: string;
  owner_id: string;
  status: SharedCartStatus;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SharedCartParticipant = {
  id: string;
  cart_id: string;
  user_id: string;
  role: SharedCartRole;
  split_type: SharedCartSplitType;
  split_value: number;
  approval_status: SharedCartApproval;
  approved_at: string | null;
};

export type SharedCartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  meta: Record<string, unknown>;
  added_by: string;
  created_at: string;
  updated_at: string;
};

type UseSharedCartSyncResult = {
  cart: SharedCart | null;
  participants: SharedCartParticipant[];
  items: SharedCartItem[];
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  myParticipant: SharedCartParticipant | null;
  // FSM transitions
  requestApprovals: () => Promise<void>;
  reopenForEdits: () => Promise<void>;
  approve: () => Promise<void>;
  reject: () => Promise<void>;
  cancelCart: () => Promise<void>;
  markCompleted: () => Promise<void>;
  // Item ops (active state only)
  addItem: (input: Omit<SharedCartItem, "id" | "cart_id" | "added_by" | "created_at" | "updated_at">) => Promise<void>;
  updateItemQty: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
};

const ACTIVE_STATES: SharedCartStatus[] = ["active"];

export const useSharedCartSync = (sharedCartId: string | null): UseSharedCartSyncResult => {
  const { user } = useAuth();
  const [cart, setCart] = useState<SharedCart | null>(null);
  const [participants, setParticipants] = useState<SharedCartParticipant[]>([]);
  const [items, setItems] = useState<SharedCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!!sharedCartId);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchAll = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [cartRes, partsRes, itemsRes] = await Promise.all([
        supabase.from("shared_carts").select("*").eq("id", id).maybeSingle(),
        supabase.from("shared_cart_participants").select("*").eq("cart_id", id),
        supabase.from("shared_cart_items").select("*").eq("cart_id", id).order("created_at", { ascending: true }),
      ]);
      if (cancelledRef.current) return;
      if (cartRes.error) throw cartRes.error;
      setCart((cartRes.data as SharedCart | null) ?? null);
      setParticipants((partsRes.data as SharedCartParticipant[] | null) ?? []);
      setItems((itemsRes.data as SharedCartItem[] | null) ?? []);
    } catch (e) {
      if (!cancelledRef.current) setError(e instanceof Error ? e.message : "shared_cart_load_failed");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  // Initial load + realtime subscription
  useEffect(() => {
    cancelledRef.current = false;
    if (!sharedCartId) {
      setCart(null);
      setParticipants([]);
      setItems([]);
      setLoading(false);
      return;
    }
    fetchAll(sharedCartId);

    const channel = supabase
      .channel(`shared-cart-${sharedCartId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_carts", filter: `id=eq.${sharedCartId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setCart(null);
          else setCart((payload.new as SharedCart) ?? null);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_cart_participants", filter: `cart_id=eq.${sharedCartId}` },
        (payload) => {
          setParticipants((prev) => {
            if (payload.eventType === "INSERT") return [...prev, payload.new as SharedCartParticipant];
            if (payload.eventType === "UPDATE")
              return prev.map((p) => (p.id === (payload.new as SharedCartParticipant).id ? (payload.new as SharedCartParticipant) : p));
            if (payload.eventType === "DELETE")
              return prev.filter((p) => p.id !== (payload.old as SharedCartParticipant).id);
            return prev;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_cart_items", filter: `cart_id=eq.${sharedCartId}` },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") return [...prev, payload.new as SharedCartItem];
            if (payload.eventType === "UPDATE")
              return prev.map((i) => (i.id === (payload.new as SharedCartItem).id ? (payload.new as SharedCartItem) : i));
            if (payload.eventType === "DELETE")
              return prev.filter((i) => i.id !== (payload.old as SharedCartItem).id);
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      cancelledRef.current = true;
      supabase.removeChannel(channel);
    };
  }, [sharedCartId, fetchAll]);

  const isOwner = !!(cart && user && cart.owner_id === user.id);
  const myParticipant = useMemo(
    () => (user ? participants.find((p) => p.user_id === user.id) ?? null : null),
    [participants, user],
  );

  // ============= FSM transitions =============
  const setStatus = useCallback(
    async (next: SharedCartStatus) => {
      if (!cart) return;
      const { error: err } = await supabase
        .from("shared_carts")
        .update({ status: next })
        .eq("id", cart.id);
      if (err) throw err;
    },
    [cart],
  );

  const requestApprovals = useCallback(async () => {
    if (!cart || !isOwner) throw new Error("forbidden");
    if (cart.status !== "active") throw new Error("invalid_transition");
    // Reset all non-owner participants to pending
    await supabase
      .from("shared_cart_participants")
      .update({ approval_status: "pending", approved_at: null })
      .eq("cart_id", cart.id)
      .neq("role", "owner");
    await setStatus("pending_approvals");
  }, [cart, isOwner, setStatus]);

  const reopenForEdits = useCallback(async () => {
    if (!cart || !isOwner) throw new Error("forbidden");
    if (!["pending_approvals", "frozen"].includes(cart.status)) throw new Error("invalid_transition");
    await setStatus("active");
  }, [cart, isOwner, setStatus]);

  const approve = useCallback(async () => {
    if (!cart || !myParticipant) throw new Error("forbidden");
    if (cart.status !== "pending_approvals") throw new Error("invalid_state");
    const { error: err } = await supabase
      .from("shared_cart_participants")
      .update({ approval_status: "approved", approved_at: new Date().toISOString() })
      .eq("id", myParticipant.id);
    if (err) throw err;
  }, [cart, myParticipant]);

  const reject = useCallback(async () => {
    if (!cart || !myParticipant) throw new Error("forbidden");
    if (cart.status !== "pending_approvals") throw new Error("invalid_state");
    const { error: err } = await supabase
      .from("shared_cart_participants")
      .update({ approval_status: "rejected", approved_at: null })
      .eq("id", myParticipant.id);
    if (err) throw err;
  }, [cart, myParticipant]);

  const cancelCart = useCallback(async () => {
    if (!cart || !isOwner) throw new Error("forbidden");
    await setStatus("cancelled");
  }, [cart, isOwner, setStatus]);

  const markCompleted = useCallback(async () => {
    if (!cart || !isOwner) throw new Error("forbidden");
    if (cart.status !== "frozen") throw new Error("invalid_transition");
    await setStatus("completed");
  }, [cart, isOwner, setStatus]);

  // ============= Item operations (active state only) =============
  const guardEditable = useCallback(() => {
    if (!cart) throw new Error("no_cart");
    if (!ACTIVE_STATES.includes(cart.status)) throw new Error("cart_locked");
  }, [cart]);

  const addItem: UseSharedCartSyncResult["addItem"] = useCallback(
    async (input) => {
      guardEditable();
      if (!cart || !user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any).from("shared_cart_items").insert({
        cart_id: cart.id,
        added_by: user.id,
        product_id: input.product_id,
        product_name: input.product_name,
        unit_price: input.unit_price,
        quantity: input.quantity,
        meta: input.meta ?? {},
      });
      if (err) throw err;
    },
    [cart, user, guardEditable],
  );

  const updateItemQty = useCallback(
    async (itemId: string, quantity: number) => {
      guardEditable();
      if (quantity <= 0) {
        const { error: err } = await supabase.from("shared_cart_items").delete().eq("id", itemId);
        if (err) throw err;
        return;
      }
      const { error: err } = await supabase
        .from("shared_cart_items")
        .update({ quantity })
        .eq("id", itemId);
      if (err) throw err;
    },
    [guardEditable],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      guardEditable();
      const { error: err } = await supabase.from("shared_cart_items").delete().eq("id", itemId);
      if (err) throw err;
    },
    [guardEditable],
  );

  return {
    cart,
    participants,
    items,
    loading,
    error,
    isOwner,
    myParticipant,
    requestApprovals,
    reopenForEdits,
    approve,
    reject,
    cancelCart,
    markCompleted,
    addItem,
    updateItemQty,
    removeItem,
  };
};

/** Compute each participant's owed amount given the cart subtotal. */
export const computeParticipantShares = (
  participants: SharedCartParticipant[],
  subtotal: number,
): Record<string, number> => {
  const shares: Record<string, number> = {};
  for (const p of participants) {
    if (p.split_type === "percentage") {
      shares[p.user_id] = Math.round((subtotal * Number(p.split_value || 0)) / 100);
    } else if (p.split_type === "fixed") {
      shares[p.user_id] = Number(p.split_value || 0);
    } else {
      // itemized handled by caller using items.added_by aggregation
      shares[p.user_id] = 0;
    }
  }
  return shares;
};
