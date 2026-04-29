import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/inventory")({
  component: () => <Placeholder title="المخزون" description="قيد التطوير" />,
});
