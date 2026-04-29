import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@/pages/admin/Placeholder";
export const Route = createFileRoute("/admin/kyc")({
  component: () => <Placeholder title="التحقق KYC" description="قيد التطوير" />,
});
