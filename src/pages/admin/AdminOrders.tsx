import { useState, useEffect } from 'react';
import { Package, ChevronDown, Loader2, Truck, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Menunggu Pembayaran' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // For shipment editing
  const [editShipment, setEditShipment] = useState<Record<string, { courier: string; tracking_number: string }>>({});

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, profiles:user_id(full_name, phone), order_items(*, products:product_id(name), variants:variant_id(name)), payments(*), shipments(*), addresses:address_id(*)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { toast({ title: 'Gagal', description: error.message, variant: 'destructive' }); return; }

    // If cancelled, restore stock
    if (newStatus === 'cancelled') {
      const order = orders.find(o => o.id === orderId);
      if (order?.order_items) {
        for (const item of order.order_items) {
          if (item.variant_id) {
            await (supabase.rpc as any)('restore_variant_stock', { p_variant_id: item.variant_id, p_quantity: item.quantity });
          }
        }
      }
    }

    toast({ title: 'Status diperbarui' });
    fetchOrders();
  };

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
    // Also update order status to shipped
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    toast({ title: 'Pengiriman disimpan' });
    fetchOrders();
  };

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (search && !o.order_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Kelola Pesanan</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari no. pesanan..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          <option value="all">Semua Status</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Tidak ada pesanan ditemukan.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const isExpanded = expandedId === order.id;
            const statusColor = STATUS_COLORS[order.status] || 'bg-secondary text-foreground';
            const statusLabel = STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status;
            const shipment = order.shipments?.[0];
            const payment = order.payments?.[0];
            const address = order.addresses;
            const profile = order.profiles;

            return (
              <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-secondary/30 transition">
                  <Package className="h-5 w-5 text-primary/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium text-card-foreground">{order.order_number}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{profile?.full_name || 'Customer'} • {new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{formatPrice(Number(order.total))}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* Items */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Produk</h3>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span className="text-card-foreground">{item.products?.name} {item.variants?.name ? `(${item.variants.name})` : ''} x{item.quantity}</span>
                          <span className="text-foreground font-medium">{formatPrice(Number(item.total))}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address */}
                    {address && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Alamat</h3>
                        <p className="text-sm text-card-foreground">{address.recipient_name} - {address.phone}</p>
                        <p className="text-sm text-muted-foreground">{address.full_address}, {address.city}, {address.province}</p>
                      </div>
                    )}

                    {/* Payment */}
                    {payment && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Pembayaran</h3>
                        <p className="text-sm text-card-foreground">{payment.method}{payment.bank_name ? ` - ${payment.bank_name}` : ''} • {payment.status}</p>
                      </div>
                    )}

                    {/* Status update */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Ubah Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(s => (
                          <button key={s.value} onClick={() => updateStatus(order.id, s.value)} disabled={order.status === s.value}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${order.status === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shipment / Resi */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Pengiriman</h3>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input placeholder="Kurir (JNE, J&T, dll)" className="text-sm"
                          value={editShipment[order.id]?.courier ?? shipment?.courier ?? ''}
                          onChange={e => setEditShipment(p => ({ ...p, [order.id]: { ...p[order.id], courier: e.target.value, tracking_number: p[order.id]?.tracking_number ?? shipment?.tracking_number ?? '' } }))} />
                        <Input placeholder="Nomor Resi" className="text-sm"
                          value={editShipment[order.id]?.tracking_number ?? shipment?.tracking_number ?? ''}
                          onChange={e => setEditShipment(p => ({ ...p, [order.id]: { ...p[order.id], tracking_number: e.target.value, courier: p[order.id]?.courier ?? shipment?.courier ?? '' } }))} />
                        <Button size="sm" onClick={() => saveShipment(order.id)}>Simpan</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
