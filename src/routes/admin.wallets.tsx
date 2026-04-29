import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/wallets")({
  component: () => <Placeholder title="المحافظ" description="قيد التطوير" />,
});
