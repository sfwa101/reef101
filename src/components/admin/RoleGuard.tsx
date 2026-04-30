import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AppRole = "admin" | "staff" | "cashier" | "store_manager" | "collector" | "delivery" | "finance" | "vendor";

export function useAdminRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[] | null>(null);

  useEffect(() => {
    if (!user) { setRoles([]); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }: { data: { role: AppRole }[] | null }) => {
        setRoles(data?.map(r => r.role) ?? []);
      });
  }, [user]);

  return {
    roles: roles ?? [],
    loading: roles === null,
    isStaff: (roles?.length ?? 0) > 0,
    hasRole: (r: AppRole) => roles?.includes(r) ?? false,
  };
}

export function RoleGuard({ roles: required, children }: { roles?: AppRole[]; children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { roles, loading, isStaff, hasRole } = useAdminRoles();
  const location = useLocation();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" search={{ redirect: location.pathname }} replace />;
  if (!isStaff) return <Unauthorized onSignOut={signOut} reason="حسابك ليس له أي دور إداري." />;
  if (required && !required.some(hasRole)) {
    return <Unauthorized onSignOut={signOut} reason={`متاح فقط لـ: ${required.join("، ")}`} />;
  }
  return <>{children}</>;
}

function Unauthorized({ reason, onSignOut }: { reason: string; onSignOut: () => Promise<void> }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-6" dir="rtl">
      <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-border/40">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="font-display text-[22px] mb-2">غير مصرح بالدخول</h1>
        <p className="text-[13px] text-foreground-secondary mb-5">{reason}</p>
        <Button variant="outline" onClick={onSignOut} className="rounded-xl h-11 px-6">تسجيل الخروج</Button>
      </div>
    </div>
  );
}
