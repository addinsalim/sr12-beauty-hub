import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MapPin, Truck, CreditCard, ChevronRight, Plus, ArrowLeft, Package, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart, CartItem } from '@/hooks/useCart';
import { formatPrice } from '@/lib/supabaseHelpers';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Address {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  full_address: string;
  city: string;
  province: string;
  postal_code: string;
  district: string | null;
  is_default: boolean;
}

const PAYMENT_METHODS = [
  { id: 'cod', label: 'COD (Bayar di Tempat)', icon: '💵' },
  { id: 'transfer_bank', label: 'Transfer Bank', icon: '🏦', options: [
    { id: 'BCA', label: 'BCA' },
    { id: 'BRI', label: 'BRI' },
    { id: 'Mandiri', label: 'Mandiri' },
    { id: 'BNI', label: 'BNI' },
    { id: 'BSI', label: 'BSI' },
  ]},
  { id: 'ewallet', label: 'E-Wallet', icon: '📱', options: [
    { id: 'Dana', label: 'Dana' },
    { id: 'OVO', label: 'OVO' },
    { id: 'Gopay', label: 'Gopay' },
    { id: 'QRIS', label: 'QRIS' },
  ]},
];

const SHIPPING_COST = 20000; // Flat Rp20.000 — free above Rp200.000 (consistent with Cart page)

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Buy Now: single item passed via state
  const buyNowItem = location.state?.buyNowItem as CartItem | undefined;
  const checkoutItems = buyNowItem ? [buyNowItem] : cartItems;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Rumah', recipient_name: '', phone: '', full_address: '', city: '', province: '', postal_code: '', district: '' });

  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetail, setPaymentDetail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast({ title: 'Login diperlukan', description: 'Silakan login terlebih dahulu untuk checkout.', variant: 'destructive' });
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, authLoading, navigate, toast]);

  // Redirect if no items
  useEffect(() => {
    if (!authLoading && user && checkoutItems.length === 0) {
      navigate('/cart');
    }
  }, [checkoutItems.length, authLoading, user, navigate]);

  // Fetch addresses
  useEffect(() => {
    if (!user) return;
    setLoadingAddresses(true);
    supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
      .then(({ data }) => {
        const list = (data || []) as Address[];
        setAddresses(list);
        const def = list.find(a => a.is_default);
        if (def) setSelectedAddressId(def.id);
        else if (list.length) setSelectedAddressId(list[0].id);
        setLoadingAddresses(false);
      });
  }, [user]);

  const subtotal = checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + SHIPPING_COST;

  const handleAddAddress = async () => {
    if (!user) return;
    if (!newAddress.recipient_name || !newAddress.phone || !newAddress.full_address || !newAddress.city || !newAddress.province) {
      toast({ title: 'Data tidak lengkap', description: 'Harap isi semua field alamat yang wajib.', variant: 'destructive' });
      return;
    }
    const { data, error } = await supabase.from('addresses').insert({
      ...newAddress,
      user_id: user.id,
      is_default: addresses.length === 0,
    }).select().single();
    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
      return;
    }
    const addr = data as Address;
    setAddresses(prev => [...prev, addr]);
    setSelectedAddressId(addr.id);
    setShowAddressForm(false);
    setNewAddress({ label: 'Rumah', recipient_name: '', phone: '', full_address: '', city: '', province: '', postal_code: '', district: '' });
    toast({ title: 'Alamat ditambahkan' });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast({ title: 'Pilih alamat', description: 'Harap pilih alamat pengiriman.', variant: 'destructive' });
      return;
    }
    if (!paymentMethod) {
      toast({ title: 'Pilih pembayaran', description: 'Harap pilih metode pembayaran.', variant: 'destructive' });
      return;
    }
    if ((paymentMethod === 'transfer_bank' || paymentMethod === 'ewallet') && !paymentDetail) {
      toast({ title: 'Pilih detail pembayaran', description: 'Harap pilih bank atau e-wallet.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi tidak valid');

      const res = await supabase.functions.invoke('create-order', {
        body: {
          items: checkoutItems.map(i => ({
            product_id: i.productId,
            variant_id: i.variantId,
            quantity: i.quantity,
            price: i.price,
          })),
          address_id: selectedAddressId,
          shipping_cost: SHIPPING_COST,
          payment_method: paymentMethod,
          payment_detail: paymentDetail || undefined,
          notes: notes || undefined,
        },
      });

      if (res.error) throw new Error(res.error.message || 'Gagal membuat pesanan');
      const result = res.data;
      if (result.error) throw new Error(result.error);

      // Clear cart if not buy-now
      if (!buyNowItem) clearCart();

      toast({ title: 'Pesanan berhasil dibuat!', description: `No. Pesanan: ${result.order.order_number}` });
      navigate(`/orders/${result.order.id}`, { replace: true });
    } catch (err: any) {
      toast({ title: 'Gagal checkout', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const selectedPayment = PAYMENT_METHODS.find(p => p.id === paymentMethod);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link><span>/</span>
          <Link to="/cart" className="hover:text-primary">Keranjang</Link><span>/</span>
          <span className="text-foreground">Checkout</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-10">
        <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">

            {/* 1. Items */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground mb-3">
                <Package className="h-5 w-5 text-primary" /> Produk yang Dibeli
              </h2>
              <div className="space-y-3">
                {checkoutItems.map(item => (
                  <div key={`${item.productId}::${item.variantId}`} className="flex gap-3 items-center">
                    <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover bg-secondary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground line-clamp-1">{item.name}</p>
                      {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Address */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground mb-3">
                <MapPin className="h-5 w-5 text-primary" /> Alamat Pengiriman
              </h2>
              {loadingAddresses ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Memuat alamat...</div>
              ) : addresses.length === 0 && !showAddressForm ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Belum ada alamat tersimpan.</p>
                  <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)}><Plus className="mr-1 h-4 w-4" /> Tambah Alamat</Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {addresses.map(addr => (
                      <label key={addr.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                        <input type="radio" name="address" className="mt-1 accent-primary" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                        <div className="text-sm">
                          <p className="font-medium text-card-foreground">{addr.recipient_name} <span className="text-xs text-muted-foreground">({addr.label})</span></p>
                          <p className="text-muted-foreground">{addr.phone}</p>
                          <p className="text-muted-foreground">{addr.full_address}, {addr.district && `${addr.district}, `}{addr.city}, {addr.province} {addr.postal_code}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {!showAddressForm && (
                    <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAddressForm(true)}><Plus className="mr-1 h-4 w-4" /> Tambah Alamat Baru</Button>
                  )}
                </>
              )}

              {showAddressForm && (
                <div className="mt-4 space-y-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                  <h3 className="text-sm font-semibold text-card-foreground">Alamat Baru</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label className="text-xs">Label</Label><Input value={newAddress.label} onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))} placeholder="Rumah / Kantor" /></div>
                    <div><Label className="text-xs">Nama Penerima *</Label><Input value={newAddress.recipient_name} onChange={e => setNewAddress(p => ({ ...p, recipient_name: e.target.value }))} /></div>
                    <div><Label className="text-xs">No. Telepon *</Label><Input value={newAddress.phone} onChange={e => setNewAddress(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div><Label className="text-xs">Provinsi *</Label><Input value={newAddress.province} onChange={e => setNewAddress(p => ({ ...p, province: e.target.value }))} /></div>
                    <div><Label className="text-xs">Kota *</Label><Input value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} /></div>
                    <div><Label className="text-xs">Kecamatan</Label><Input value={newAddress.district} onChange={e => setNewAddress(p => ({ ...p, district: e.target.value }))} /></div>
                    <div><Label className="text-xs">Kode Pos</Label><Input value={newAddress.postal_code} onChange={e => setNewAddress(p => ({ ...p, postal_code: e.target.value }))} /></div>
                  </div>
                  <div><Label className="text-xs">Alamat Lengkap *</Label><Input value={newAddress.full_address} onChange={e => setNewAddress(p => ({ ...p, full_address: e.target.value }))} /></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddAddress}>Simpan</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddressForm(false)}>Batal</Button>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Shipping */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground mb-3">
                <Truck className="h-5 w-5 text-primary" /> Pengiriman
              </h2>
              <div className="rounded-lg border border-primary bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Reguler</p>
                    <p className="text-xs text-muted-foreground">Estimasi 3-5 hari kerja</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatPrice(SHIPPING_COST)}</span>
                </div>
              </div>
            </section>

            {/* 4. Payment */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground mb-3">
                <CreditCard className="h-5 w-5 text-primary" /> Metode Pembayaran
              </h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(pm => (
                  <div key={pm.id}>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${paymentMethod === pm.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <input type="radio" name="payment" className="accent-primary" checked={paymentMethod === pm.id} onChange={() => { setPaymentMethod(pm.id); setPaymentDetail(''); }} />
                      <span className="text-lg">{pm.icon}</span>
                      <span className="text-sm font-medium text-card-foreground">{pm.label}</span>
                    </label>
                    {paymentMethod === pm.id && pm.options && (
                      <div className="ml-8 mt-2 flex flex-wrap gap-2">
                        {pm.options.map(opt => (
                          <button key={opt.id} onClick={() => setPaymentDetail(opt.id)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${paymentDetail === opt.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 5. Notes */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <Label className="text-sm font-bold text-card-foreground">Catatan (opsional)</Label>
              <Input className="mt-2" placeholder="Catatan untuk penjual..." value={notes} onChange={e => setNotes(e.target.value)} />
            </section>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-bold text-card-foreground mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({checkoutItems.reduce((s, i) => s + i.quantity, 0)} produk)</span>
                  <span className="text-foreground font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Ongkos Kirim</span>
                  <span className="text-foreground font-medium">{formatPrice(SHIPPING_COST)}</span>
                </div>
              </div>
              <div className="my-4 border-t border-border" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-card-foreground">Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              {paymentMethod && paymentMethod !== 'cod' && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent/10 p-2.5 text-xs text-accent-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Batas waktu pembayaran 24 jam. Pesanan otomatis dibatalkan jika tidak dibayar.</span>
                </div>
              )}

              <Button className="mt-5 w-full rounded-full" size="lg" onClick={handlePlaceOrder} disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : 'Buat Pesanan'}
              </Button>
              <Link to="/cart" className="mt-3 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition">
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Keranjang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
