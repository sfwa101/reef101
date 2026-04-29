import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/delivery/zones")({
  component: () => <Placeholder title="مناطق التوصيل" description="قيد التطوير" />,
});
