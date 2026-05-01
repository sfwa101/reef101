/**
 * ActiveTasksFeed — renders the driver's currently-active task list.
 *
 * Empty state is purposely calm — drivers shouldn't feel bad when idle.
 */
import { Inbox } from "lucide-react";
import type {
  DriverEvent,
  DriverTask,
  OrderInfo,
} from "../types/driver.types";
import { TaskActionCard } from "./TaskActionCard";

export const ActiveTasksFeed = ({
  tasks,
  orders,
  busyTaskId,
  onFire,
  onComplete,
}: {
  tasks: DriverTask[];
  orders: Record<string, OrderInfo>;
  busyTaskId: string | null;
  onFire: (taskId: string, ev: DriverEvent) => void;
  onComplete: (task: DriverTask) => void;
}) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Inbox className="h-10 w-10 text-foreground-tertiary" />
        <p className="text-[14px] font-bold text-foreground-tertiary">
          لا توجد مهام نشطة الآن
        </p>
        <p className="text-[11px] text-foreground-tertiary">
          سيتم إشعارك فور وصول طلب جديد.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <TaskActionCard
          key={t.id}
          task={t}
          order={orders[t.order_id]}
          busy={busyTaskId === t.id}
          onFire={onFire}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
};
