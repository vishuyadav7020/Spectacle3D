import { api } from "./api";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "printing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  product_id: string;
  variant_id: string | null;
  name: string;
  material: string;
  color?: string | null;
  image_url?: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  street: string;
  apt?: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  shipping_method: "standard" | "express";
  subtotal: number;
  coupon_id: string | null;
  coupon_code: string | null;
  discount_amount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  card_last4: string;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  count: number;
  page: number;
  page_size: number;
  results: Order[];
}

export interface CreateOrderPayload {
  items: { product_id: string; variant_id?: string | null; quantity: number }[];
  shipping_address: ShippingAddress;
  shipping_method: "standard" | "express";
  card_last4?: string;
  coupon_code?: string | null;
}

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await api.post<Order>("/orders/", payload);
  return data;
}

export async function listMyOrders(params: { page?: number; page_size?: number } = {}) {
  const { data } = await api.get<OrderListResponse>("/orders/", { params });
  return data;
}

export async function getOrder(orderId: string) {
  const { data } = await api.get<Order>(`/orders/${orderId}/`);
  return data;
}

export async function listAllOrders(params: { status?: string; page?: number; page_size?: number } = {}) {
  const { data } = await api.get<OrderListResponse>("/orders/admin/", { params });
  return data;
}

export async function updateOrderStatus(orderId: string, orderStatus: OrderStatus) {
  const { data } = await api.patch<Order>(`/orders/admin/${orderId}/`, { status: orderStatus });
  return data;
}
