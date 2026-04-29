import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/RestaurantDetail";
export const Route = createFileRoute("/_app/restaurant/$id")({ component: Page });