import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/marketing/referrals")({
  component: () => <Placeholder title="الإحالات" description="قيد التطوير" />,
});
