import { createFileRoute } from "@tanstack/react-router";
import OrderSuccess from "@/pages/OrderSuccess";

export const Route = createFileRoute("/_app/order-success")({
  component: OrderSuccess,
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : "",
    total: typeof s.total === "number" ? s.total : Number(s.total) || 0,
  }),
});