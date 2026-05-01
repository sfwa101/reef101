import { createFileRoute } from "@tanstack/react-router";
import Referrals from "@/pages/admin/Referrals";
export const Route = createFileRoute("/admin/marketing/referrals")({
  component: Referrals,
});
