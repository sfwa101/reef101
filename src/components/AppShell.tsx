import { Outlet, useLocation } from "@tanstack/react-router";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import SectionsPanel from "@/components/desktop/SectionsPanel";
import CartPanel from "@/components/desktop/CartPanel";
import GlobalApprovalBanner from "@/components/GlobalApprovalBanner";

// Routes where the bottom TabBar should be HIDDEN to make room for a sticky CTA.
const HIDE_TABBAR_ROUTES = [
  "/store/recipes",
  "/product/", // any product detail
  "/cart",
];

const AppShell = () => {
  const { pathname } = useLocation();
  const hideTabBar = HIDE_TABBAR_ROUTES.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p
  );
  // Hide desktop cart panel on the cart page itself (avoid duplicate cart UI).
  const hideCartPanel = pathname === "/cart" || pathname === "/auth";

  return (
    <div className="relative min-h-screen [overflow-x:clip]">
      <TopBar />
      <div className="mx-auto flex w-full max-w-[1400px] gap-5 px-4 pt-[64px] lg:gap-6 lg:px-6 lg:pt-[80px]">
        <SectionsPanel />
        <main
          className={`mx-auto w-full max-w-md flex-1 sm:max-w-2xl md:max-w-4xl lg:mx-0 lg:max-w-none lg:min-w-0 ${hideTabBar ? "pb-[120px]" : "pb-28"} lg:pb-10`}
        >
          <Outlet />
        </main>
        {!hideCartPanel && <CartPanel />}
      </div>
      {!hideTabBar && <TabBar />}
    </div>
  );
};

export default AppShell;