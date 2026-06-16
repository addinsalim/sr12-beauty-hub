import { useEffect, useState, useCallback } from 'react';
import { Truck, MapPin, Settings, Globe, Plus, Trash2, Edit, Save, Loader2, Search, X, User, Check, Package, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", 
  "Bengkulu", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Lampung", 
  "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", 
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat", 
  "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", 
  "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", 
  "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua", "Papua Barat", 
  "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"
];

const AdminShipments = () => {
  const [activeTab, setActiveTab] = useState<'configs' | 'zones' | 'shipments'>('shipments');
  const [loading, setLoading] = useState(true);

  // Tab 1: Configs
  const [configs, setConfigs] = useState<any>({
    store_lat: -6.7027,
    store_lng: 107.5645,
    local_delivery_active: true,
    cod_active: true,
    cod_min_purchase: 50000,
    zone_shipping_active: true
  });
  const [saveConfigLoading, setSaveConfigLoading] = useState(false);

  // Tab 2: Zones
  const [zones, setZones] = useState<any[]>([]);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [zoneForm, setZoneForm] = useState<any>({
    name: '',
    cost: 20000,
    provinces: [] as string[]
  });
  const [saveZoneLoading, setSaveZoneLoading] = useState(false);

  // Tab 3: Shipments
  const [shipments, setShipments] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editShipmentState, setEditShipmentState] = useState<Record<string, { courier: string; tracking_number: string; courier_user_id: string; status: string }>>({});

  // Fetch configs, zones, shipments
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Configs
      const { data: configData } = await supabase
        .from('shipping_configs')
        .select('*')
        .maybeSingle();
      if (configData) {
        setConfigs(configData);
      }

      // 2. Zones
      const { data: zonesData } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('name', { ascending: true });
      if (zonesData) {
        setZones(zonesData);
      }

      // 3. Shipments
      const { data: shipmentsData, error: shipmentsErr } = await supabase
        .from('shipments')
        .select('*, orders(*, addresses:address_id(*))')
        .order('created_at', { ascending: false });
      
      if (shipmentsErr) throw shipmentsErr;

      let enrichedShipments: any[] = [];
      if (shipmentsData && shipmentsData.length > 0) {
        const userIds = [...new Set(shipmentsData.map((s: any) => s.orders?.user_id).filter(Boolean))];
        let profileMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, phone')
            .in('user_id', userIds);
          profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
        }
        enrichedShipments = shipmentsData.map((s: any) => ({
          ...s,
          customerProfile: s.orders ? profileMap[s.orders.user_id] : null
        }));
      }
      setShipments(enrichedShipments);

      // Initialize edit state for shipments
      const initialEditState: Record<string, any> = {};
      enrichedShipments.forEach((s: any) => {
        initialEditState[s.id] = {
          courier: s.courier || '',
          tracking_number: s.tracking_number || '',
          courier_user_id: s.courier_user_id || '',
          status: s.status || 'pending'
        };
      });
      setEditShipmentState(initialEditState);

      // 4. Courier users
      const { data: courierRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'courier');
      
      if (courierRoles && courierRoles.length > 0) {
        const courierIds = courierRoles.map(cr => cr.user_id);
        const { data: courierProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .in('user_id', courierIds);
        setCouriers(courierProfiles || []);
      } else {
        setCouriers([]);
      }

    } catch (err: any) {
      toast.error('Gagal mengambil data pengiriman: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab 1 Actions
  const handleSaveConfigs = async () => {
    setSaveConfigLoading(true);
    try {
      const payload = {
        store_lat: Number(configs.store_lat),
        store_lng: Number(configs.store_lng),
        local_delivery_active: !!configs.local_delivery_active,
        cod_active: !!configs.cod_active,
        cod_min_purchase: Number(configs.cod_min_purchase),
        zone_shipping_active: !!configs.zone_shipping_active,
        updated_at: new Date().toISOString()
      };

      if (configs.id) {
        const { error } = await supabase
          .from('shipping_configs')
          .update(payload)
          .eq('id', configs.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipping_configs')
          .insert(payload);
        if (error) throw error;
      }
      toast.success('Pengaturan pengiriman berhasil disimpan');
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setSaveConfigLoading(false);
    }
  };

  // Tab 2 Actions
  const handleOpenZoneDialog = (zone: any = null) => {
    if (zone) {
      setSelectedZone(zone);
      setZoneForm({
        name: zone.name,
        cost: Number(zone.cost),
        provinces: zone.provinces || []
      });
    } else {
      setSelectedZone(null);
      setZoneForm({
        name: '',
        cost: 20000,
        provinces: []
      });
    }
    setZoneDialogOpen(true);
  };

  const handleToggleProvince = (province: string) => {
    setZoneForm((prev: any) => {
      const exists = prev.provinces.includes(province);
      if (exists) {
        return {
          ...prev,
          provinces: prev.provinces.filter((p: string) => p !== province)
        };
      } else {
        return {
          ...prev,
          provinces: [...prev.provinces, province]
        };
      }
    });
  };

  const handleSaveZone = async () => {
    if (!zoneForm.name.trim()) {
      toast.error('Nama zona wajib diisi');
      return;
    }
    if (zoneForm.provinces.length === 0) {
      toast.error('Pilih minimal satu provinsi untuk zona ini');
      return;
    }

    setSaveZoneLoading(true);
    try {
      const payload = {
        name: zoneForm.name.trim(),
        cost: Number(zoneForm.cost),
        provinces: zoneForm.provinces
      };

      if (selectedZone) {
        const { error } = await supabase
          .from('shipping_zones')
          .update(payload)
          .eq('id', selectedZone.id);
        if (error) throw error;
        toast.success(`Zona ${payload.name} berhasil diperbarui`);
      } else {
        const { error } = await supabase
          .from('shipping_zones')
          .insert(payload);
        if (error) throw error;
        toast.success(`Zona ${payload.name} berhasil ditambahkan`);
      }
      setZoneDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan zona: ' + err.message);
    } finally {
      setSaveZoneLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus zona "${name}"?`)) return;
    try {
      const { error } = await supabase
        .from('shipping_zones')
        .delete()
        .eq('id', zoneId);
      if (error) throw error;
      toast.success(`Zona "${name}" berhasil dihapus`);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menghapus zona: ' + err.message);
    }
  };

  // Tab 3 Actions
  const handleUpdateShipmentState = (shipmentId: string, key: string, value: string) => {
    setEditShipmentState(prev => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        [key]: value
      }
    }));
  };

  const handleSaveShipmentChanges = async (shipmentId: string, orderId: string) => {
    const editData = editShipmentState[shipmentId];
    if (!editData) return;

    try {
      const updateData: any = {
        courier: editData.courier.trim() || null,
        tracking_number: editData.tracking_number.trim() || null,
        status: editData.status,
        courier_user_id: editData.courier_user_id || null,
      };

      // Set timestamp if status changes to shipped / delivered
      const currentShipment = shipments.find(s => s.id === shipmentId);
      if (editData.status === 'shipped' && currentShipment?.status !== 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (editData.status === 'delivered' && currentShipment?.status !== 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        if (!currentShipment?.shipped_at) {
          updateData.shipped_at = new Date().toISOString();
        }
      }

      const { error: shipmentErr } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);
      
      if (shipmentErr) throw shipmentErr;

      // Sync order status
      let newOrderStatus = '';
      if (editData.status === 'shipped') {
        newOrderStatus = 'shipped';
      } else if (editData.status === 'delivered') {
        newOrderStatus = 'completed';
      } else if (editData.status === 'pending') {
        newOrderStatus = 'processing';
      }

      if (newOrderStatus) {
        const { error: orderErr } = await supabase
          .from('orders')
          .update({ status: newOrderStatus })
          .eq('id', orderId);
        
        if (orderErr) throw orderErr;
      }

      // Send notifications
      const user_id = currentShipment?.orders?.user_id;
      const orderNum = currentShipment?.orders?.order_number;
      if (user_id) {
        let title = '';
        let message = '';
        if (editData.status === 'shipped') {
          title = 'Pesanan Dikirim';
          message = `Pesanan Anda ${orderNum} sedang dikirim via ${editData.courier || 'Kurir'}.${editData.tracking_number ? ` No. Resi: ${editData.tracking_number}` : ''}`;
        } else if (editData.status === 'delivered') {
          title = 'Pesanan Diterima';
          message = `Pesanan Anda ${orderNum} telah berhasil dikirim dan diterima. Terima kasih telah berbelanja!`;
        }

        if (title && message) {
          await supabase.from('notifications').insert({
            user_id,
            title,
            message,
            type: 'order'
          });
        }
      }

      toast.success('Informasi pengiriman berhasil diperbarui');
      fetchData();
    } catch (err: any) {
      toast.error('Gagal memperbarui pengiriman: ' + err.message);
    }
  };

  const filteredShipments = shipments.filter(s => {
    const editData = editShipmentState[s.id] || { courier: '', tracking_number: '', courier_user_id: '', status: 'pending' };
    const matchesStatus = statusFilter === 'all' || editData.status === statusFilter;
    
    if (!searchQuery) return matchesStatus;
    
    const q = searchQuery.toLowerCase();
    const orderNum = (s.orders?.order_number || '').toLowerCase();
    const custName = (s.customerProfile?.full_name || '').toLowerCase();
    const phone = (s.customerProfile?.phone || '').toLowerCase();
    const courier = (s.courier || '').toLowerCase();
    const tracking = (s.tracking_number || '').toLowerCase();
    
    return matchesStatus && (
      orderNum.includes(q) || 
      custName.includes(q) || 
      phone.includes(q) || 
      courier.includes(q) || 
      tracking.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Sistem Pengiriman</h1>
          <p className="text-sm text-muted-foreground">Kelola metode pengiriman, ongkos kirim zona, dan tracking resi.</p>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${activeTab === 'shipments' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Truck className="h-4 w-4" />
          Status Pengiriman Pesanan
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${activeTab === 'zones' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Globe className="h-4 w-4" />
          Kelola Zona Pengiriman
        </button>
        <button
          onClick={() => setActiveTab('configs')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${activeTab === 'configs' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Settings className="h-4 w-4" />
          Metode & Alamat Toko
        </button>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-24 bg-card/30 rounded-xl border border-border">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground text-sm font-medium">Memuat data pengiriman...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: Configs */}
          {activeTab === 'configs' && (
            <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Pengaturan Lokasi Toko & Metode Pengiriman
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_lat">Latitude Pusat Toko</Label>
                  <Input
                    id="store_lat"
                    type="number"
                    step="0.000001"
                    value={configs.store_lat}
                    onChange={e => setConfigs({ ...configs, store_lat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_lng">Longitude Pusat Toko</Label>
                  <Input
                    id="store_lng"
                    type="number"
                    step="0.000001"
                    value={configs.store_lng}
                    onChange={e => setConfigs({ ...configs, store_lng: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Wanayasa, Purwakarta Pusat default: <code>-6.7027</code>, <code>107.5645</code>.</p>

              <hr className="border-border" />

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Metode Pengiriman Aktif</h3>

                {/* Local Delivery Toggle */}
                <div className="flex items-start justify-between p-3 rounded-lg border border-border bg-secondary/10">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="font-semibold text-sm text-foreground">Layanan Antar Toko (Local Delivery)</Label>
                    <p className="text-xs text-muted-foreground">Aktifkan pengantaran kurir toko untuk jarak radius maksimal 10 km dari toko.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={configs.local_delivery_active}
                    onChange={e => setConfigs({ ...configs, local_delivery_active: e.target.checked })}
                    className="h-5 w-5 accent-primary cursor-pointer mt-1"
                  />
                </div>

                {/* COD Toggle */}
                <div className="flex flex-col gap-3 p-3 rounded-lg border border-border bg-secondary/10">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5 max-w-[80%]">
                      <Label className="font-semibold text-sm text-foreground">Cash On Delivery (COD)</Label>
                      <p className="text-xs text-muted-foreground">Aktifkan pembayaran tunai di tempat untuk radius 10 km.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configs.cod_active}
                      onChange={e => setConfigs({ ...configs, cod_active: e.target.checked })}
                      className="h-5 w-5 accent-primary cursor-pointer mt-1"
                    />
                  </div>
                  {configs.cod_active && (
                    <div className="w-full max-w-xs space-y-1.5 pt-2 border-t border-border/40">
                      <Label htmlFor="cod_min" className="text-xs">Minimal Belanja COD (Rp)</Label>
                      <Input
                        id="cod_min"
                        type="number"
                        value={configs.cod_min_purchase}
                        onChange={e => setConfigs({ ...configs, cod_min_purchase: e.target.value })}
                        placeholder="50000"
                        className="h-9"
                      />
                    </div>
                  )}
                </div>

                {/* Zone Shipping Toggle */}
                <div className="flex items-start justify-between p-3 rounded-lg border border-border bg-secondary/10">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="font-semibold text-sm text-foreground">Pengiriman Berdasarkan Zona</Label>
                    <p className="text-xs text-muted-foreground">Aktifkan pengiriman reguler ekspedisi untuk pelanggan di luar radius pengantaran lokal toko.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={configs.zone_shipping_active}
                    onChange={e => setConfigs({ ...configs, zone_shipping_active: e.target.checked })}
                    className="h-5 w-5 accent-primary cursor-pointer mt-1"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveConfigs} disabled={saveConfigLoading}>
                  {saveConfigLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Simpan Pengaturan
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: Zones */}
          {activeTab === 'zones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">Pengaturan Ongkir Wilayah / Provinsi</h2>
                <Button onClick={() => handleOpenZoneDialog()} size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Tambah Zona
                </Button>
              </div>

              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {zones.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-card rounded-xl border border-border text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-medium">Belum ada zona pengiriman dikonfigurasi.</p>
                  </div>
                ) : (
                  zones.map((z: any) => (
                    <div key={z.id} className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base text-foreground">{z.name}</h3>
                            <p className="text-lg font-bold text-primary mt-1">Rp {Number(z.cost).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenZoneDialog(z)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteZone(z.id, z.name)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Provinsi Terhubung ({z.provinces?.length || 0}):</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {z.provinces?.map((p: string) => (
                              <span key={p} className="text-[10px] bg-secondary/80 text-foreground px-2 py-0.5 rounded-full border border-border/50">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Zone Add/Edit Dialog */}
              <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedZone ? 'Ubah Zona Pengiriman' : 'Tambah Zona Pengiriman Baru'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="zone_name">Nama Zona *</Label>
                        <Input
                          id="zone_name"
                          value={zoneForm.name}
                          onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })}
                          placeholder="Contoh: Jawa Barat / Bali & Nusa Tenggara"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="zone_cost">Tarif Ongkos Kirim (Rp) *</Label>
                        <Input
                          id="zone_cost"
                          type="number"
                          value={zoneForm.cost}
                          onChange={e => setZoneForm({ ...zoneForm, cost: e.target.value })}
                          placeholder="20000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="font-semibold text-sm">Hubungkan Provinsi ({zoneForm.provinces.length} terpilih)</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant="link" 
                            type="button" 
                            className="text-xs p-0 h-auto" 
                            onClick={() => setZoneForm((prev: any) => ({ ...prev, provinces: [...PROVINCES] }))}
                          >
                            Pilih Semua
                          </Button>
                          <span className="text-muted-foreground text-xs">|</span>
                          <Button 
                            variant="link" 
                            type="button" 
                            className="text-xs p-0 h-auto text-destructive" 
                            onClick={() => setZoneForm((prev: any) => ({ ...prev, provinces: [] }))}
                          >
                            Hapus Semua
                          </Button>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal mb-2">Pilih provinsi yang akan dikenakan tarif ongkir zona ini.</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-border max-h-[200px] overflow-y-auto bg-secondary/20 shadow-inner">
                        {PROVINCES.map((p) => {
                          const isChecked = zoneForm.provinces.includes(p);
                          return (
                            <label key={p} className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer select-none transition ${isChecked ? 'bg-primary/5 border-primary font-medium text-primary' : 'bg-card border-border hover:border-muted-foreground/30 text-card-foreground'}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleProvince(p)}
                                className="accent-primary h-3.5 w-3.5 shrink-0"
                              />
                              <span className="truncate">{p}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setZoneDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleSaveZone} disabled={saveZoneLoading}>
                      {saveZoneLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Simpan Zona
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* TAB 3: Shipments */}
          {activeTab === 'shipments' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari no. pesanan, pelanggan, resi..."
                    className="pl-9 pr-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">Status:</span>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-1.5 text-sm w-full sm:w-40 text-foreground"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="shipped">Dalam Pengiriman</option>
                    <option value="delivered">Diterima</option>
                  </select>
                </div>
              </div>

              {filteredShipments.length === 0 ? (
                <div className="py-20 text-center bg-card rounded-xl border border-border text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium">Tidak ada transaksi pengiriman ditemukan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredShipments.map((s: any) => {
                    const editVal = editShipmentState[s.id] || { courier: '', tracking_number: '', courier_user_id: '', status: 'pending' };
                    const isChanged = 
                      editVal.courier !== (s.courier || '') ||
                      editVal.tracking_number !== (s.tracking_number || '') ||
                      editVal.courier_user_id !== (s.courier_user_id || '') ||
                      editVal.status !== (s.status || 'pending');

                    const getStatusColor = (st: string) => {
                      switch (st) {
                        case 'shipped':
                          return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
                        case 'delivered':
                          return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200';
                        default:
                          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
                      }
                    };

                    const getStatusLabel = (st: string) => {
                      if (st === 'shipped') return 'Dikirim';
                      if (st === 'delivered') return 'Diterima';
                      return 'Pending';
                    };

                    return (
                      <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/50 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-mono">
                              {s.orders?.order_number || 'N/A'}
                            </span>
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(s.status)}`}>
                              {getStatusLabel(s.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Dibuat: {new Date(s.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>

                        {/* Customer & Address details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Penerima</h4>
                            <p className="font-bold text-foreground text-sm flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-primary" />
                              {s.customerProfile?.full_name || '-'} {s.customerProfile?.phone ? `(${s.customerProfile.phone})` : ''}
                            </p>
                            {s.orders?.addresses && (
                              <p className="text-muted-foreground mt-1 leading-relaxed">
                                {s.orders.addresses.full_address}, {s.orders.addresses.city}, {s.orders.addresses.province} ({s.orders.addresses.postal_code})
                              </p>
                            )}
                          </div>

                          {/* Distance coordinate indicator if Local Delivery */}
                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Detail Pengiriman</h4>
                            <div className="flex flex-col gap-1">
                              <p className="font-medium text-foreground">
                                Metode Checkout: <span className="font-bold text-primary capitalize">{s.orders?.shipping_method === 'local' ? 'Antar Toko' : 'Zona / Reguler'}</span>
                              </p>
                              <p className="text-muted-foreground">
                                Ongkos Kirim: <span className="font-semibold text-foreground">Rp {Number(s.orders?.shipping_cost || 0).toLocaleString('id-ID')}</span>
                              </p>
                              {s.orders?.addresses?.latitude && s.orders?.addresses?.longitude && (
                                <p className="text-[11px] text-primary">
                                  📍 Koordinat Alamat: {Number(s.orders.addresses.latitude).toFixed(6)}, {Number(s.orders.addresses.longitude).toFixed(6)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Editable management fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-secondary/20 p-3.5 rounded-lg border border-border/40">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Ekspedisi / Kurir</Label>
                            <Input
                              value={editVal.courier}
                              onChange={e => handleUpdateShipmentState(s.id, 'courier', e.target.value)}
                              placeholder="Kurir Toko / JNE / J&T"
                              className="h-9 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Nomor Resi (Tracking)</Label>
                            <Input
                              value={editVal.tracking_number}
                              onChange={e => handleUpdateShipmentState(s.id, 'tracking_number', e.target.value)}
                              placeholder="Input nomor resi..."
                              className="h-9 text-xs font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Tugaskan Kurir</Label>
                            <select
                              value={editVal.courier_user_id}
                              onChange={e => handleUpdateShipmentState(s.id, 'courier_user_id', e.target.value)}
                              className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                            >
                              <option value="">-- Tanpa Kurir Khusus --</option>
                              {couriers.map(c => (
                                <option key={c.user_id} value={c.user_id}>{c.full_name} ({c.phone || 'No Phone'})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Ubah Status Pengiriman</Label>
                            <select
                              value={editVal.status}
                              onChange={e => handleUpdateShipmentState(s.id, 'status', e.target.value)}
                              className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                            >
                              <option value="pending">Pending (Diproses)</option>
                              <option value="shipped">Shipped (Dalam Pengiriman)</option>
                              <option value="delivered">Delivered (Telah Diterima)</option>
                            </select>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            disabled={!isChanged}
                            className={`gap-1.5 text-xs h-8 ${isChanged ? 'bg-primary shadow-sm' : 'bg-muted text-muted-foreground opacity-60'}`}
                            onClick={() => handleSaveShipmentChanges(s.id, s.order_id)}
                          >
                            <Save className="h-3.5 w-3.5" /> Simpan Update
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminShipments;
