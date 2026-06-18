import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const RecentlyViewed = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rv } = await supabase
      .from('recently_viewed').select('product_id, viewed_at')
      .eq('user_id', user.id).order('viewed_at', { ascending: false }).limit(30);
    if (!rv?.length) { setItems([]); setLoading(false); return; }
    const ids = rv.map(r => r.product_id);
    const { data: products } = await supabase
      .from('products').select('*, product_images(image_url, is_primary)')
      .in('id', ids).eq('is_active', true);
    // preserve order from rv
    const map = new Map((products || []).map((p: any) => [p.id, p]));
    const ordered = rv.map(r => map.get(r.product_id)).filter(Boolean);
    setItems(ordered);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const clearAll = async () => {
    await supabase.from('recently_viewed').delete().eq('user_id', user!.id);
    setItems([]);
    toast.success('Riwayat dibersihkan');
  };

  const getImg = (p: any) => {
    const sorted = [...(p.product_images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    return sorted[0]?.image_url || '/placeholder.svg';
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> Terakhir Dilihat
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} produk</p>
        </div>
        {items.length > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-destructive hover:underline">
            <Trash2 className="h-4 w-4" /> Bersihkan
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-60 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <History className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Belum ada produk yang kamu lihat</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p: any) => {
            const finalPrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
            return (
              <Link key={p.id} to={`/products/${p.slug}`} className="rounded-2xl glass overflow-hidden group block">
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img src={getImg(p)} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2 mb-1">{p.name}</h3>
                  <p className="text-base font-bold text-primary">{formatPrice(finalPrice)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewed;
