export interface CartItem {
  key: string; // productId + variantId, unique per line item
  productId: string;
  variantId: string | null;
  name: string;
  imageUrl?: string;
  material: string;
  color?: string;
  price: number;
  quantity: number;
}

const STORAGE_KEY = "spectacle3d_cart";

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
