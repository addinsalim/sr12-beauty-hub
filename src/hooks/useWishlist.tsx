import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WishlistContextType {
  productIds: Set<string>;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string, name?: string) => Promise<void>;
  refresh: () => Promise<void>;
  count: number;
}

const WishlistContext = createContext<WishlistContextType>({} as WishlistContextType);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setProductIds(new Set()); return; }
    setLoading(true);
    const { data } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id);
    setProductIds(new Set((data || []).map((d: any) => d.product_id)));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (productId: string, name?: string) => {
    if (!user) {
      toast.error('Login dulu untuk menambah ke wishlist');
      return;
    }
    if (productIds.has(productId)) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
      setProductIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
      toast.success('Dihapus dari wishlist');
    } else {
      const { error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      if (error) { toast.error(error.message); return; }
      setProductIds(prev => new Set(prev).add(productId));
      toast.success(name ? `${name} ditambahkan ke wishlist` : 'Ditambahkan ke wishlist');
    }
  };

  return (
    <WishlistContext.Provider value={{
      productIds, loading,
      isInWishlist: (id: string) => productIds.has(id),
      toggle, refresh, count: productIds.size,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
