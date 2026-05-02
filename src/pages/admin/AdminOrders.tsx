import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Package, ChevronDown, Loader2, Truck, Search, Printer,
  XCircle, X, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import OrderReceipt from '@/components/admin/OrderReceipt';

const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Menunggu Pembayaran' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editShipment, setEditShipment] = useState<Record<string, { courier: string; tracking_number: string }>>({});

  // Cancellation dialog
  const [cancelOrder, setCancelOrder] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Print
  const [printOrder, setPrintOrder] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, products:product_id(name), variants:variant_id(name)), payments(*), shipments(*), addresses:address_id(*)')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((o: any) => o.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      setOrders(data.map((o: any) => ({ ...o, profile: profileMap[o.user_id] || null })));
    } else {
      setOrders([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Search ────────────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const orderNum = (o.order_number || '').toLowerCase();
    const name = (o.profile?.full_name || '').toLowerCase();
    const phone = (o.profile?.phone || '').toLowerCase();
    const productNames = (o.order_items || [])
      .map((i: any) => (i.products?.name || '').toLowerCase())
      .join(' ');
    return orderNum.includes(q) || name.includes(q) || phone.includes(q) || productNames.includes(q);
  });

  // ── Status update ─────────────────────────────────────────────────────────
  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { toast({ title: 'Gagal', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Status diperbarui' });
    fetchOrders();
  };

  // ── Cancellation ──────────────────────────────────────────────────────────
  const handleConfirmCancel = async () => {
    if (!cancelOrder) return;
    setCancelling(true);

    // 1. Update order status
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', notes: cancelReason ? `[Dibatalkan] ${cancelReason}` : '[Dibatalkan oleh admin]' })
      .eq('id', cancelOrder.id);

    if (error) {
      toast({ title: 'Gagal membatalkan', description: error.message, variant: 'destructive' });
      setCancelling(false);
      return;
    }

    // 2. Restore stock
    for (const item of cancelOrder.order_items || []) {
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

    // 3. Update payment status
    if (cancelOrder.payments?.[0]) {
      await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('order_id', cancelOrder.id);
    }

    // 4. Send notification to customer
    await supabase.from('notifications').insert({
      user_id: cancelOrder.user_id,
      title: 'Pesanan Dibatalkan',
      message: `Pesanan ${cancelOrder.order_number} telah dibatalkan oleh admin.${cancelReason ? ` Alasan: ${cancelReason}` : ''}`,
      type: 'order',
    });

    toast({ title: '✓ Pesanan dibatalkan', description: `${cancelOrder.order_number} berhasil dibatalkan dan stok dikembalikan.` });
    setCancelOrder(null);
    setCancelReason('');
    setCancelling(false);
    fetchOrders();
  };

  // ── Shipment ──────────────────────────────────────────────────────────────
  const saveShipment = async (orderId: string) => {
    const s = editShipment[orderId];
    if (!s?.courier || !s?.tracking_number) {
      toast({ title: 'Lengkapi data', description: 'Kurir dan nomor resi wajib diisi.', variant: 'destructive' });
      return;
    }
    const existing = orders.find(o => o.id === orderId)?.shipments?.[0];
    if (existing) {
      await supabase.from('shipments').update({ courier: s.courier, tracking_number: s.tracking_number, status: 'shipped', shipped_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('shipments').insert({ order_id: orderId, courier: s.courier, tracking_number: s.tracking_number, status: 'shipped', shipped_at: new Date().toISOString() });
    }
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    toast({ title: 'Pengiriman disimpan' });
    fetchOrders();
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Kelola Pesanan</h1>

      {/* ── Filters / Search ── */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="admin-order-search"
            placeholder="Cari no. pesanan, nama pelanggan, produk..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="all">Semua Status</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* ── Result count ── */}
      {!loading && (
        <p className="text-xs text-muted-foreground mb-3">
          Menampilkan {filtered.length} dari {orders.length} pesanan
          {search && <span className="ml-1">untuk "<strong>{search}</strong>"</span>}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          {search ? `Tidak ada hasil untuk "${search}"` : 'Tidak ada pesanan ditemukan.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const isExpanded = expandedId === order.id;
            const statusColor = STATUS_COLORS[order.status] || 'bg-secondary text-foreground';
            const statusLabel = STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status;
            const shipment = order.shipments?.[0];
            const payment = order.payments?.[0];
            const address = order.addresses;
            const profile = order.profile;
            const isCancellable = !['cancelled', 'completed'].includes(order.status);

            return (
              <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="flex flex-1 items-center gap-3 p-4 text-left hover:bg-secondary/30 transition"
                  >
                    <Package className="h-5 w-5 text-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium text-card-foreground">{order.order_number}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile?.full_name || 'Customer'} • {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{formatPrice(Number(order.total))}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition ml-1 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Quick action buttons */}
                  <div className="flex items-center gap-1 px-2 border-l border-border">
                    <button
                      title="Cetak struk"
                      onClick={() => handlePrint(order)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    {isCancellable && (
                      <button
                        title="Batalkan pesanan"
                        onClick={() => { setCancelOrder(order); setCancelReason(''); }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* Items */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Produk</h3>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span className="text-card-foreground">
                            {item.products?.name} {item.variants?.name ? `(${item.variants.name})` : ''} x{item.quantity}
                          </span>
                          <span className="text-foreground font-medium">{formatPrice(Number(item.total))}</span>
                        </div>
                      ))}
                      <div className="border-t border-border mt-2 pt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Ongkos Kirim</span>
                          <span>{Number(order.shipping_cost) === 0 ? 'GRATIS' : formatPrice(Number(order.shipping_cost))}</span>
                        </div>
                        {order.discount_amount > 0 && (
                          <div className="flex justify-between text-xs text-green-600">
                            <span>Diskon</span><span>-{formatPrice(Number(order.discount_amount))}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                          <span>Total</span><span className="text-primary">{formatPrice(Number(order.total))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    {address && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Alamat Pengiriman</h3>
                        <p className="text-sm text-card-foreground">{address.recipient_name} - {address.phone}</p>
                        <p className="text-sm text-muted-foreground">{address.full_address}, {address.city}, {address.province}</p>
                      </div>
                    )}

                    {/* Payment */}
                    {payment && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Pembayaran</h3>
                        <p className="text-sm text-card-foreground">
                          {payment.method}{payment.bank_name ? ` - ${payment.bank_name}` : ''} • {payment.status}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Catatan</h3>
                        <p className="text-sm text-card-foreground">{order.notes}</p>
                      </div>
                    )}

                    {/* Status update */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Ubah Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.filter(s => s.value !== 'cancelled').map(s => (
                          <button
                            key={s.value}
                            onClick={() => updateStatus(order.id, s.value)}
                            disabled={order.status === s.value || order.status === 'cancelled'}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${order.status === s.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shipment */}
                    {order.status !== 'cancelled' && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5" /> Pengiriman
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            placeholder="Kurir (JNE, J&T, dll)"
                            className="text-sm"
                            value={editShipment[order.id]?.courier ?? shipment?.courier ?? ''}
                            onChange={e => setEditShipment(p => ({ ...p, [order.id]: { ...p[order.id], courier: e.target.value, tracking_number: p[order.id]?.tracking_number ?? shipment?.tracking_number ?? '' } }))}
                          />
                          <Input
                            placeholder="Nomor Resi"
                            className="text-sm"
                            value={editShipment[order.id]?.tracking_number ?? shipment?.tracking_number ?? ''}
                            onChange={e => setEditShipment(p => ({ ...p, [order.id]: { ...p[order.id], tracking_number: e.target.value, courier: p[order.id]?.courier ?? shipment?.courier ?? '' } }))}
                          />
                          <Button size="sm" onClick={() => saveShipment(order.id)}>Simpan</Button>
                        </div>
                      </div>
                    )}

                    {/* Print & Cancel buttons in expanded view */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="outline" onClick={() => handlePrint(order)}>
                        <Printer className="h-3.5 w-3.5 mr-1.5" /> Cetak Struk
                      </Button>
                      {isCancellable && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setCancelOrder(order); setCancelReason(''); }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1.5" /> Batalkan Pesanan
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cancellation Dialog ── */}
      {cancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Batalkan Pesanan?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Pesanan <span className="font-mono font-semibold text-foreground">{cancelOrder.order_number}</span> akan dibatalkan.
                  Stok produk akan dikembalikan dan customer akan mendapat notifikasi.
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
                placeholder="Contoh: Stok habis, permintaan pelanggan, dll."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCancelOrder(null)} disabled={cancelling}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel} disabled={cancelling}>
                {cancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Ya, Batalkan Pesanan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden receipt for printing ── */}
      <OrderReceipt ref={receiptRef} order={printOrder} />
    </div>
  );
};

export default AdminOrders;
