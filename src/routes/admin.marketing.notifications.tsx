import { createFileRoute } from "@tanstack/react-router";
import NotificationsPage from "@/pages/admin/Notifications";

export const Route = createFileRoute("/admin/marketing/notifications")({
  component: NotificationsPage,
});
