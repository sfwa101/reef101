import { createFileRoute } from "@tanstack/react-router";
import DeliverySettings from "@/pages/admin/DeliverySettings";
export const Route = createFileRoute("/admin/delivery-settings")({ component: DeliverySettings });
