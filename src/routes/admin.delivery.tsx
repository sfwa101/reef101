import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/delivery")({
  component: () => <Placeholder title="مهام التوصيل" description="قيد التطوير" />,
});
