import { createFileRoute } from "@tanstack/react-router";
import Suppliers from "@/pages/admin/Suppliers";
export const Route = createFileRoute("/admin/suppliers")({ component: Suppliers });
