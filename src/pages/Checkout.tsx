import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MapPin, Truck, Plus, ArrowLeft, Package, Loader2, ShieldCheck, Ticket, Coins, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart, CartItem } from '@/hooks/useCart';
import { formatPrice } from '@/lib/supabaseHelpers';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
  latitude?: number | null;
  longitude?: number | null;
}

const SHIPPING_COST = 20000;

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const { items: cartItems, clearCart, removeItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const buyNowItem = location.state?.buyNowItem as CartItem | undefined;
  const selectedCartItems = location.state?.checkoutItems as CartItem[] | undefined;
  const checkoutItems = buyNowItem ? [buyNowItem] : (selectedCartItems ? selectedCartItems : cartItems);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<any>({
    label: 'Rumah', recipient_name: '', phone: '',
    full_address: '', city: '', province: '', postal_code: '', district: '',
    latitude: null, longitude: null,
  });
  const [syncingAddr, setSyncingAddr] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'midtrans' | 'cod'>('midtrans');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const snapScriptLoaded = useRef(false);

  // Shipping configurations
  const [shippingConfigs, setShippingConfigs] = useState<any>(null);
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [shippingMethod, setShippingMethod] = useState<'local' | 'zone'>('zone');

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Voucher & points
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [usePoints, setUsePoints] = useState(0);

  // Load Midtrans Snap.js
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
    return () => { /* script stays loaded */ };
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast({ title: 'Login diperlukan', description: 'Silakan login terlebih dahulu.', variant: 'destructive' });
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, authLoading, navigate, toast]);

  // Redirect if no items
  useEffect(() => {
    if (!authLoading && user && checkoutItems.length === 0) navigate('/cart');
  }, [checkoutItems.length, authLoading, user, navigate]);

  // Fetch addresses
  useEffect(() => {
    if (!user) return;
    setLoadingAddresses(true);
    (supabase.from('addresses') as any).select('*').eq('user_id', user.id).eq('is_visible', true).order('is_default', { ascending: false })
      .then(({ data }) => {
        const list = (data || []) as Address[];
        setAddresses(list);
        const def = list.find(a => a.is_default);
        if (def) setSelectedAddressId(def.id);
        else if (list.length) setSelectedAddressId(list[0].id);
        setLoadingAddresses(false);
      });
  }, [user]);

  // Load points balance
  useEffect(() => {
    if (!user) return;
    supabase.from('user_points').select('balance').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setAvailablePoints(data?.balance || 0));
  }, [user]);

  // Load shipping configurations and zones
  useEffect(() => {
    supabase.from('shipping_configs').select('*').maybeSingle().then(({ data }) => {
      if (data) setShippingConfigs(data);
    });
    supabase.from('shipping_zones').select('*').then(({ data }) => {
      if (data) setShippingZones(data);
    });
  }, []);

  const isGibberish = (text: string) => {
    if (!text) return true;
    const cleaned = text.trim().toLowerCase();
    if (cleaned.length < 3) return true;
    if (/(.)\1{4,}/.test(cleaned)) return true;
    const words = cleaned.split(/\s+/);
    for (const word of words) {
      if (word.length >= 4 && !/[aeiouy]/.test(word) && !/^[0-9\-]+$/.test(word)) {
        return true;
      }
    }
    const keyboardMash = ['asdf', 'qwer', 'zxcv', 'hjkl', 'uiop', 'bnm'];
    for (const mash of keyboardMash) {
      if (cleaned.includes(mash)) return true;
    }
    return false;
  };

  const syncAddressFromCoords = async (lat: number, lng: number, setFormCallback: any) => {
    if (lat < -11 || lat > 6 || lng < 95 || lng > 141) {
      toast({ title: 'Lokasi tidak valid', description: 'Titik koordinat harus berada di dalam wilayah Indonesia.', variant: 'destructive' });
      return;
    }
    setSyncingAddr(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`);
      if (!res.ok) throw new Error('Failed to fetch location data');
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const province = addr.state || addr.region || '';
        const city = addr.city || addr.regency || addr.municipality || addr.county || '';
        const district = addr.suburb || addr.district || addr.village || addr.municipality || '';
        const postalCode = addr.postcode || '';
        
        const road = addr.road || '';
        const neighborhood = addr.neighbourhood || '';
        const hamlet = addr.hamlet || '';
        const fullAddr = [road, neighborhood, hamlet].filter(Boolean).join(', ') || data.display_name.split(',').slice(0, 3).join(', ');

        setFormCallback((prev: any) => ({
          ...prev,
          province: province.replace('Daerah Khusus Ibukota ', 'DKI '),
          city: city.replace('Kota Administrasi ', '').replace('Kabupaten ', 'Kab. '),
          district: district || prev.district || '',
          postal_code: postalCode || prev.postal_code || '',
          full_address: fullAddr || data.display_name,
          latitude: lat,
          longitude: lng,
        }));
        toast({ title: '📍 Alamat disinkronkan', description: 'Detail alamat berhasil disalin dari koordinat peta.' });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Sinkronisasi gagal', description: 'Gagal mendapatkan data alamat dari koordinat terpilih.', variant: 'destructive' });
    } finally {
      setSyncingAddr(false);
    }
  };

  const handleSearchLocation = async (query: string, map: any, marker: any, setFormCallback: any) => {
    if (!query.trim()) return;
    setSyncingAddr(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=id`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        if (map && marker) {
          map.setView([latitude, longitude], 15);
          marker.setLatLng([latitude, longitude]);
        }
        
        await syncAddressFromCoords(latitude, longitude, setFormCallback);
      } else {
        toast({ title: 'Lokasi tidak ditemukan', description: 'Coba masukkan kata kunci pencarian alamat yang lebih spesifik.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Pencarian gagal', description: 'Gagal mencari lokasi.', variant: 'destructive' });
    } finally {
      setSyncingAddr(false);
    }
  };

  // Leaflet Map Picker Initialization
  useEffect(() => {
    if (!showAddressForm) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('leaflet-map-picker');
      if (!mapContainer || mapRef.current) return;

      const defaultLat = -6.7027;
      const defaultLng = 107.5645;

      const L = (window as any).L;
      if (!L) return;

      // Fix Leaflet default marker icon paths
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      const map = L.map('leaflet-map-picker').setView([defaultLat, defaultLng], 13);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        syncAddressFromCoords(position.lat, position.lng, setNewAddress);
      });

      map.on('click', (e: any) => {
        const coords = e.latlng;
        marker.setLatLng(coords);
        syncAddressFromCoords(coords.lat, coords.lng, setNewAddress);
      });

      setNewAddress((prev: any) => ({
        ...prev,
        latitude: defaultLat,
        longitude: defaultLng
      }));
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showAddressForm]);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const distance = useMemo(() => {
    if (!selectedAddress || !selectedAddress.latitude || !selectedAddress.longitude || !shippingConfigs) return null;
    return getDistance(
      Number(shippingConfigs.store_lat),
      Number(shippingConfigs.store_lng),
      Number(selectedAddress.latitude),
      Number(selectedAddress.longitude)
    );
  }, [selectedAddress, shippingConfigs]);

  const matchedZone = useMemo(() => {
    if (!selectedAddress || !shippingZones.length) return null;
    const province = selectedAddress.province.trim().toLowerCase();
    return shippingZones.find(z =>
      z.provinces.some((p: string) => p.trim().toLowerCase() === province)
    );
  }, [selectedAddress, shippingZones]);

  const subtotal = checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const isCodAvailable = useMemo(() => {
    return distance !== null && distance <= 10 && subtotal >= 50000;
  }, [distance, subtotal]);

  // Sync payment and shipping method
  useEffect(() => {
    if (paymentMethod === 'cod') {
      setShippingMethod('local');
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (paymentMethod === 'cod' && !isCodAvailable) {
      setPaymentMethod('midtrans');
      toast({
        title: 'COD tidak tersedia',
        description: 'Metode COD hanya tersedia untuk jarak maksimal 10 km dan minimal pembelian Rp50.000.',
        variant: 'destructive',
      });
    }
  }, [isCodAvailable, paymentMethod, toast]);

  const handleShippingMethodChange = (method: 'local' | 'zone') => {
    setShippingMethod(method);
    if (method === 'zone' && paymentMethod === 'cod') {
      setPaymentMethod('midtrans');
    }
  };

  const calculatedShippingFee = useMemo(() => {
    if (subtotal >= 200000) return 0;
    
    if (shippingMethod === 'local') {
      if (distance === null) return 20000;
      if (distance <= 3) return 5000;
      if (distance <= 5) return 10000;
      if (distance <= 10) return 15000;
      return 20000;
    } else {
      return matchedZone ? Number(matchedZone.cost) : 20000;
    }
  }, [shippingMethod, distance, matchedZone, subtotal]);

  const shippingFee = calculatedShippingFee;

  // Calculate voucher discount
  const voucherDiscount = (() => {
    if (!appliedVoucher) return 0;
    if (subtotal < appliedVoucher.min_purchase) return 0;
    let d = appliedVoucher.discount_type === 'percent'
      ? Math.floor(subtotal * appliedVoucher.discount_value / 100)
      : appliedVoucher.discount_value;
    if (appliedVoucher.max_discount) d = Math.min(d, appliedVoucher.max_discount);
    return Math.min(d, subtotal);
  })();

  const pointsDiscount = Math.min(usePoints, availablePoints, subtotal - voucherDiscount);
  const total = Math.max(0, subtotal + shippingFee - voucherDiscount - pointsDiscount);

  const handleAddAddress = async () => {
    if (!user) return;
    if (!newAddress.recipient_name || !newAddress.phone || !newAddress.full_address || !newAddress.city || !newAddress.province) {
      toast({ title: 'Data tidak lengkap', description: 'Isi semua field wajib.', variant: 'destructive' });
      return;
    }

    if (!newAddress.latitude || !newAddress.longitude) {
      toast({ title: 'Lokasi belum ditentukan', description: 'Silakan pilih lokasi di peta terlebih dahulu.', variant: 'destructive' });
      return;
    }

    const lat = Number(newAddress.latitude);
    const lng = Number(newAddress.longitude);
    if (lat < -11 || lat > 6 || lng < 95 || lng > 141) {
      toast({ title: 'Lokasi tidak valid', description: 'Titik koordinat harus berada di dalam wilayah Indonesia.', variant: 'destructive' });
      return;
    }

    if (isGibberish(newAddress.recipient_name)) {
      toast({ title: 'Nama tidak valid', description: 'Nama penerima terdeteksi palsu atau tidak valid.', variant: 'destructive' });
      return;
    }

    if (newAddress.full_address.trim().length < 10 || isGibberish(newAddress.full_address)) {
      toast({ title: 'Alamat tidak valid', description: 'Alamat lengkap terdeteksi palsu, tidak valid, atau terlalu pendek (minimal 10 karakter).', variant: 'destructive' });
      return;
    }

    if (isGibberish(newAddress.city)) {
      toast({ title: 'Kota tidak valid', description: 'Nama kota terdeteksi palsu atau tidak valid.', variant: 'destructive' });
      return;
    }

    if (isGibberish(newAddress.province)) {
      toast({ title: 'Provinsi tidak valid', description: 'Nama provinsi terdeteksi palsu atau tidak valid.', variant: 'destructive' });
      return;
    }

    if (newAddress.district && isGibberish(newAddress.district)) {
      toast({ title: 'Kecamatan tidak valid', description: 'Nama kecamatan terdeteksi palsu atau tidak valid.', variant: 'destructive' });
      return;
    }

    const { data, error } = await supabase.from('addresses').insert({
      ...newAddress, user_id: user.id, is_default: addresses.length === 0,
    }).select().single();
    if (error) { toast({ title: 'Gagal', description: error.message, variant: 'destructive' }); return; }
    const addr = data as Address;
    setAddresses(prev => [...prev, addr]);
    setSelectedAddressId(addr.id);
    setShowAddressForm(false);
    setNewAddress({ label: 'Rumah', recipient_name: '', phone: '', full_address: '', city: '', province: '', postal_code: '', district: '', latitude: null, longitude: null });
    toast({ title: 'Alamat ditambahkan' });
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    const { data } = await supabase.from('vouchers').select('*')
      .eq('code', voucherCode.trim().toUpperCase()).eq('is_active', true).maybeSingle();
    setVoucherLoading(false);
    if (!data) { toast({ title: 'Voucher tidak ditemukan', variant: 'destructive' }); return; }
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      toast({ title: 'Voucher kedaluwarsa', variant: 'destructive' }); return;
    }
    if (data.quota && data.used_count >= data.quota) {
      toast({ title: 'Kuota voucher habis', variant: 'destructive' }); return;
    }
    if (subtotal < data.min_purchase) {
      toast({ title: `Min. pembelian ${formatPrice(data.min_purchase)}`, variant: 'destructive' }); return;
    }
    setAppliedVoucher(data);
    toast({ title: '✨ Voucher diterapkan!' });
  };

  const openSnapPayment = async (orderId: string) => {
    try {
      const res = await supabase.functions.invoke('create-payment', {
        body: { 
          order_id: orderId,
          redirect_url: `${window.location.origin}/orders/${orderId}`
        },
      });

      if (res.error) throw new Error(res.error.message);
      const { snap_token } = res.data;
      if (!snap_token) throw new Error('Gagal mendapatkan token pembayaran');

      if (!window.snap) {
        toast({ title: 'Snap belum siap', description: 'Coba lagi dalam beberapa detik.', variant: 'destructive' });
        return;
      }

      window.snap.pay(snap_token, {
        onSuccess: async () => {
          if (!buyNowItem) {
            if (selectedCartItems) removeItems(selectedCartItems);
            else clearCart();
          }
          // Direct update to DB so the status instantly changes to Diproses
          try {
            await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId);
            await supabase.from('payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('order_id', orderId);
          } catch (err) {
            console.error('Error updating order/payment status:', err);
          }
          toast({ title: '✅ Pembayaran berhasil!', description: 'Pesanan Anda sedang diproses.' });
          setTimeout(() => navigate(`/orders/${orderId}`, { replace: true }), 1500);
        },
        onPending: () => {
          if (!buyNowItem) {
            if (selectedCartItems) removeItems(selectedCartItems);
            else clearCart();
          }
          toast({ title: '⏳ Menunggu pembayaran', description: 'Selesaikan pembayaran di halaman pesanan.' });
          navigate(`/orders/${orderId}`, { replace: true });
        },
        onError: () => {
          toast({ title: 'Pembayaran gagal', description: 'Silakan coba lagi dari halaman pesanan.', variant: 'destructive' });
          navigate(`/orders/${orderId}`, { replace: true });
        },
        onClose: () => {
          if (!buyNowItem) {
            if (selectedCartItems) removeItems(selectedCartItems);
            else clearCart();
          }
          toast({ title: 'Pesanan tersimpan', description: 'Selesaikan pembayaran di halaman pesanan Anda.' });
          navigate(`/orders/${orderId}`, { replace: true });
        },
      });
    } catch (err: any) {
      toast({ title: 'Gagal membuka pembayaran', description: err.message, variant: 'destructive' });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast({ title: 'Pilih alamat', description: 'Harap pilih alamat pengiriman.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Langkah 1: Buat order (harga & ongkir dihitung server-side)
      const res = await supabase.functions.invoke('create-order', {
        body: {
          items: checkoutItems.map(i => ({
            product_id: i.productId,
            variant_id: i.variantId || null,
            quantity: i.quantity,
          })),
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          shipping_method: shippingMethod,
          notes: notes || undefined,
        },
      });

      // Ekstrak pesan error asli dari response body
      if (res.error) {
        let errMsg = 'Gagal membuat pesanan';
        try {
          // FunctionsHttpError memiliki context dengan response asli
          const ctx = (res.error as any).context;
          if (ctx) {
            const body = typeof ctx.json === 'function' ? await ctx.json() : ctx;
            errMsg = body?.error || body?.message || res.error.message || errMsg;
          } else {
            errMsg = res.error.message || errMsg;
          }
        } catch { errMsg = res.error.message || errMsg; }
        throw new Error(errMsg);
      }

      const result = res.data;
      if (result?.error) throw new Error(result.error);

      const orderId = result.order.id;

      // Side-effects: catat voucher redemption, redeem poin, earn poin (1% subtotal)
      try {
        if (appliedVoucher && voucherDiscount > 0) {
          await supabase.from('voucher_redemptions').insert({
            voucher_id: appliedVoucher.id, user_id: user!.id,
            order_id: orderId, discount_amount: voucherDiscount,
          });
        }
        if (pointsDiscount > 0) {
          await supabase.from('point_transactions').insert({
            user_id: user!.id, amount: -pointsDiscount, type: 'redeem',
            reference: `Tukar poin di order ${result.order.order_number}`, order_id: orderId,
          });
          await supabase.from('user_points').upsert({
            user_id: user!.id, balance: availablePoints - pointsDiscount, updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
        const earned = Math.floor(subtotal * 0.01);
        if (earned > 0) {
          await supabase.from('point_transactions').insert({
            user_id: user!.id, amount: earned, type: 'earn',
            reference: `Reward order ${result.order.order_number}`, order_id: orderId,
          });
          await supabase.from('user_points').upsert({
            user_id: user!.id, balance: (availablePoints - pointsDiscount) + earned, updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
      } catch (e) { console.warn('Voucher/poin side-effect:', e); }

      // Langkah 2: Buka Midtrans Snap jika bukan COD
      if (paymentMethod === 'midtrans') {
        setSubmitting(false);
        await openSnapPayment(orderId);
      } else {
        if (!buyNowItem) {
          if (selectedCartItems) removeItems(selectedCartItems);
          else clearCart();
        }
        toast({ title: 'Pesanan berhasil!', description: `No. ${result.order.order_number}` });
        navigate(`/orders/${orderId}`, { replace: true });
      }
    } catch (err: any) {
      toast({ title: 'Gagal checkout', description: err.message, variant: 'destructive' });
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
                      <p className="text-sm font-medium text-card-foreground line-clamp-2">{item.name}</p>
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
                    {addresses.map(addr => {
                      const addrDistance = (addr.latitude && addr.longitude && shippingConfigs)
                        ? getDistance(Number(shippingConfigs.store_lat), Number(shippingConfigs.store_lng), Number(addr.latitude), Number(addr.longitude))
                        : null;
                      
                      return (
                        <label key={addr.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                          <input type="radio" name="address" className="mt-1 accent-primary" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                          <div className="text-sm flex-1">
                            <div className="flex justify-between items-start flex-wrap gap-1">
                              <p className="font-medium text-card-foreground">{addr.recipient_name} <span className="text-xs text-muted-foreground">({addr.label})</span></p>
                              {addrDistance !== null ? (
                                <span className="text-xs font-semibold text-primary">📍 {addrDistance.toFixed(1)} km dari toko</span>
                              ) : (
                                <span className="text-[10px] text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 px-2 py-0.5 rounded border border-yellow-200">📍 Belum pin lokasi peta</span>
                              )}
                            </div>
                            <p className="text-muted-foreground">{addr.phone}</p>
                            <p className="text-muted-foreground">{addr.full_address}, {addr.district && `${addr.district}, `}{addr.city}, {addr.province} {addr.postal_code}</p>
                          </div>
                        </label>
                      );
                    })}
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
                  
                  {/* Leaflet Map Picker */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      📍 Tentukan Lokasi di Peta
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Cari alamat Anda atau geser pin peta ke lokasi pengiriman yang tepat untuk menghitung jarak & mengaktifkan Antar Toko / COD.
                    </p>

                    {/* Search bar for map */}
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Cari lokasi (contoh: Wanayasa, Purwakarta)..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchLocation(searchQuery, mapRef.current, markerRef.current, setNewAddress);
                          }
                        }}
                        className="text-xs"
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSearchLocation(searchQuery, mapRef.current, markerRef.current, setNewAddress);
                        }}
                        disabled={syncingAddr}
                      >
                        {syncingAddr ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cari'}
                      </Button>
                    </div>

                    <div className="relative mt-1">
                      <div id="leaflet-map-picker" className="h-[220px] w-full rounded-lg border border-border shadow-inner" style={{ zIndex: 1 }} />
                      {syncingAddr && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg" style={{ zIndex: 999 }}>
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">Sinkronisasi peta...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {newAddress.latitude !== null && (
                      <p className="text-[11px] text-primary font-medium mt-1">
                        Koordinat: {Number(newAddress.latitude).toFixed(6)}, {Number(newAddress.longitude).toFixed(6)} 
                        {shippingConfigs && ` (${getDistance(Number(shippingConfigs.store_lat), Number(shippingConfigs.store_lng), Number(newAddress.latitude), Number(newAddress.longitude)).toFixed(1)} km dari toko)`}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleAddAddress}>Simpan</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddressForm(false)}>Batal</Button>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Shipping */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground mb-3">
                <Truck className="h-5 w-5 text-primary" /> Metode Pengiriman
              </h2>
              
              <div className="space-y-3">
                {/* Local Delivery Option */}
                {(!shippingConfigs || shippingConfigs.local_delivery_active) && (
                  <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${shippingMethod === 'local' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'} ${distance !== null && distance > 10 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input 
                      type="radio" 
                      name="shipping_method" 
                      className="mt-1 accent-primary" 
                      checked={shippingMethod === 'local'} 
                      disabled={distance !== null && distance > 10}
                      onChange={() => handleShippingMethodChange('local')} 
                    />
                    <div className="text-sm flex-1">
                      <div className="flex justify-between items-start flex-wrap">
                        <p className="font-medium text-card-foreground">Antar Toko (Local Delivery)</p>
                        {distance !== null && distance <= 10 && (
                          <span className="text-sm font-bold text-primary">
                            {subtotal >= 200000 ? 'GRATIS' : formatPrice(distance <= 3 ? 5000 : distance <= 5 ? 10000 : 15000)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Layanan pengantaran kurir lokal dalam radius maksimal 10 km.</p>
                      {distance !== null && (
                        <p className="text-xs font-semibold mt-1 text-primary">
                          {distance <= 10 ? `📍 Jarak: ${distance.toFixed(1)} km (Dalam Jangkauan)` : `📍 Jarak: ${distance.toFixed(1)} km (Di luar jangkauan > 10 km)`}
                        </p>
                      )}
                      {distance === null && (
                        <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Tentukan lokasi di peta pada alamat terpilih untuk mengaktifkan tarif lokal.</p>
                      )}
                    </div>
                  </label>
                )}

                {/* Zone Shipping Option */}
                {(!shippingConfigs || shippingConfigs.zone_shipping_active) && (
                  <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${shippingMethod === 'zone' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'} ${paymentMethod === 'cod' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input 
                      type="radio" 
                      name="shipping_method" 
                      className="mt-1 accent-primary" 
                      checked={shippingMethod === 'zone'} 
                      disabled={paymentMethod === 'cod'} 
                      onChange={() => handleShippingMethodChange('zone')} 
                    />
                    <div className="text-sm flex-1">
                      <div className="flex justify-between items-start flex-wrap">
                        <p className="font-medium text-card-foreground">Pengiriman Reguler (Zona)</p>
                        <span className="text-sm font-bold text-primary">
                          {subtotal >= 200000 ? 'GRATIS' : (matchedZone ? formatPrice(Number(matchedZone.cost)) : formatPrice(20000))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Pengiriman kurir/ekspedisi regular berdasarkan lokasi provinsi Anda.</p>
                      {selectedAddress && (
                        <p className="text-xs font-semibold mt-1 text-primary">
                          Wilayah: {selectedAddress.province} {matchedZone ? `(Zona: ${matchedZone.name})` : '(Zona Default)'}
                        </p>
                      )}
                    </div>
                  </label>
                )}
              </div>
              
              {subtotal >= 200000 && (
                <p className="mt-3 text-xs text-green-600 font-medium">🎉 Selamat! Anda mendapat gratis ongkir untuk pembelian di atas Rp200.000</p>
              )}
            </section>

            {/* 4. Payment Method */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground mb-3">
                <ShieldCheck className="h-5 w-5 text-primary" /> Metode Pembayaran
              </h2>
              <div className="space-y-3">
                <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${paymentMethod === 'midtrans' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <input type="radio" name="payment" className="mt-1 accent-primary" checked={paymentMethod === 'midtrans'} onChange={() => setPaymentMethod('midtrans')} />
                  <div>
                    <p className="font-medium text-card-foreground text-sm">Pembayaran Online (Midtrans)</p>
                    <p className="text-xs text-muted-foreground mt-1">Transfer Bank, Kartu Kredit, E-Wallet (GoPay, OVO, DANA), dan QRIS.</p>
                  </div>
                </label>
                <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'} ${!isCodAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    className="mt-1 accent-primary" 
                    checked={paymentMethod === 'cod'} 
                    disabled={!isCodAvailable}
                    onChange={() => setPaymentMethod('cod')} 
                  />
                  <div>
                    <p className="font-medium text-card-foreground text-sm flex items-center gap-1.5">
                      Bayar di Tempat (COD)
                      {!isCodAvailable && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-normal">Tidak Tersedia</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Bayar dengan uang tunai langsung ke kurir saat pesanan tiba.</p>
                    {!isCodAvailable && (
                      <p className="text-[10px] text-destructive mt-1 font-medium leading-normal">
                        Hanya dalam radius 10 km dari toko & minimal belanja Rp50.000.
                        {distance !== null ? ` Jarak Anda: ${distance.toFixed(1)} km.` : ' Pin lokasi Anda di peta terlebih dahulu.'}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </section>

            {/* Voucher & Poin */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground mb-3">
                <Ticket className="h-5 w-5 text-primary" /> Voucher & Poin
              </h2>
              {appliedVoucher ? (
                <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-3">
                  <div>
                    <p className="text-sm font-bold text-primary">{appliedVoucher.code}</p>
                    <p className="text-xs text-muted-foreground">Hemat {formatPrice(voucherDiscount)}</p>
                  </div>
                  <button onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }} className="rounded-full p-1.5 hover:bg-destructive/10 text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="Masukkan kode voucher" />
                  <Button onClick={applyVoucher} disabled={voucherLoading || !voucherCode.trim()} variant="outline">
                    {voucherLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pakai'}
                  </Button>
                </div>
              )}
              {availablePoints > 0 && (
                <div className="mt-3 rounded-lg bg-secondary/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" /> Saldo: <strong>{availablePoints.toLocaleString('id-ID')}</strong> poin</span>
                    {usePoints > 0 && <button onClick={() => setUsePoints(0)} className="text-xs text-destructive">Batal</button>}
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" min={0} max={Math.min(availablePoints, subtotal - voucherDiscount)}
                      value={usePoints || ''} onChange={e => setUsePoints(Math.max(0, Math.min(Number(e.target.value), availablePoints, subtotal - voucherDiscount)))}
                      placeholder="Pakai poin" />
                    <Button variant="outline" onClick={() => setUsePoints(Math.min(availablePoints, subtotal - voucherDiscount))}>Maks</Button>
                  </div>
                </div>
              )}
            </section>

            {/* 5. Notes */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <Label className="text-sm font-bold text-card-foreground">Catatan (opsional)</Label>
              <Input className="mt-2" placeholder="Catatan untuk penjual..." value={notes} onChange={e => setNotes(e.target.value)} />
            </section>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:sticky lg:top-28">
              <h2 className="font-display text-lg font-bold text-card-foreground mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({checkoutItems.reduce((s, i) => s + i.quantity, 0)} produk)</span>
                  <span className="text-foreground font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Ongkos Kirim</span>
                  {shippingFee === 0
                    ? <span className="text-green-600 font-medium">Gratis</span>
                    : <span className="text-foreground font-medium">{formatPrice(shippingFee)}</span>
                  }
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-rose-gold">
                    <span>Voucher ({appliedVoucher.code})</span>
                    <span className="font-medium">−{formatPrice(voucherDiscount)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Poin ({pointsDiscount.toLocaleString('id-ID')})</span>
                    <span className="font-medium">−{formatPrice(pointsDiscount)}</span>
                  </div>
                )}
              </div>
              <div className="my-4 border-t border-border" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-card-foreground">Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                + Reward {Math.floor(subtotal * 0.01).toLocaleString('id-ID')} poin
              </p>

              {paymentMethod === 'midtrans' && (
                <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
                  Setelah klik "Buat Pesanan", pilih metode bayar di popup Midtrans.
                </div>
              )}

              <Button
                className="mt-5 w-full rounded-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={submitting || !selectedAddressId}
              >
                {submitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                  : paymentMethod === 'midtrans' ? '🔒 Buat Pesanan & Bayar' : 'Buat Pesanan'
                }
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
