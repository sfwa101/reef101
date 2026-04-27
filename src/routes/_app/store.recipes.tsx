import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/store/Recipes";
export const Route = createFileRoute("/_app/store/recipes")({ component: Page });
