export type VendorProduct = {
  id: string;
  vendor_id: string | null;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  image: string | null;
  category: string;
};

export type VendorLiveOrderItem = {
  id: string;                 // order_items.id
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  created_at: string;
  // joined from orders
  order_status: string;
  service_type: string;
  payment_method: string | null;
  // local-only (not persisted server-side; no schema changes allowed)
  ready: boolean;
};
