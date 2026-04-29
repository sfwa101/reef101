import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/finance")({
  component: () => <Placeholder title="التقارير المالية" description="قيد التطوير" />,
});
