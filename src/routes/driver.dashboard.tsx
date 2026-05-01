import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias: /driver/dashboard → /driver (canonical driver home).
export const Route = createFileRoute("/driver/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/driver", replace: true });
  },
});
