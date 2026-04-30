import { createFileRoute } from "@tanstack/react-router";
import Expenses from "@/pages/admin/Expenses";
export const Route = createFileRoute("/admin/expenses")({ component: Expenses });
