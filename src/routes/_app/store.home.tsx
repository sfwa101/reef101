import { createFileRoute } from "@tanstack/react-router";
import HomeGoods from "@/pages/store/HomeGoods";

export const Route = createFileRoute("/_app/store/home")({
  component: HomeGoods,
});
