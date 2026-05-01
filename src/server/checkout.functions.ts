// Atomic checkout server function.
//
// Wraps the `place_order_atomic` Postgres function to:
//   1) validate cart input (zod)
//   2) create the order
//   3) create order_items
//   4) deduct stock
//   5) create vendor/admin notifications
//   6) rollback safely on any failure (handled inside the DB function)
//
// Returns the new order id. Errors are surfaced as typed strings so the UI
// can show friendly Arabic messages.

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const ItemSchema = z.object({
  product_id: z.string().min(1).max(128),
  product_name: z.string().min(1).max(256),
  product_image: z.string().max(2048).nullable().optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive().max(999),
});

const CheckoutSchema = z.object({
  total: z.number().nonnegative(),
  payment_method: z.string().min(1).max(64),
  address_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  service_type: z.string().max(64).optional().default("delivery"),
  delivery_zone: z.string().max(64).nullable().optional(),
  items: z.array(ItemSchema).min(1).max(100),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type CheckoutResult =
  | { ok: true; order_id: string }
  | { ok: false; error: string; code?: string };

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckoutSchema.parse(input))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      console.error("[checkout] missing backend environment for placeOrder");
      return { ok: false, error: "إعدادات الخادم غير مكتملة", code: "server_config" };
    }

    const authHeader = getRequestHeader("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("[checkout] placeOrder called without bearer auth header");
      return { ok: false, error: "يرجى تسجيل الدخول لإتمام الطلب", code: "unauthorized" };
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return { ok: false, error: "يرجى تسجيل الدخول لإتمام الطلب", code: "unauthorized" };
    }

    const supabase: SupabaseClient<Database> = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      },
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) {
      console.warn("[checkout] invalid auth token for placeOrder", claimsError?.message);
      return { ok: false, error: "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى", code: "unauthorized" };
    }

    try {
      const { data: orderId, error } = await (supabase as SupabaseClient<Database> & { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string; details?: string } | null }> }).rpc(
        "place_order_atomic",
        {
          _user_id: userId,
          _total: data.total,
          _payment_method: data.payment_method,
          _address_id: data.address_id ?? null,
          _notes: data.notes ?? null,
          _service_type: data.service_type ?? "delivery",
          _delivery_zone: data.delivery_zone ?? null,
          _items: data.items,
        },
      );

      if (error) {
        console.error("[checkout] rpc failed:", error.message, error.details);
        const msg = error.message || "";
        if (msg.includes("out_of_stock")) {
          return { ok: false, error: "أحد المنتجات نفد من المخزون", code: "out_of_stock" };
        }
        if (msg.includes("product_not_found")) {
          return { ok: false, error: "منتج غير موجود في الكتالوج", code: "product_not_found" };
        }
        if (msg.includes("empty_cart")) {
          return { ok: false, error: "السلة فارغة", code: "empty_cart" };
        }
        if (msg.includes("unauthorized")) {
          return { ok: false, error: "غير مصرح", code: "unauthorized" };
        }
        return { ok: false, error: "تعذر إنشاء الطلب، حاول مرة أخرى", code: "rpc_error" };
      }

      if (!orderId || typeof orderId !== "string") {
        console.error("[checkout] missing order id in rpc response");
        return { ok: false, error: "استجابة غير متوقعة من الخادم", code: "no_order_id" };
      }

      return { ok: true, order_id: orderId };
    } catch (e) {
      console.error("[checkout] unexpected exception:", e);
      return { ok: false, error: "حدث خطأ غير متوقع", code: "exception" };
    }
  });
