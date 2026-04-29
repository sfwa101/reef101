import { createFileRoute } from "@tanstack/react-router";
import Products from "@/pages/admin/Products";
export const Route = createFileRoute("/admin/products")({ component: Products });
