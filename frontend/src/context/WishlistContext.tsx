import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { addToWishlist, listWishlist, removeFromWishlist } from "../lib/wishlist";
import type { Product } from "../lib/products";

interface WishlistContextValue {
  items: Product[];
  ids: Set<string>;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await listWishlist();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ids = useMemo(() => new Set(items.map((p) => p.id)), [items]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!isAuthenticated) return;

      if (ids.has(product.id)) {
        setItems((prev) => prev.filter((p) => p.id !== product.id));
        try {
          await removeFromWishlist(product.id);
        } catch {
          await refresh();
        }
      } else {
        setItems((prev) => [...prev, product]);
        try {
          await addToWishlist(product.id);
        } catch {
          await refresh();
        }
      }
    },
    [ids, isAuthenticated, refresh],
  );

  return (
    <WishlistContext.Provider value={{ items, ids, loading, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
