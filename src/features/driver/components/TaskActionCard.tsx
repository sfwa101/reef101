/**
 * TaskActionCard — single delivery task tile with FSM advance buttons.
 *
 * Mobile-first contract:
 *   - All primary actions are full-width, ≥ 48px tall (large tap target)
 *   - High contrast on the active CTA (depends on FSM state)
 *   - Quick-access call / WhatsApp / "my location" row
 *
 * Pure presentational: receives the engine actions via props so the
 * card itself is trivially testable.
 */
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ScanLine,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  DriverEvent,
  DriverTask,
  OrderInfo,
} from "../types/driver.types";

export const TaskActionCard = ({
  task,
  order,
  busy,
  onFire,
  onComplete,
}: {
  task: DriverTask;
  order: OrderInfo | undefined;
  busy: boolean;
  onFire: (taskId: string, ev: DriverEvent) => void;
  onComplete: (task: DriverTask) => void;
}) => {
  const phone = order?.phone ?? null;
  const inSurge = task.service_type === "express";

  return (
    <Card
      className={`overflow-hidden ${inSurge ? "ring-2 ring-amber-400/60" : ""}`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-[15px] font-bold">
              {order?.full_name ?? "عميل"}
            </p>
            <p
              className="text-[12px] text-foreground-tertiary tabular-nums"
              dir="ltr"
            >
              #{task.order_id.slice(0, 8)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={inSurge ? "destructive" : "secondary"}>
              {inSurge ? "سريع" : "عادي"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {task.status}
            </Badge>
          </div>
        </div>

        {/* Money / zone chips */}
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className="bg-muted rounded-md px-2 py-1">
            المبلغ: {order?.total ?? 0} ج.م
          </span>
          {task.cod_amount > 0 && (
            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md px-2 py-1 font-bold">
              COD: {task.cod_amount}
            </span>
          )}
          {task.commission_amount > 0 && (
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md px-2 py-1 font-bold">
              عمولة: {task.commission_amount} ج.م
            </span>
          )}
          {task.delivery_zone && (
            <span className="bg-muted rounded-md px-2 py-1">
              {task.delivery_zone}
            </span>
          )}
        </div>

        {/* Quick contact row — large tap targets */}
        <div className="grid grid-cols-3 gap-2">
          {phone && (
            <>
              <Button size="sm" variant="outline" className="h-11" asChild>
                <a href={`tel:${phone}`}>
                  <Phone className="h-4 w-4 ml-1" />
                  اتصال
                </a>
              </Button>
              <Button size="sm" variant="outline" className="h-11" asChild>
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4 ml-1" />
                  واتساب
                </a>
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-11"
            disabled={busy}
            onClick={() => onFire(task.id, "location_ping")}
          >
            <Navigation className="h-4 w-4 ml-1" />
            موقعي
          </Button>
        </div>

        {/* Primary FSM action — single full-width CTA matching state */}
        <div>
          {task.status === "pending" && (
            <Button
              className="w-full h-12 text-[14px] font-extrabold"
              disabled={busy}
              onClick={() => onFire(task.id, "out_for_delivery")}
            >
              خرجت للتوصيل
            </Button>
          )}
          {task.status === "out_for_delivery" && (
            <Button
              className="w-full h-12 text-[14px] font-extrabold"
              variant="secondary"
              disabled={busy}
              onClick={() => onFire(task.id, "arrived")}
            >
              <MapPin className="h-4 w-4 ml-1" />
              وصلت للعميل
            </Button>
          )}
          {(task.status === "arrived" ||
            task.status === "out_for_delivery") && (
            <Button
              className="mt-2 w-full h-12 text-[14px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={busy}
              onClick={() => onComplete(task)}
            >
              {task.customer_barcode ? (
                <ScanLine className="h-4 w-4 ml-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 ml-1" />
              )}
              تأكيد التسليم
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
