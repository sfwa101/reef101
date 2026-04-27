import { createFileRoute } from "@tanstack/react-router";
import AdminCustomers from "@/pages/admin/Customers";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});
