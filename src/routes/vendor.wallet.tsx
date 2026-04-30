import { createFileRoute } from "@tanstack/react-router";
import VendorWallet from "@/pages/vendor/VendorWallet";
export const Route = createFileRoute("/vendor/wallet")({ component: VendorWallet });
