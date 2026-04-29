import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/analytics")({
  component: () => <Placeholder title="التحليلات" description="قيد التطوير" />,
});
