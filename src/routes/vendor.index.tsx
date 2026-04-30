import { createFileRoute } from "@tanstack/react-router";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
export const Route = createFileRoute("/vendor/")({ component: VendorDashboard });
