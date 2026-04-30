import { createFileRoute } from "@tanstack/react-router";
import ExecutiveDashboard from "@/pages/admin/ExecutiveDashboard";
export const Route = createFileRoute("/admin/executive")({ component: ExecutiveDashboard });
