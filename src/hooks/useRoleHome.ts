import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { retryBackendCall } from "@/lib/backendRetry";
import type { AppRole } from "@/hooks/useAdminRole";

/**
 * Returns the landing path for a user based on their highest-priority role.
 * Priority: super_admin (admin) > store_manager > cashier > collector > delivery > finance > customer.
 * Customers (no staff role) go to "/" (the store shell).
 */
export const roleToHome = (roles: AppRole[]): string => {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("store_manager")) return "/manager";
  if (roles.includes("cashier")) return "/cashier";
  if (roles.includes("collector")) return "/collector";
  if (roles.includes("delivery")) return "/delivery";
  if (roles.includes("finance")) return "/admin";
  if (roles.includes("staff")) return "/admin";
  return "/";
};

/** Look up roles once and resolve the home path. Used right after sign-in. */
export async function resolveHomeForUser(userId: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { data, error } = await retryBackendCall<any>(
    async () => await client.from("user_roles").select("role").eq("user_id", userId),
    4,
    400,
  );
  if (error) return "/";
  const roles = ((data ?? []) as { role: AppRole }[]).map((r) => r.role);
  return roleToHome(roles);
}

export function useRoleHome() {
  const { user, loading: authLoading } = useAuth();
  const [home, setHome] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHome("/");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    resolveHomeForUser(user.id).then((path) => {
      if (cancelled) return;
      setHome(path);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { home, loading: loading || authLoading };
}