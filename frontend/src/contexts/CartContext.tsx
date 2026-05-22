import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url?: string | null;
  category_name?: string | null;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

interface CartContextData {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: number) => number;
}

const STORAGE_KEY = 'pipocalizando_cart';

const CartContext = createContext<CartContextData | undefined>(undefined);

const sanitizeItems = (items: any[]): CartItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      id: Number(item?.id),
      name: String(item?.name || ''),
      price: Number(item?.price || 0),
      stock: Number(item?.stock || 0),
      image_url: item?.image_url || null,
      category_name: item?.category_name || null,
      quantity: Number(item?.quantity || 0),
    }))
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.quantity > 0 && item.name);
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
      return sanitizeItems(JSON.parse(stored));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const getItemQuantity = (productId: number) =>
    items.find((item) => item.id === productId)?.quantity || 0;

  const addItem = (product: CartProduct, quantity = 1) => {
    if (quantity <= 0 || product.stock <= 0) return;

    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (!existing) {
        const nextQuantity = Math.min(quantity, product.stock);
        return [...current, { ...product, quantity: nextQuantity }];
      }

      const nextQuantity = existing.quantity + quantity;
      const stockLimit = product.stock;
      return current.map((item) =>
        item.id === product.id
          ? { ...item, quantity: Math.min(nextQuantity, stockLimit) }
          : item
      );
    });
  };

  const removeItem = (productId: number) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.id !== productId) return item;
        const stockLimit = item.stock > 0 ? item.stock : quantity;
        return { ...item, quantity: Math.min(quantity, stockLimit) };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * Number(item.price || 0), 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
