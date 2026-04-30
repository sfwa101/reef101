import { createFileRoute } from "@tanstack/react-router";
import PaymentsSchedule from "@/pages/admin/PaymentsSchedule";
export const Route = createFileRoute("/admin/payments-schedule")({ component: PaymentsSchedule });
