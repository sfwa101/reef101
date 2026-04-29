import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/support")({
  component: () => <Placeholder title="الدعم" description="قيد التطوير" />,
});
