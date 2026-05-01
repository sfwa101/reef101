import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias: /admin/dashboard → /admin (canonical admin home).
export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true });
  },
});
