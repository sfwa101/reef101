import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "reef.lastActiveAt";
const NUDGE_AFTER_MS = 2 * 60 * 60 * 1000; // 2h
const NUDGE_DEDUPE_KEY = "reef.lastNudgeAt";
const NUDGE_DEDUPE_MS = 6 * 60 * 60 * 1000; // 6h between nudges

/**
 * In-app inactivity nudger:
 * - Marks "last active" timestamp on mount and every visibility change.
 * - On mount, if the user has been away >2h, fetches a current flash-sale
 *   product (in their top affinity category, if any) and shows a toast.
 */
export default function InactivityNudger() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    const lastNudge = Number(localStorage.getItem(NUDGE_DEDUPE_KEY) ?? 0);
    localStorage.setItem(STORAGE_KEY, String(now));

    const onVis = () => {
      if (document.visibilityState === "visible") {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const wasAway = last > 0 && now - last > NUDGE_AFTER_MS;
    const canNudge = now - lastNudge > NUDGE_DEDUPE_MS;
    if (!wasAway || !canNudge) return () => document.removeEventListener("visibilitychange", onVis);

    (async () => {
      try {
        let category: string | null = null;
        if (user?.id) {
          const { data } = await (supabase as any).rpc("category_affinity", { _user_id: user.id });
          const top = (data ?? [])[0];
          category = top?.category ?? null;
        }
        const { data: sale } = await (supabase as any)
          .from("flash_sales")
          .select("id")
          .eq("is_active", true)
          .order("starts_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!sale) return;
        let q = (supabase as any)
          .from("flash_sale_products")
          .select("product_id,product_name,discount_pct,category")
          .eq("flash_sale_id", sale.id)
          .order("rank")
          .limit(5);
        const { data: items } = await q;
        const list = (items ?? []) as Array<{ product_id: string; product_name: string; discount_pct: number; category: string | null }>;
        const pick = list.find((it) => category && it.category === category) ?? list[0];
        if (!pick) return;

        const name = profile?.full_name?.split(" ")[0] ?? "";
        toast(`${name ? `يا ${name}, ` : ""}بدأ الآن عرض الفلاش على ${pick.product_name}`, {
          description: `خصم ${Math.round(Number(pick.discount_pct))}٪ — تبقّى وقت محدود!`,
          duration: 8000,
        });
        localStorage.setItem(NUDGE_DEDUPE_KEY, String(Date.now()));

        // Persist as in-app notification if logged in
        if (user?.id) {
          await (supabase as any).from("notifications").insert({
            user_id: user.id,
            title: "عرض فلاش يناسبك",
            body: `${pick.product_name} — خصم ${Math.round(Number(pick.discount_pct))}٪`,
            icon: "flame",
          });
        }
      } catch {
        /* silent */
      }
    })();

    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user?.id, profile?.full_name]);

  return null;
}
