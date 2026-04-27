import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/account/Settings";
export const Route = createFileRoute("/_app/account/settings")({ component: Page });
