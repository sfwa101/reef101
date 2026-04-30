import { createFileRoute } from "@tanstack/react-router";
import VendorProducts from "@/pages/vendor/VendorProducts";
export const Route = createFileRoute("/vendor/products")({ component: VendorProducts });
