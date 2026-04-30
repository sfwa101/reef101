import { createFileRoute } from "@tanstack/react-router";
import VendorShell from "@/pages/vendor/VendorShell";
export const Route = createFileRoute("/vendor")({ component: VendorShell });
