import { createFileRoute } from "@tanstack/react-router";
import Reviews from "@/pages/admin/Reviews";
export const Route = createFileRoute("/admin/reviews")({ component: Reviews });
