import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias: /vendor/dashboard → /vendor (canonical vendor home).
export const Route = createFileRoute("/vendor/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/vendor", replace: true });
  },
});
