import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/account/Profile";
export const Route = createFileRoute("/_app/account/profile")({ component: Page });
