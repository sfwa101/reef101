import { createFileRoute } from "@tanstack/react-router";
import AllocationMonitor from "@/pages/admin/AllocationMonitor";
import { RoleGuard } from "@/components/admin/RoleGuard";

export const Route = createFileRoute("/admin/allocation")({
  component: () => (
    <RoleGuard roles={["admin", "store_manager"]}>
      <AllocationMonitor />
    </RoleGuard>
  ),
});
