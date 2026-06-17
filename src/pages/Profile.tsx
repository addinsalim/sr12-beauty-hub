import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import {
  User as UserIcon, Camera, MapPin, Plus, Pencil, Trash2, Star, Package,
  KeyRound, LogOut, Bell, Globe, Loader2, Check, Home, Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
});

const addressSchema = z.object({
  label: z.string().trim().max(30).optional(),
  recipient_name: z.string().trim().min(2, 'Nama penerima wajib diisi').max(100),
  phone: z.string().trim().min(8, 'Nomor telepon tidak valid').max(20),
  province: z.string().trim().min(2, 'Provinsi wajib diisi').max(80),
  city: z.string().trim().min(2, 'Kota wajib diisi').max(80),
  district: z.string().trim().max(80).optional(),
  postal_code: z.string().trim().max(10).optional(),
  full_address: z.string().trim().min(5, 'Alamat lengkap wajib diisi').max(500),
  is_default: z.boolean().optional(),
});

type Address = {
  id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  full_address: string;
  is_default: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean | null;
  created_at: string;
};

const MAX_AVATAR = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const Profile = () => {
  const { user, profile, loading, signOut, refreshProfile, isAdmin } = useAuth();
  const { lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const currentTab = searchParams.get('tab') || 'info';

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [addrDialog, setAddrDialog] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [deletingAddr, setDeletingAddr] = useState<Address | null>(null);
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrForm, setAddrForm] = useState<any>({
    label: 'Rumah', recipient_name: '', phone: '', province: '', city: '',
    district: '', postal_code: '', full_address: '', is_default: false,
    latitude: null, longitude: null,
  });

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [syncingAddr, setSyncingAddr] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      toast.error('Titik koordinat harus berada di dalam wilayah Indonesia.');
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
        toast.success('Detail alamat berhasil disinkronkan dari peta.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mendapatkan data alamat dari koordinat terpilih.');
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
        toast.error('Coba masukkan kata kunci pencarian alamat yang lebih spesifik.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mencari lokasi.');
    } finally {
      setSyncingAddr(false);
    }
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const [orderCount, setOrderCount] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  // Hydrate profile form
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Load data
  useEffect(() => {
    if (!user) return;
    loadAddresses();
    loadNotifications();
    loadOrderCount();
  }, [user]);

  const loadAddresses = async () => {
    setLoadingAddr(true);
    const { data } = await supabase
      .from('addresses').select('*').eq('user_id', user!.id)
      .order('is_default', { ascending: false }).order('created_at', { ascending: false });
    setAddresses((data as Address[]) || []);
    setLoadingAddr(false);
  };

  const loadNotifications = async () => {
    setLoadingNotif(true);
    const { data } = await supabase
      .from('notifications').select('*').eq('user_id', user!.id)
      .order('created_at', { ascending: false }).limit(20);
    setNotifications((data as Notification[]) || []);
    setLoadingNotif(false);
  };

  const loadOrderCount = async () => {
    const { count } = await supabase
      .from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);
    setOrderCount(count || 0);
  };

  // Leaflet Map Picker Initialization for Profile Page
  useEffect(() => {
    if (!addrDialog) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('profile-map-picker');
      if (!mapContainer || mapRef.current) return;

      const initialLat = addrForm.latitude || -6.7027;
      const initialLng = addrForm.longitude || 107.5645;

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

      const map = L.map('profile-map-picker').setView([initialLat, initialLng], 13);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        syncAddressFromCoords(position.lat, position.lng, setAddrForm);
      });

      map.on('click', (e: any) => {
        const coords = e.latlng;
        marker.setLatLng(coords);
        syncAddressFromCoords(coords.lat, coords.lng, setAddrForm);
      });

      if (!addrForm.latitude) {
        setAddrForm((prev: any) => ({
          ...prev,
          latitude: initialLat,
          longitude: initialLng
        }));
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [addrDialog]);

  // ---- Profile save ----
  const handleSaveProfile = async () => {
    const parsed = profileSchema.safeParse({ full_name: fullName, phone });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSavingProfile(true);
    const { error } = await supabase.from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('user_id', user!.id);
    setSavingProfile(false);
    if (error) { toast.error('Gagal menyimpan: ' + error.message); return; }
    toast.success('Profil diperbarui');
    await refreshProfile();
  };

  // ---- Avatar upload ----
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { toast.error('Format harus JPEG/PNG/WebP/GIF'); return; }
    if (file.size > MAX_AVATAR) { toast.error('Maksimal 5MB'); return; }

    setUploadingAvatar(true);
    try {
      // Pastikan sesi aktif (auth.uid() harus tersedia di server untuk RLS)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Sesi berakhir, silakan login ulang');
        setUploadingAvatar(false);
        return;
      }

      const extRaw = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const ext = extRaw === 'jpeg' ? 'jpg' : extRaw;
      // Path unik di dalam folder user → cocok dengan RLS (folder pertama = user.id)
      const path = `${user!.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (upErr) {
        console.error('Avatar upload error:', upErr);
        toast.error('Upload gagal: ' + (upErr.message || 'tidak diketahui'));
        setUploadingAvatar(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache buster supaya browser memuat foto baru
      const finalUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('user_id', user!.id);

      if (updErr) {
        console.error('Profile update error:', updErr);
        toast.error('Gagal menyimpan: ' + updErr.message);
        setUploadingAvatar(false);
        return;
      }

      toast.success('Foto profil diperbarui');
      await refreshProfile();
    } catch (err: any) {
      console.error('Unexpected avatar error:', err);
      toast.error('Terjadi kesalahan: ' + (err?.message || 'tidak diketahui'));
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ---- Address ----
  const openNewAddr = () => {
    setEditingAddr(null);
    setSearchQuery('');
    setAddrForm({
      label: 'Rumah', recipient_name: profile?.full_name || '', phone: profile?.phone || '',
      province: '', city: '', district: '', postal_code: '', full_address: '',
      is_default: addresses.length === 0,
      latitude: null, longitude: null,
    });
    setAddrDialog(true);
  };

  const openEditAddr = (a: Address) => {
    setEditingAddr(a);
    setSearchQuery('');
    setAddrForm({
      label: a.label || 'Rumah', recipient_name: a.recipient_name, phone: a.phone,
      province: a.province, city: a.city, district: a.district || '',
      postal_code: a.postal_code || '', full_address: a.full_address, is_default: !!a.is_default,
      latitude: a.latitude || null, longitude: a.longitude || null,
    });
    setAddrDialog(true);
  };

  const handleSaveAddr = async () => {
    const parsed = addressSchema.safeParse(addrForm);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    if (!addrForm.latitude || !addrForm.longitude) {
      toast.error('Silakan pilih lokasi di peta terlebih dahulu.');
      return;
    }
    
    const lat = Number(addrForm.latitude);
    const lng = Number(addrForm.longitude);
    if (lat < -11 || lat > 6 || lng < 95 || lng > 141) {
      toast.error('Titik koordinat harus berada di dalam wilayah Indonesia.');
      return;
    }

    if (isGibberish(addrForm.recipient_name)) {
      toast.error('Nama penerima terdeteksi palsu atau tidak valid.');
      return;
    }

    if (addrForm.full_address.trim().length < 10 || isGibberish(addrForm.full_address)) {
      toast.error('Alamat lengkap terdeteksi palsu, tidak valid, atau terlalu pendek (minimal 10 karakter).');
      return;
    }

    if (isGibberish(addrForm.city)) {
      toast.error('Nama kota terdeteksi palsu atau tidak valid.');
      return;
    }

    if (isGibberish(addrForm.province)) {
      toast.error('Nama provinsi terdeteksi palsu atau tidak valid.');
      return;
    }

    if (addrForm.district && isGibberish(addrForm.district)) {
      toast.error('Nama kecamatan terdeteksi palsu atau tidak valid.');
      return;
    }

    setSavingAddr(true);

    // If setting as default, unset others
    if (addrForm.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
    }

    const payload = {
      user_id: user!.id,
      label: addrForm.label.trim() || 'Rumah',
      recipient_name: addrForm.recipient_name.trim(),
      phone: addrForm.phone.trim(),
      province: addrForm.province.trim(),
      city: addrForm.city.trim(),
      district: addrForm.district.trim() || null,
      postal_code: addrForm.postal_code.trim() || null,
      full_address: addrForm.full_address.trim(),
      is_default: addrForm.is_default,
      latitude: addrForm.latitude,
      longitude: addrForm.longitude,
    };

    const { error } = editingAddr
      ? await supabase.from('addresses').update(payload).eq('id', editingAddr.id)
      : await supabase.from('addresses').insert(payload);

    setSavingAddr(false);
    if (error) { toast.error('Gagal menyimpan: ' + error.message); return; }
    toast.success(editingAddr ? 'Alamat diperbarui' : 'Alamat ditambahkan');
    setAddrDialog(false);
    loadAddresses();
    await refreshProfile();
  };

  const handleDeleteAddr = async () => {
    if (!deletingAddr) return;
    const { error } = await supabase.from('addresses').delete().eq('id', deletingAddr.id);
    if (error) { toast.error('Gagal menghapus'); return; }
    toast.success('Alamat dihapus');
    setDeletingAddr(null);
    loadAddresses();
    await refreshProfile();
  };

  const handleSetDefault = async (a: Address) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
    const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', a.id);
    if (error) { toast.error('Gagal'); return; }
    toast.success('Alamat utama diubah');
    loadAddresses();
  };

  // ---- Notifications ----
  const markRead = async (n: Notification) => {
    if (n.is_read) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false);
    setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
    toast.success('Semua notifikasi ditandai dibaca');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const initials = (profile?.full_name || user.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-4xl">
      {/* Header card */}
      <Card className="p-5 sm:p-6 mb-6 glass">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-secondary border-2 border-primary/30 flex items-center justify-center shadow-glow">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl text-primary">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground p-2 shadow-lg hover:scale-110 transition disabled:opacity-50"
              title="Ubah foto"
            >
              {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl sm:text-3xl text-foreground">
              {profile?.full_name || 'Pengguna'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {isAdmin && <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
              <Badge variant="outline"><Package className="h-3 w-3 mr-1" />{orderCount} Pesanan</Badge>
              <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{addresses.length} Alamat</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link to="/my-orders" className="rounded-2xl glass p-4 text-center hover:shadow-glow transition group">
          <Package className="h-6 w-6 mx-auto text-primary mb-2 group-hover:scale-110 transition" />
          <span className="text-xs sm:text-sm font-medium">Pesanan Saya</span>
        </Link>
        <Link to="/wishlist" className="rounded-2xl glass p-4 text-center hover:shadow-glow transition group">
          <Star className="h-6 w-6 mx-auto text-rose-gold mb-2 group-hover:scale-110 transition" />
          <span className="text-xs sm:text-sm font-medium">Wishlist</span>
        </Link>
        <Link to="/my-vouchers" className="rounded-2xl glass p-4 text-center hover:shadow-glow transition group">
          <KeyRound className="h-6 w-6 mx-auto text-primary mb-2 group-hover:scale-110 transition" />
          <span className="text-xs sm:text-sm font-medium">Voucher & Poin</span>
        </Link>
        <Link to="/recently-viewed" className="rounded-2xl glass p-4 text-center hover:shadow-glow transition group">
          <Home className="h-6 w-6 mx-auto text-primary mb-2 group-hover:scale-110 transition" />
          <span className="text-xs sm:text-sm font-medium">Terakhir Dilihat</span>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="info"><UserIcon className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Info</span></TabsTrigger>
          <TabsTrigger value="addresses"><MapPin className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Alamat</span></TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            <Bell className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Notifikasi</span>
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[10px] flex items-center justify-center text-accent-foreground">{unreadCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="settings"><Globe className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Preferensi</span></TabsTrigger>
        </TabsList>

        {/* Info tab */}
        <TabsContent value="info">
          <Card className="p-5 sm:p-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email || ''} disabled className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input id="full_name" value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} className="mt-1.5" placeholder="08xxxxxxxxxx" />
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full sm:w-auto">
              {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
          </Card>
        </TabsContent>

        {/* Addresses tab */}
        <TabsContent value="addresses">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg">Daftar Alamat</h2>
              <Button onClick={openNewAddr} size="sm"><Plus className="h-4 w-4 mr-1.5" />Tambah</Button>
            </div>

            {loadingAddr ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Belum ada alamat tersimpan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(a => (
                  <div key={a.id} className="rounded-xl border border-border p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <span className="font-semibold text-foreground">{a.label || 'Alamat'}</span>
                          {a.is_default && <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15"><Check className="h-3 w-3 mr-1" />Utama</Badge>}
                        </div>
                        <p className="text-sm text-foreground">{a.recipient_name} • {a.phone}</p>
                        <p className="text-sm text-muted-foreground mt-1">{a.full_address}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[a.district, a.city, a.province, a.postal_code].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => openEditAddr(a)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeletingAddr(a)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    {!a.is_default && (
                      <button onClick={() => handleSetDefault(a)} className="mt-3 text-xs text-primary hover:underline">
                        Jadikan alamat utama
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg">Notifikasi</h2>
              {unreadCount > 0 && <Button onClick={markAllRead} variant="ghost" size="sm">Tandai semua dibaca</Button>}
            </div>
            {loadingNotif ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full text-left rounded-xl p-3.5 border transition ${n.is_read ? 'border-border bg-background' : 'border-primary/30 bg-primary/5'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-muted' : 'bg-primary animate-pulse'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {new Date(n.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Bahasa</p>
                <p className="text-xs text-muted-foreground">Pilih bahasa tampilan</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${lang === 'id' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>ID</span>
                <Switch checked={lang === 'en'} onCheckedChange={c => setLang(c ? 'en' : 'id')} />
                <span className={`text-sm ${lang === 'en' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>EN</span>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <Link to="/change-password">
                <Button variant="outline" className="w-full sm:w-auto"><KeyRound className="h-4 w-4 mr-2" />Ganti Password</Button>
              </Link>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Address dialog */}
      <Dialog open={addrDialog} onOpenChange={setAddrDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingAddr ? 'Edit Alamat' : 'Tambah Alamat'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Label</Label>
              <Input value={addrForm.label} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} placeholder="Rumah / Kantor" maxLength={30} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nama Penerima *</Label>
                <Input value={addrForm.recipient_name} onChange={e => setAddrForm(f => ({ ...f, recipient_name: e.target.value }))} maxLength={100} />
              </div>
              <div>
                <Label>No. Telepon *</Label>
                <Input value={addrForm.phone} onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Provinsi *</Label>
                <Input value={addrForm.province} onChange={e => setAddrForm(f => ({ ...f, province: e.target.value }))} maxLength={80} />
              </div>
              <div>
                <Label>Kota / Kabupaten *</Label>
                <Input value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} maxLength={80} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Kecamatan</Label>
                <Input value={addrForm.district} onChange={e => setAddrForm(f => ({ ...f, district: e.target.value }))} maxLength={80} />
              </div>
              <div>
                <Label>Kode Pos</Label>
                <Input value={addrForm.postal_code} onChange={e => setAddrForm(f => ({ ...f, postal_code: e.target.value }))} maxLength={10} />
              </div>
            </div>
            <div>
              <Label>Alamat Lengkap *</Label>
              <Textarea value={addrForm.full_address} onChange={e => setAddrForm(f => ({ ...f, full_address: e.target.value }))} maxLength={500} rows={3} placeholder="Jalan, no rumah, RT/RW, patokan..." />
            </div>
            
            {/* Map Picker inside Profile Address Dialog */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                📍 Tentukan Lokasi di Peta
              </Label>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Cari alamat Anda atau geser pin peta ke lokasi pengiriman Anda untuk menghitung jarak pengiriman lokal secara otomatis.
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
                      handleSearchLocation(searchQuery, mapRef.current, markerRef.current, setAddrForm);
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
                    handleSearchLocation(searchQuery, mapRef.current, markerRef.current, setAddrForm);
                  }}
                  disabled={syncingAddr}
                >
                  {syncingAddr ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cari'}
                </Button>
              </div>

              <div className="relative mt-1">
                <div id="profile-map-picker" className="h-[180px] w-full rounded-lg border border-border shadow-inner" style={{ zIndex: 1 }} />
                {syncingAddr && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg" style={{ zIndex: 999 }}>
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">Sinkronisasi peta...</span>
                    </div>
                  </div>
                )}
              </div>

              {addrForm.latitude !== null && (
                <p className="text-[11px] text-primary font-medium mt-1">
                  Koordinat terpilih: {Number(addrForm.latitude).toFixed(6)}, {Number(addrForm.longitude).toFixed(6)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={addrForm.is_default} onCheckedChange={c => setAddrForm(f => ({ ...f, is_default: c }))} />
              <Label className="cursor-pointer">Jadikan alamat utama</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddrDialog(false)}>Batal</Button>
            <Button onClick={handleSaveAddr} disabled={savingAddr}>
              {savingAddr && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingAddr} onOpenChange={o => !o && setDeletingAddr(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus alamat ini?</AlertDialogTitle>
            <AlertDialogDescription>Alamat akan dihapus permanen dan tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddr} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
