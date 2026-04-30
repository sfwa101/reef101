import { createFileRoute } from "@tanstack/react-router";
import VendorSettlements from "@/pages/admin/VendorSettlements";
import { RoleGuard } from "@/components/admin/RoleGuard";
export const Route = createFileRoute("/admin/vendor-settlements")({
  component: () => <RoleGuard roles={["admin", "finance"]}><VendorSettlements /></RoleGuard>,
});
