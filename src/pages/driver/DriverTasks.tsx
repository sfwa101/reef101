/**
 * DriverTasks — Phase 15 thin shell.
 *
 * After decomposition this page is purely an aggregator. All realtime,
 * FSM, GPS, and earnings logic live in `useDriverEngine`. Visuals live
 * in `src/features/driver/components/*`.
 *
 * Mobile-first: stack of full-width cards, generous spacing, no horizontal
 * scrolling. Surge banner is rendered above the feed only when relevant.
 */
import { useDriverEngine } from "@/features/driver/hooks/useDriverEngine";
import { ActiveTasksFeed } from "@/features/driver/components/ActiveTasksFeed";
import { DriverEarningsBar } from "@/features/driver/components/DriverEarningsBar";
import { DriverSurgeBanner } from "@/features/driver/components/DriverSurgeBanner";

export default function DriverTasks() {
  const engine = useDriverEngine();

  if (engine.loading) {
    return (
      <p className="text-center text-foreground-tertiary py-8">
        جاري التحميل…
      </p>
    );
  }

  if (!engine.driverId) {
    return (
      <p className="text-center text-foreground-tertiary py-8">
        حسابك غير مرتبط بمندوب نشط.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <DriverEarningsBar earnings={engine.earnings} />
      <DriverSurgeBanner zones={engine.surgeZones} />
      <ActiveTasksFeed
        tasks={engine.tasks}
        orders={engine.orders}
        busyTaskId={engine.busyTaskId}
        onFire={engine.fireEvent}
        onComplete={engine.completeDelivery}
      />
    </div>
  );
}
