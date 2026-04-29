import { createFileRoute } from "@tanstack/react-router";
import OrderDetail from "@/pages/admin/OrderDetail";
export const Route = createFileRoute("/admin/orders/$orderId")({ component: OrderDetail });
