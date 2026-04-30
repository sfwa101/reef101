import { createFileRoute } from "@tanstack/react-router";
import PurchaseInvoices from "@/pages/admin/PurchaseInvoices";
export const Route = createFileRoute("/admin/purchases")({ component: PurchaseInvoices });
