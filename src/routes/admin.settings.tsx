import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/settings")({
  component: () => <Placeholder title="الإعدادات" description="قيد التطوير" />,
});
