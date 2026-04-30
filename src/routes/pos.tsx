import { createFileRoute } from "@tanstack/react-router";
import POSPage from "@/pages/POS";
export const Route = createFileRoute("/pos")({ component: POSPage });
