import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/store/Home";
export const Route = createFileRoute("/_app/store/home")({ component: Page });
