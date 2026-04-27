import { createFileRoute } from "@tanstack/react-router";
import Offers from "@/pages/Offers";
export const Route = createFileRoute("/_app/offers")({ component: Offers });
