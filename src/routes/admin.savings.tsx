import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/savings")({
  component: () => <Placeholder title="الادخار" description="قيد التطوير" />,
});
