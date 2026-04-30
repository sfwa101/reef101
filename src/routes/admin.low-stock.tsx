import { createFileRoute } from "@tanstack/react-router";
import LowStock from "@/pages/admin/LowStock";
export const Route = createFileRoute("/admin/low-stock")({ component: LowStock });
