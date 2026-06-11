import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  image: string;
  slug: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

const CART_KEY = 'sr12_cart';

const getKey = (productId: string, variantId?: string) => `${productId}::${variantId || ''}`;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Refs for realtime sync
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isRemoteUpdate = React.useRef(false);

  // Clear local cart when logged out
  useEffect(() => {
    if (!loading && !user) {
      setItems([]);
    }
  }, [user, loading]);

  // Sync with DB when logged in
  useEffect(() => {
    if (!user || isSyncing) return;
    
    const fetchAndSync = async () => {
      setIsSyncing(true);
      try {
        // Fetch latest user data to get metadata
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error || !currentUser) throw error;

        const remoteCart = currentUser.user_metadata?.cart as CartItem[] | undefined;
        
        // If local has items but remote is empty, sync local to remote
        if ((!remoteCart || remoteCart.length === 0) && items.length > 0) {
          await supabase.auth.updateUser({
            data: { cart: items }
          });
        } else if (remoteCart && remoteCart.length > 0) {
          // If remote has items, prefer remote items
          setItems(remoteCart);
        }
      } catch (err) {
        console.error('Error syncing cart:', err);
      } finally {
        setIsSyncing(false);
      }
    };
    
    fetchAndSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Setup Realtime Broadcast channel and Cross-tab local sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_KEY && e.newValue) {
        try {
          const newItems = JSON.parse(e.newValue);
          isRemoteUpdate.current = true;
          setItems(newItems);
        } catch (err) {
          // Ignore parse error
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    if (!user) return () => window.removeEventListener('storage', handleStorageChange);

    const channel = supabase.channel(`cart_sync_${user.id}`);
    channelRef.current = channel;
    
    channel.on('broadcast', { event: 'cart_updated' }, (payload) => {
      if (payload.payload && payload.payload.cart) {
        setItems(prevItems => {
          const newCartStr = JSON.stringify(payload.payload.cart);
          const oldCartStr = JSON.stringify(prevItems);
          if (newCartStr !== oldCartStr) {
            isRemoteUpdate.current = true;
            return payload.payload.cart;
          }
          return prevItems;
        });
      }
    }).subscribe();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user]);

  // Always update local storage as backup and broadcast changes
  useEffect(() => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return; // Skip DB update and broadcast if this update came from remote/storage
    }

    localStorage.setItem(CART_KEY, JSON.stringify(items));
    
    // Also sync to user metadata if logged in
    if (user && !isSyncing) {
      supabase.auth.updateUser({
        data: { cart: items }
      }).catch(err => console.error('Error updating remote cart:', err));

      // Broadcast to other browsers/devices
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cart_updated',
          payload: { cart: items }
        }).catch(err => console.error('Error broadcasting cart:', err));
      }
    }
  }, [items, user, isSyncing]);

  const addItem = useCallback(async (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => getKey(i.productId, i.variantId) === getKey(item.productId, item.variantId));
      let newItems;
      let finalQty = qty;
      
      if (idx >= 0) {
        newItems = [...prev];
        finalQty = Math.min(newItems[idx].quantity + qty, newItems[idx].stock);
        newItems[idx] = { ...newItems[idx], quantity: finalQty };
      } else {
        finalQty = Math.min(qty, item.stock);
        newItems = [...prev, { ...item, quantity: finalQty }];
      }
      
      return newItems;
    });
  }, []);

  const removeItem = useCallback(async (productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => getKey(i.productId, i.variantId) !== getKey(productId, variantId)));
  }, []);

  const updateQuantity = useCallback(async (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    
    setItems(prev => {
      return prev.map(i => {
        if (getKey(i.productId, i.variantId) === getKey(productId, variantId)) {
          return { ...i, quantity: Math.min(quantity, i.stock) };
        }
        return i;
      });
    });
  }, [removeItem]);

  const clearCart = useCallback(async () => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
