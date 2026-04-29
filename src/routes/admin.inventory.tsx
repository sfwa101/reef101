import { createFileRoute } from "@tanstack/react-router";
import Inventory from "@/pages/admin/Inventory";

export const Route = createFileRoute("/admin/inventory")({ component: Inventory });
