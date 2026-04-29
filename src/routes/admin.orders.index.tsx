import { createFileRoute } from "@tanstack/react-router";
import Orders from "@/pages/admin/Orders";
export const Route = createFileRoute("/admin/orders/")({ component: Orders });
