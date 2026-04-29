import { createFileRoute } from "@tanstack/react-router";
import Stores from "@/pages/admin/Stores";

export const Route = createFileRoute("/admin/stores")({ component: Stores });
