import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/marketing/promos")({
  component: () => <Placeholder title="الكوبونات" description="قيد التطوير" />,
});
