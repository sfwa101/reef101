import { createFileRoute } from "@tanstack/react-router";
import Wallet from "@/pages/Wallet";
export const Route = createFileRoute("/_app/wallet")({ component: Wallet });
