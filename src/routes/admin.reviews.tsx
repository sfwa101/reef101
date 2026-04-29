import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/reviews")({
  component: () => <Placeholder title="التقييمات" description="قيد التطوير" />,
});
