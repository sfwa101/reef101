/**
 * Driver domain — types.
 *
 * Keep this file pure (no React, no runtime) so it can be imported by
 * hooks, components, and server fns without dragging UI deps.
 */

/**
 * Task lifecycle (matches DB `delivery_tasks.status`):
 *
 *   pending → out_for_delivery → arrived → delivered
 *
 * Cancellations and exceptions are out-of-scope for the driver surface —
 * we only model the happy path here.
 */
export type TaskStatus =
  | "pending"
  | "out_for_delivery"
  | "arrived"
  | "delivered";

export type DriverEvent = "out_for_delivery" | "arrived" | "location_ping";

export type ServiceType = "express" | "standard" | string;

/** A row from `delivery_tasks` shaped for the driver UI. */
export type DriverTask = {
  id: string;
  order_id: string;
  status: TaskStatus;
  service_type: ServiceType;
  delivery_zone: string | null;
  customer_barcode: string | null;
  cod_amount: number;
  commission_amount: number;
  driver_lat: number | null;
  driver_lng: number | null;
};

/** Joined customer/order info, derived from `orders` + `profiles`. */
export type OrderInfo = {
  id: string;
  total: number;
  user_id: string;
  phone?: string | null;
  full_name?: string | null;
  address?: string | null;
};

/** Operational signal sourced from `geo_zones` for surge highlighting. */
export type SurgeZone = {
  zone_code: string;
  name: string;
  current_load_factor: number;
  surge_active: boolean;
};

/** Today-in-shift earnings, derived locally from active task list. */
export type DriverEarnings = {
  /** Tasks delivered today (count). */
  deliveredToday: number;
  /** Tasks currently active (pending / OFD / arrived). */
  activeCount: number;
  /** Sum of commission_amount across active tasks (forecast). */
  forecastEgp: number;
  /** Sum of cod_amount across active tasks (cash-in-hand on success). */
  codInHandEgp: number;
};

export type GpsFix = { lat: number; lng: number } | null;
