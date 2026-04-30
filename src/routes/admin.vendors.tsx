import { createFileRoute } from "@tanstack/react-router";
import Vendors from "@/pages/admin/Vendors";
import { RoleGuard } from "@/components/admin/RoleGuard";
export const Route = createFileRoute("/admin/vendors")({
  component: () => <RoleGuard roles={["admin"]}><Vendors /></RoleGuard>,
});
