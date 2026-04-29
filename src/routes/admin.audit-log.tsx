import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/audit-log")({
  component: () => <Placeholder title="سجل العمليات" description="قيد التطوير" />,
});
