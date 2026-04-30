import { createFileRoute } from "@tanstack/react-router";
import Drivers from "@/pages/admin/Drivers";
export const Route = createFileRoute("/admin/drivers")({ component: Drivers });
