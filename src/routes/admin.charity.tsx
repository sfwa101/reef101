import { createFileRoute } from "@tanstack/react-router";
import Charity from "@/pages/admin/Charity";
export const Route = createFileRoute("/admin/charity")({ component: Charity });
