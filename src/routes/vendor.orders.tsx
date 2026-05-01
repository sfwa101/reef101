import { createFileRoute } from "@tanstack/react-router";
import VendorOrders from "@/pages/vendor/VendorOrders";
export const Route = createFileRoute("/vendor/orders")({ component: VendorOrders });
