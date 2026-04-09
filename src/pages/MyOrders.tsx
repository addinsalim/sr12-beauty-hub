import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Diproses', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
};

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending_payment', label: 'Menunggu' },
  { id: 'processing', label: 'Diproses' },
  { id: 'shipped', label: 'Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
];

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const query = supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    query.then(({ data }) => {
      setOrders(data || []);
      setLoading(false);
    });
  }, [user]);

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);

  if (authLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link><span>/</span>
          <span className="text-foreground">Pesanan Saya</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-3xl">
        <h1 className="mb-5 font-display text-2xl font-bold text-foreground">Pesanan Saya</h1>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">Belum ada pesanan.</p>
            <Button asChild><Link to="/products">Belanja Sekarang</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const s = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-secondary text-foreground' };
              return (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                  <Package className="h-8 w-8 shrink-0 text-primary/60" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-sm font-medium text-card-foreground">{order.order_number}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{formatPrice(Number(order.total))}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
