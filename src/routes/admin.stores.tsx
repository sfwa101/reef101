import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/stores")({
  component: () => <Placeholder title="المتاجر" description="قيد التطوير" />,
});
