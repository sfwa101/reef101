import { createFileRoute } from "@tanstack/react-router";
import DriverTasks from "@/pages/driver/DriverTasks";
export const Route = createFileRoute("/driver/")({ component: DriverTasks });
