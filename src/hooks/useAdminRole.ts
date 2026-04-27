import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { retryBackendCall } from "@/lib/backendRetry";

export type AppRole = "admin" | "staff" | "cashier";

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await retryBackendCall(
        () => supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id),
        7,
        500,
      );
      if (cancelled) return;
      if (error) {
        setLoading(false);
        return;
      }
      setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const isStaff = roles.length > 0;
  const isAdmin = roles.includes("admin");
  return { roles, isStaff, isAdmin, loading: loading || authLoading };
}