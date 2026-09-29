import { api } from "./api";

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  available: boolean;
  name: string | null;
  material: string | null;
  color: string | null;
  image_url: string | null;
  unit_price: number | null;
  subtotal: number | null;
  stock_quantity: number | null;
}

export interface CartResponse {
  id: string | null;
  items: CartItem[];
  item_count: number;
  subtotal: number;
}

export async function getCart() {
  const { data } = await api.get<CartResponse>("/cart/");
  return data;
}

export async function addCartItem(payload: {
  product_id: string;
  variant_id?: string | null;
  quantity?: number;
}) {
  const { data } = await api.post<CartResponse>("/cart/items/", payload);
  return data;
}

export async function updateCartItem(itemId: string, quantity: number) {
  const { data } = await api.patch<CartResponse>(`/cart/items/${itemId}/`, { quantity });
  return data;
}

export async function removeCartItem(itemId: string) {
  const { data } = await api.delete<CartResponse>(`/cart/items/${itemId}/`);
  return data;
}

export async function clearCartRequest() {
  await api.delete("/cart/");
}
