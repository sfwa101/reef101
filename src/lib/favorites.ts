// Persisted favorites store (localStorage + Supabase sync).
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const KEY = "reef-favs-v1";

const loadLocal = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const saveLocal = (next: string[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

export const useFavorites = () => {
  const { user } = useAuth();
  const [favs, setFavs] = useState<string[]>(loadLocal());

  // Load from Cloud when user logs in, then sync any local-only ids upward.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setFavs(loadLocal());
        return;
      }
      const { data } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user.id);
      const cloud = (data ?? []).map((r) => r.product_id as string);
      const local = loadLocal();
      const missing = local.filter((id) => !cloud.includes(id));
      if (missing.length > 0) {
        await supabase
          .from("favorites")
          .insert(missing.map((product_id) => ({ user_id: user.id, product_id })));
      }
      if (cancelled) return;
      const merged = Array.from(new Set([...cloud, ...missing]));
      setFavs(merged);
      saveLocal(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const has = useCallback((id: string) => favs.includes(id), [favs]);

  const toggle = useCallback(
    async (id: string) => {
      const isFav = favs.includes(id);
      const next = isFav ? favs.filter((x) => x !== id) : [...favs, id];
      setFavs(next);
      saveLocal(next);
      if (user) {
        if (isFav) {
          await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
        } else {
          await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
        }
      }
    },
    [favs, user]
  );

  return { favs, has, toggle };
};