import { createFileRoute } from "@tanstack/react-router";
import AdminWallets from "@/pages/admin/Wallets";
export const Route = createFileRoute("/admin/wallets")({ component: AdminWallets });
