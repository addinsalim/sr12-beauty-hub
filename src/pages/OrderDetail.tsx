import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Printer, Download, Loader2, Clock } from 'lucide-react';
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

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [address, setAddress] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);
      const [orderRes, itemsRes, paymentRes, shipmentRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).single(),
        supabase.from('order_items').select('*, products:product_id(name, slug), variants:variant_id(name)').eq('order_id', id),
        supabase.from('payments').select('*').eq('order_id', id).maybeSingle(),
        supabase.from('shipments').select('*').eq('order_id', id).maybeSingle(),
      ]);
      if (orderRes.data) {
        setOrder(orderRes.data);
        if (orderRes.data.address_id) {
          const { data: addr } = await supabase.from('addresses').select('*').eq('id', orderRes.data.address_id).single();
          setAddress(addr);
        }
      }
      setItems(itemsRes.data || []);
      setPayment(paymentRes.data);
      setShipment(shipmentRes.data);
      setLoading(false);
    };
    load();
  }, [id, user]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Pesanan tidak ditemukan.</p><Link to="/my-orders" className="mt-4 inline-flex items-center gap-2 text-primary"><ArrowLeft className="h-4 w-4" /> Kembali</Link></div>;

  const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-secondary text-foreground' };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link><span>/</span>
          <Link to="/my-orders" className="hover:text-primary">Pesanan Saya</Link><span>/</span>
          <span className="text-foreground">{order.order_number}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/my-orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-1 h-4 w-4" /> Cetak</Button>
        </div>

        <div ref={invoiceRef} className="space-y-5 print:space-y-3">
          {/* Header */}
          <div className="rounded-xl border border-border bg-card p-5 print:border-0 print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold text-card-foreground">Invoice</h1>
                <p className="text-sm text-muted-foreground mt-1">No. Pesanan: <span className="font-mono font-medium text-foreground">{order.order_number}</span></p>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
              <span className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-border bg-card p-5 print:border-0 print:p-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-card-foreground mb-3"><Package className="h-4 w-4 text-primary" /> Produk</h2>
            <div className="space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-card-foreground">{item.products?.name || 'Produk'}</p>
                    {item.variants?.name && <p className="text-xs text-muted-foreground">{item.variants.name}</p>}
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <span className="font-medium text-foreground">{formatPrice(Number(item.total))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          {address && (
            <div className="rounded-xl border border-border bg-card p-5 print:border-0 print:p-0">
              <h2 className="flex items-center gap-2 text-base font-bold text-card-foreground mb-2"><MapPin className="h-4 w-4 text-primary" /> Alamat Pengiriman</h2>
              <p className="text-sm font-medium text-card-foreground">{address.recipient_name}</p>
              <p className="text-sm text-muted-foreground">{address.phone}</p>
              <p className="text-sm text-muted-foreground">{address.full_address}, {address.city}, {address.province} {address.postal_code}</p>
            </div>
          )}

          {/* Payment */}
          {payment && (
            <div className="rounded-xl border border-border bg-card p-5 print:border-0 print:p-0">
              <h2 className="flex items-center gap-2 text-base font-bold text-card-foreground mb-2"><CreditCard className="h-4 w-4 text-primary" /> Pembayaran</h2>
              <p className="text-sm text-muted-foreground">Metode: <span className="text-foreground font-medium">{payment.method}{payment.bank_name ? ` - ${payment.bank_name}` : ''}</span></p>
              <p className="text-sm text-muted-foreground">Status: <span className="text-foreground font-medium">{payment.status === 'confirmed' ? 'Dikonfirmasi' : payment.status === 'pending' ? 'Menunggu' : payment.status}</span></p>
              {order.status === 'pending_payment' && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-700">
                  <Clock className="h-4 w-4" /> Batas waktu pembayaran 24 jam sejak pesanan dibuat.
                </div>
              )}
            </div>
          )}

          {/* Shipment */}
          {shipment && (
            <div className="rounded-xl border border-border bg-card p-5 print:border-0 print:p-0">
              <h2 className="flex items-center gap-2 text-base font-bold text-card-foreground mb-2"><Truck className="h-4 w-4 text-primary" /> Pengiriman</h2>
              <p className="text-sm text-muted-foreground">Kurir: <span className="text-foreground font-medium">{shipment.courier}</span></p>
              {shipment.tracking_number && <p className="text-sm text-muted-foreground">No. Resi: <span className="font-mono text-foreground font-medium">{shipment.tracking_number}</span></p>}
              <p className="text-sm text-muted-foreground">Status: <span className="text-foreground font-medium">{shipment.status}</span></p>
            </div>
          )}

          {/* Totals */}
          <div className="rounded-xl border border-border bg-card p-5 print:border-0 print:p-0">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-foreground">{formatPrice(Number(order.subtotal))}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Ongkos Kirim</span><span className="text-foreground">{formatPrice(Number(order.shipping_cost))}</span></div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-base font-bold">
                <span className="text-card-foreground">Total</span>
                <span className="text-primary">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
