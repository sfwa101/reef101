import { createFileRoute } from "@tanstack/react-router";
import EmployeeHub from "@/pages/EmployeeHub";
export const Route = createFileRoute("/employee")({ component: EmployeeHub });
