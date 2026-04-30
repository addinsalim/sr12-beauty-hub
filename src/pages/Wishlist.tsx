import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const Wishlist = () => {
  const { user, loading: authLoading } = useAuth();
  const { productIds, toggle } = useWishlist();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || productIds.size === 0) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    supabase.from('products')
      .select('*, product_images(image_url, is_primary, sort_order), categories(slug)')
      .in('id', Array.from(productIds))
      .eq('is_active', true)
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, [user, productIds]);

  const getImg = (p: any) => {
    const sorted = [...(p.product_images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    return sorted[0]?.image_url || '/placeholder.svg';
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl text-foreground mb-2 flex items-center gap-2">
        <Heart className="h-6 w-6 text-rose-gold fill-rose-gold" /> Wishlist Saya
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{productIds.size} produk favorit</p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <Heart className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-4">Wishlist kamu masih kosong</p>
          <Link to="/products" className="inline-block rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => {
            const img = getImg(p);
            const finalPrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
            return (
              <div key={p.id} className="rounded-2xl glass overflow-hidden group">
                <Link to={`/products/${p.slug}`} className="block aspect-square overflow-hidden bg-secondary">
                  <img src={img} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
                </Link>
                <div className="p-3">
                  <Link to={`/products/${p.slug}`}>
                    <h3 className="text-sm font-medium line-clamp-2 mb-1 hover:text-primary">{p.name}</h3>
                  </Link>
                  <p className="text-base font-bold text-primary mb-3">{formatPrice(finalPrice)}</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        if (p.stock === 0) { toast.error('Stok habis'); return; }
                        addItem({ productId: p.id, name: p.name, price: finalPrice, image: img, slug: p.slug, stock: p.stock });
                        toast.success('Ditambahkan ke keranjang');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary text-primary-foreground text-xs py-2 hover:opacity-90"
                      disabled={p.stock === 0}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> {p.stock === 0 ? 'Habis' : 'Beli'}
                    </button>
                    <button
                      onClick={() => toggle(p.id)}
                      className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive hover:border-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
