import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import RoleGuard from "@/components/admin/RoleGuard";

const AllocationMonitor = lazy(() => import("@/pages/admin/AllocationMonitor"));

export const Route = createFileRoute("/admin/allocation")({
  component: () => (
    <RoleGuard roles={["admin", "store_manager"]}>
      <Suspense fallback={<div className="p-6 text-center">جاري التحميل…</div>}>
        <AllocationMonitor />
      </Suspense>
    </RoleGuard>
  ),
});
