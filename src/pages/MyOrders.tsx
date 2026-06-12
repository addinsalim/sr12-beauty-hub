import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Loader2, ShoppingBag, XCircle, AlertTriangle } from 'lucide-react';
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

// Status yang boleh dibatalkan oleh customer
const CANCELLABLE = ['pending_payment', 'processing'];

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  // Cancel dialog
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(id, product_id, variant_id, quantity)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [user]);

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);

  // ── Pembatalan oleh customer ──────────────────────────────────────────────
  const handleConfirmCancel = async () => {
    if (!cancelTarget || !user) return;
    setCancelling(true);
    try {
      // 1. Update status pesanan
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          notes: cancelReason
            ? `[Dibatalkan oleh customer] ${cancelReason}`
            : '[Dibatalkan oleh customer]',
        })
        .eq('id', cancelTarget.id)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      // 2. Kembalikan stok
      for (const item of cancelTarget.order_items || []) {
        if (item.variant_id) {
          await (supabase.rpc as any)('restore_variant_stock', {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity,
          });
        } else {
          await (supabase.rpc as any)('restore_product_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }

      // 3. Update status pembayaran
      await supabase.from('payments').update({ status: 'cancelled' }).eq('order_id', cancelTarget.id);

      // 4. Notifikasi ke diri sendiri
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Pesanan Dibatalkan',
        message: `Pesanan ${cancelTarget.order_number} berhasil dibatalkan.${cancelReason ? ` Alasan: ${cancelReason}` : ''}`,
        type: 'order',
      });

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === cancelTarget.id ? { ...o, status: 'cancelled' } : o
      ));
      setCancelTarget(null);
      setCancelReason('');
    } catch (err: any) {
      alert('Gagal membatalkan: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

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
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
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
              const canCancel = CANCELLABLE.includes(order.status);
              return (
                <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden transition hover:border-primary/30">
                  <Link to={`/orders/${order.id}`} className="flex items-center gap-3 p-4">
                    <Package className="h-8 w-8 shrink-0 text-primary/60" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
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

                  {/* Tombol batalkan */}
                  {canCancel && (
                    <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-secondary/20">
                      <p className="text-xs text-muted-foreground">Pesanan bisa dibatalkan</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelTarget(order);
                          setCancelReason('');
                        }}
                        className="flex items-center gap-1 text-xs text-destructive font-medium hover:underline"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Batalkan Pesanan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dialog Konfirmasi Pembatalan ── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Batalkan Pesanan?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Pesanan <span className="font-mono font-semibold text-foreground">{cancelTarget.order_number}</span> akan dibatalkan.
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Alasan pembatalan <span className="text-muted-foreground font-normal">(opsional)</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Contoh: Salah pesan, ingin ganti produk, dll."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>Batal</Button>
              <Button variant="destructive" onClick={handleConfirmCancel} disabled={cancelling}>
                {cancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
