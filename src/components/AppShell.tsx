import { Outlet, useLocation } from "@tanstack/react-router";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";

// Routes where the bottom TabBar should be HIDDEN to make room for a sticky CTA.
const HIDE_TABBAR_ROUTES = [
  "/store/recipes",
  "/product/", // any product detail
];

const AppShell = () => {
  const { pathname } = useLocation();
  const hideTabBar = HIDE_TABBAR_ROUTES.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <TopBar />
      <main
        className={`mx-auto max-w-md px-4 pt-[72px] ${hideTabBar ? "pb-[120px]" : "pb-28"}`}
      >
        <Outlet />
      </main>
      {!hideTabBar && <TabBar />}
    </div>
  );
};

export default AppShell;