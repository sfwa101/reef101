import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/account")({
  component: AccountLayout,
});

function AccountLayout() {
  return <Outlet />;
}