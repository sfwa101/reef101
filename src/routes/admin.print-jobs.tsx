import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/print-jobs")({
  component: () => <Placeholder title="طلبات الطباعة" description="قيد التطوير" />,
});
