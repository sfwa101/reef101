import { createFileRoute } from "@tanstack/react-router";
import Search from "@/pages/Search";

export const Route = createFileRoute("/_app/search")({
  component: Search,
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
});