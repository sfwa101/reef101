import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/Home";

// Root `/` serves the Main Super App Dashboard (department hub).
// The Home Goods storefront lives at /store/home (HomeGoods.tsx).
export const Route = createFileRoute("/_app/")({
  component: HomePage,
});
