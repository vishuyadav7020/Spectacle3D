import { api } from "./api";
import type { Product } from "./products";

export async function listWishlist() {
  const { data } = await api.get<Product[]>("/users/me/wishlist/");
  return data;
}

export async function addToWishlist(productId: string) {
  await api.post(`/users/me/wishlist/${productId}/`);
}

export async function removeFromWishlist(productId: string) {
  await api.delete(`/users/me/wishlist/${productId}/`);
}
