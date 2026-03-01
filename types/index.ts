export type DeliveryMethod = "delivery" | "pickup";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  badge: string | null;
  meta: string | null;
  active: boolean;
  sort_order: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutFormData {
  // Billing / Delivery
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
  delivery_method: DeliveryMethod;
  // Neighbour (home delivery only)
  neighbour_name: string;
  neighbour_address: string;
  // Card
  card_number: string;
  card_expiry: string;
  card_cvv: string;
  card_name: string;
  // Other
  notes: string;
  marketing_optin: boolean;
  terms_accepted: boolean;
}

export type OrderStatus =
  | "pending"
  | "payment_authorized"
  | "payment_captured"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "preauthorized"
  | "captured"
  | "voided"
  | "failed";

export interface Order {
  id: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  blink_transaction_id: string | null;
  blink_preauth_id: string | null;
  payment_status: PaymentStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  neighbour_name: string | null;
  neighbour_address: string | null;
  notes: string | null;
  marketing_optin: boolean;
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  product?: Product;
}
