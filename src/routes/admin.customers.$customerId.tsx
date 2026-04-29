import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/customers/$customerId")({
  component: () => <Placeholder title="بطاقة العميل" description="قيد التطوير" />,
});
