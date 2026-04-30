import { createFileRoute } from "@tanstack/react-router";
import Warehouses from "@/pages/admin/Warehouses";
import { RoleGuard } from "@/components/admin/RoleGuard";
export const Route = createFileRoute("/admin/warehouses")({
  component: () => <RoleGuard roles={["admin", "store_manager"]}><Warehouses /></RoleGuard>,
});
