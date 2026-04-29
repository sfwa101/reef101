import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/marketing/banners")({
  component: () => <Placeholder title="البانرات" description="قيد التطوير" />,
});
