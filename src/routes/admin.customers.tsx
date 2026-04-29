import { createFileRoute } from "@tanstack/react-router";
import Customers from "@/pages/admin/Customers";
export const Route = createFileRoute("/admin/customers")({ component: Customers });
