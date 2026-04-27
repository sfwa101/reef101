import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/account/Addresses";
export const Route = createFileRoute("/_app/account/addresses")({ component: Page });
