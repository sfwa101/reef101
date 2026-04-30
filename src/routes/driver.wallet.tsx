import { createFileRoute } from "@tanstack/react-router";
import DriverWallet from "@/pages/driver/DriverWallet";
export const Route = createFileRoute("/driver/wallet")({ component: DriverWallet });
