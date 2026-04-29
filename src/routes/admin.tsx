import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleGuard } from "@/components/admin/RoleGuard";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RoleGuard>
      <AdminShell />
    </RoleGuard>
  ),
});
