import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Loader2, Clock, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import productParfum from '@/assets/product-parfum.webp';
import productSkincare from '@/assets/product-skincare.webp';
import productKosmetik from '@/assets/product-kosmetik.webp';

const categoryImages: Record<string, string> = {
  parfum: productParfum,
  skincare: productSkincare,
  kosmetik: productKosmetik,
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Diproses', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
};

// Hanya status ini yang bisa dibatalkan oleh customer
const CANCELLABLE_STATUSES = ['pending_payment', 'processing'];

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [address, setAddress] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingSnap, setPayingSnap] = useState(false);
  const snapScriptLoaded = useRef(false);

  // Cancellation state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);
      const [orderRes, itemsRes, paymentRes, shipmentRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).single(),
        supabase.from('order_items').select('*, products:product_id(name, slug, product_images(image_url, is_primary), categories(slug)), variants:variant_id(name)').eq('order_id', id),
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


  // Load Midtrans Snap.js jika belum
  useEffect(() => {
    if (snapScriptLoaded.current) return;
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    const snapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
    const script = document.createElement('script');
    script.src = snapUrl;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    document.head.appendChild(script);
    snapScriptLoaded.current = true;
  }, []);

  const handleContinuePayment = async () => {
    if (!order) return;
    setPayingSnap(true);
    try {
      const res = await supabase.functions.invoke('create-payment', {
        body: { order_id: order.id },
      });
      if (res.error) throw new Error(res.error.message);
      const { snap_token } = res.data;
      if (!snap_token) throw new Error('Gagal mendapatkan token pembayaran');
      if (!window.snap) {
        toast({ title: 'Snap belum siap', description: 'Refresh halaman dan coba lagi.', variant: 'destructive' });
        return;
      }
      window.snap.pay(snap_token, {
        onSuccess: async () => {
          toast({ title: '✅ Pembayaran berhasil!', description: 'Halaman invoice Anda sedang diperbarui...' });
          setOrder((prev: any) => ({ ...prev, status: 'processing' }));
          setPayment((prev: any) => ({ ...prev, status: 'confirmed' }));
          // Direct update to DB so the status instantly changes to Diproses
          try {
            await supabase.from('orders').update({ status: 'processing' }).eq('id', order.id);
            await supabase.from('payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('order_id', order.id);
          } catch (err) {
            console.error('Error updating order/payment status:', err);
          }
        },
        onPending: () => {
          toast({ title: '⏳ Menunggu pembayaran', description: 'Cek status di Pesanan Saya.' });
          setTimeout(() => navigate('/my-orders', { replace: true }), 1500);
        },
        onError: () => {
          toast({ title: 'Pembayaran gagal', description: 'Silakan coba lagi.', variant: 'destructive' });
        },
        onClose: () => {
          toast({ title: 'Popup ditutup', description: 'Anda masih bisa lanjutkan pembayaran di sini.' });
        },
      });
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally {
      setPayingSnap(false);
    }
  };

  // ── Pembatalan oleh customer ──────────────────────────────────────────────
  const handleCancelOrder = async () => {
    if (!order || !user) return;
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
        .eq('id', order.id)
        .eq('user_id', user.id); // pastikan hanya milik user ini

      if (error) throw new Error(error.message);

      // 2. Kembalikan stok
      for (const item of items) {
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
      if (payment) {
        await supabase.from('payments').update({ status: 'cancelled' }).eq('order_id', order.id);
      }

      // 4. Notifikasi diri sendiri
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Pesanan Dibatalkan',
        message: `Pesanan ${order.order_number} berhasil dibatalkan.${cancelReason ? ` Alasan: ${cancelReason}` : ''}`,
        type: 'order',
      });

      toast({ title: '✓ Pesanan dibatalkan', description: `${order.order_number} telah dibatalkan.` });
      setOrder((prev: any) => ({ ...prev, status: 'cancelled' }));
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (err: any) {
      toast({ title: 'Gagal membatalkan', description: err.message, variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Pesanan tidak ditemukan.</p><Link to="/my-orders" className="mt-4 inline-flex items-center gap-2 text-primary"><ArrowLeft className="h-4 w-4" /> Kembali</Link></div>;

  const getProductImg = (item: any) => {
    const images = item.products?.product_images || [];
    const primary = images.find((i: any) => i.is_primary)?.image_url;
    const fallback = categoryImages[item.products?.categories?.slug] || productParfum;
    return primary || images[0]?.image_url || fallback;
  };

  const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-secondary text-foreground' };
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground overflow-hidden">
          <Link to="/" className="hover:text-primary whitespace-nowrap shrink-0">Home</Link>
          <span className="text-border shrink-0">/</span>
          <Link to="/my-orders" className="hover:text-primary whitespace-nowrap shrink-0">Pesanan Saya</Link>
          <span className="text-border shrink-0">/</span>
          <span className="text-foreground font-medium truncate">{order.order_number}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-3xl">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <Link to="/my-orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/40 hover:bg-destructive/10 w-full sm:w-auto justify-center"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Batalkan Pesanan
            </Button>
          )}
        </div>

        <div className="space-y-5">
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
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 print:border-0 print:p-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-card-foreground mb-3"><Package className="h-4 w-4 text-primary" /> Produk</h2>
            <div className="space-y-3">
              {items.map((item: any) => {
                const img = getProductImg(item);
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                    <img src={img} alt={item.products?.name} className="h-14 w-14 rounded-lg object-cover bg-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.products?.slug}`} className="text-sm font-medium text-card-foreground hover:text-primary transition-colors line-clamp-2 block leading-snug">
                        {item.products?.name || 'Produk'}
                      </Link>
                      {item.variants?.name && <p className="text-xs text-muted-foreground mt-0.5">{item.variants.name}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">x{item.quantity} × {formatPrice(Number(item.price))}</p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{formatPrice(Number(item.total))}</span>
                  </div>
                );
              })}
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
              <p className="text-sm text-muted-foreground">Metode: <span className="text-foreground font-medium">{payment.method === 'midtrans' ? 'Midtrans (Online)' : payment.method}{payment.bank_name ? ` - ${payment.bank_name}` : ''}</span></p>
              <p className="text-sm text-muted-foreground">Status: <span className={`font-medium ${payment.status === 'confirmed' ? 'text-green-600' : payment.status === 'failed' ? 'text-red-500' : 'text-yellow-600'}`}>{payment.status === 'confirmed' ? '✅ Dikonfirmasi' : payment.status === 'failed' ? '❌ Gagal' : '⏳ Menunggu'}</span></p>

              {order.status === 'pending_payment' && payment.method === 'midtrans' && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-2.5 text-xs text-yellow-700 dark:text-yellow-400">
                    <Clock className="h-4 w-4 shrink-0" /> Batas waktu pembayaran 24 jam sejak pesanan dibuat.
                  </div>
                  <Button className="w-full rounded-full" onClick={handleContinuePayment} disabled={payingSnap}>
                    {payingSnap ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuka pembayaran...</> : '🔒 Lanjutkan Pembayaran'}
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> Aman & terenkripsi oleh Midtrans
                  </div>
                </div>
              )}

              {order.status === 'pending_payment' && payment.method === 'cod' && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-2 text-xs text-yellow-700 dark:text-yellow-400">
                  <Clock className="h-4 w-4" /> Bayar tunai saat paket tiba di alamat Anda.
                </div>
              )}
            </div>
          )}

          {/* Shipment */}
          {shipment && (
            <div className="rounded-xl border border-border bg-card p-5 print:border-0 print:p-0 space-y-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-card-foreground mb-1">
                <Truck className="h-4 w-4 text-primary" /> Status Pengiriman
              </h2>
              
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Metode: <span className="text-foreground font-semibold">{shipment.courier || (order.shipping_method === 'local' ? 'Kurir Toko' : 'Ekspedisi Reguler')}</span>
                </p>
                
                {shipment.tracking_number && (
                  <p className="text-muted-foreground">
                    No. Resi: <span className="font-mono text-foreground bg-secondary px-2 py-0.5 rounded font-semibold text-xs border border-border">{shipment.tracking_number}</span>
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    shipment.status === 'delivered'
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400'
                      : shipment.status === 'shipped'
                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400'
                  }`}>
                    {shipment.status === 'delivered' ? '✅ Diterima' : shipment.status === 'shipped' ? '🚚 Sedang Dikirim' : '⏳ Diproses / Pending'}
                  </span>
                </div>

                {shipment.status === 'shipped' && shipment.shipped_at && (
                  <p className="text-xs text-muted-foreground">
                    Dikirim pada: <span className="font-medium text-foreground">{new Date(shipment.shipped_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                )}

                {shipment.status === 'delivered' && shipment.delivered_at && (
                  <p className="text-xs text-muted-foreground">
                    Diterima pada: <span className="font-medium text-foreground">{new Date(shipment.delivered_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="rounded-xl border border-border bg-card p-5 print:border-0 print:p-0">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-foreground">{formatPrice(Number(order.subtotal))}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Ongkos Kirim</span><span className="text-foreground">{Number(order.shipping_cost) === 0 ? 'GRATIS' : formatPrice(Number(order.shipping_cost))}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatPrice(Number(order.discount_amount))}</span></div>
              )}
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-base font-bold">
                <span className="text-card-foreground">Total</span>
                <span className="text-primary">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Cancel info */}
          {canCancel && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/40 p-4 text-sm text-orange-700 dark:text-orange-400">
              <p className="font-medium mb-1">⚠️ Ingin membatalkan pesanan?</p>
              <p className="text-xs opacity-80">Pesanan hanya bisa dibatalkan saat statusnya "Menunggu Pembayaran" atau "Diproses". Setelah dikirim, pembatalan tidak bisa dilakukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog Konfirmasi Pembatalan ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Batalkan Pesanan?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Pesanan <span className="font-mono font-semibold text-foreground">{order.order_number}</span> akan dibatalkan dan tidak bisa dipulihkan.
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
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelling}>Batal</Button>
              <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
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

export default OrderDetail;
