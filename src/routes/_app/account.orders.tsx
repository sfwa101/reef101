import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/account/Orders";
export const Route = createFileRoute("/_app/account/orders")({ component: Page });
