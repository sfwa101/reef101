import { createFileRoute } from "@tanstack/react-router";
import Sections from "@/pages/Sections";
export const Route = createFileRoute("/_app/sections")({ component: Sections });
