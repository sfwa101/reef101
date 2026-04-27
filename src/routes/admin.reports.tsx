import { createFileRoute } from "@tanstack/react-router";
import AdminReports from "@/pages/admin/Reports";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});
