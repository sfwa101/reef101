import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SubCategory";
export const Route = createFileRoute("/_app/sub/$slug")({ component: Page });