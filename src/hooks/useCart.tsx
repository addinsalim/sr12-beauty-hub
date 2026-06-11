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
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync with DB when logged in
  useEffect(() => {
    if (!user || isSyncing) return;
    
    const fetchAndSync = async () => {
      setIsSyncing(true);
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            product_id,
            variant_id,
            products (id, name, slug, price, stock, product_images (image_url, is_primary)),
            variants (id, name, price, stock)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        // If local has items but DB is empty, sync local to DB
        if (data.length === 0 && items.length > 0) {
          const toInsert = items.map(item => ({
            user_id: user.id,
            product_id: item.productId,
            variant_id: item.variantId || null,
            quantity: item.quantity
          }));
          await supabase.from('cart_items').insert(toInsert);
        } else if (data.length > 0) {
          // If DB has items, prefer DB items
          const dbItems: CartItem[] = data.map((d: any) => {
            const product = Array.isArray(d.products) ? d.products[0] : d.products;
            const variant = Array.isArray(d.variants) ? d.variants[0] : d.variants;
            
            let imageUrl = '';
            if (product?.product_images && product.product_images.length > 0) {
               const primary = product.product_images.find((img: any) => img.is_primary);
               imageUrl = primary ? primary.image_url : product.product_images[0].image_url;
            }

            return {
              productId: d.product_id,
              variantId: d.variant_id || undefined,
              name: product?.name || 'Unknown',
              slug: product?.slug || '',
              price: variant?.price || product?.price || 0,
              stock: variant?.stock || product?.stock || 0,
              image: imageUrl,
              quantity: d.quantity,
              variantName: variant?.name
            };
          });
          setItems(dbItems);
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

  // Always update local storage as backup
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

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
      
      if (user) {
        // Optimistic UI, fire API in background
        supabase.from('cart_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', item.productId)
          .is('variant_id', item.variantId || null)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              supabase.from('cart_items')
                .update({ quantity: finalQty, updated_at: new Date().toISOString() })
                .eq('id', data.id)
                .then();
            } else {
              supabase.from('cart_items')
                .insert({
                  user_id: user.id,
                  product_id: item.productId,
                  variant_id: item.variantId || null,
                  quantity: finalQty
                })
                .then();
            }
          });
      }
      
      return newItems;
    });
  }, [user]);

  const removeItem = useCallback(async (productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => getKey(i.productId, i.variantId) !== getKey(productId, variantId)));
    
    if (user) {
      let query = supabase.from('cart_items').delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
        
      if (variantId) {
        query = query.eq('variant_id', variantId);
      } else {
        query = query.is('variant_id', null);
      }
      query.then();
    }
  }, [user]);

  const updateQuantity = useCallback(async (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    
    setItems(prev => {
      let finalQty = quantity;
      const newItems = prev.map(i => {
        if (getKey(i.productId, i.variantId) === getKey(productId, variantId)) {
          finalQty = Math.min(quantity, i.stock);
          return { ...i, quantity: finalQty };
        }
        return i;
      });
      
      if (user) {
        let query = supabase.from('cart_items').update({ quantity: finalQty })
          .eq('user_id', user.id)
          .eq('product_id', productId);
          
        if (variantId) {
          query = query.eq('variant_id', variantId);
        } else {
          query = query.is('variant_id', null);
        }
        query.then();
      }
      
      return newItems;
    });
  }, [removeItem, user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) {
      supabase.from('cart_items').delete().eq('user_id', user.id).then();
    }
  }, [user]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
