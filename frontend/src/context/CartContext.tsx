import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  type CartItem,
  addCartItem,
  clearCartRequest,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../lib/cart";

interface AddToCartInput {
  productId: string;
  variantId?: string | null;
  quantity?: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  addItem: (input: AddToCartInput) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const EMPTY: { items: CartItem[]; item_count: number; subtotal: number } = {
  items: [],
  item_count: 0,
  subtotal: 0,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>(EMPTY.items);
  const [itemCount, setItemCount] = useState(EMPTY.item_count);
  const [subtotal, setSubtotal] = useState(EMPTY.subtotal);
  const [loading, setLoading] = useState(false);

  function applyCart(cart: { items: CartItem[]; item_count: number; subtotal: number }) {
    setItems(cart.items);
    setItemCount(cart.item_count);
    setSubtotal(cart.subtotal);
  }

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      applyCart(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const cart = await getCart();
      applyCart(cart);
    } catch {
      applyCart(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async ({ productId, variantId, quantity = 1 }: AddToCartInput) => {
      if (!isAuthenticated) return;
      const cart = await addCartItem({
        product_id: productId,
        variant_id: variantId ?? null,
        quantity,
      });
      applyCart(cart);
    },
    [isAuthenticated],
  );

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    const cart =
      quantity <= 0 ? await removeCartItem(itemId) : await updateCartItem(itemId, quantity);
    applyCart(cart);
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    const cart = await removeCartItem(itemId);
    applyCart(cart);
  }, []);

  const clearCart = useCallback(async () => {
    await clearCartRequest();
    applyCart(EMPTY);
  }, []);

  return (
    <CartContext.Provider
      value={{ items, itemCount, subtotal, loading, addItem, updateQuantity, removeItem, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
