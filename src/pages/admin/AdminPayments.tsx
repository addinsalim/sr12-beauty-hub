import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Search, X, CheckCircle, AlertCircle, Calendar, DollarSign, FileText, Loader2, Eye, RefreshCw, User, Phone, MapPin, Clock, ShieldCheck, ShoppingBag, ArrowLeft, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  
  // Selected Payment for Details Modal
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch payments, related orders, addresses, and customer profiles
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch payments with orders, items, products, and addresses
      const { data: payData, error: payErr } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            *,
            addresses:address_id(*),
            order_items(*, products:product_id(name), variants:variant_id(name))
          )
        `)
        .order('created_at', { ascending: false });

      if (payErr) throw payErr;

      // 2. Fetch customer profiles and admin profiles in parallel
      let enrichedPayments = payData || [];
      if (enrichedPayments.length > 0) {
        const userIds = [...new Set(enrichedPayments.map((p: any) => p.orders?.user_id).filter(Boolean))];
        const adminIds = [...new Set(enrichedPayments.map((p: any) => p.confirmed_by).filter(Boolean))];

        const [profilesRes, adminsRes] = await Promise.all([
          userIds.length > 0
            ? supabase.from('profiles').select('user_id, full_name, phone').in('user_id', userIds)
            : Promise.resolve({ data: [] }),
          adminIds.length > 0
            ? supabase.from('profiles').select('user_id, full_name').in('user_id', adminIds)
            : Promise.resolve({ data: [] })
        ]);

        const profileMap = Object.fromEntries((profilesRes.data || []).map((p: any) => [p.user_id, p]));
        const adminMap = Object.fromEntries((adminsRes.data || []).map((a: any) => [a.user_id, a]));

        enrichedPayments = enrichedPayments.map((p: any) => ({
          ...p,
          customerProfile: p.orders ? profileMap[p.orders.user_id] : null,
          adminProfile: p.confirmed_by ? adminMap[p.confirmed_by] : null
        }));
      }

      setPayments(enrichedPayments);
    } catch (err: any) {
      toast.error('Gagal memuat data pembayaran: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook up real-time postgres changes listener for realtime updates
  useEffect(() => {
    fetchPayments();

    const channel = supabase
      .channel('admin-payments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          // Trigger silent reload on database changes
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments]);

  // Action: Confirm manual/pending payment
  const handleConfirmPayment = async (payment: any) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pengguna tidak terautentikasi');

      // 1. Update payment status
      const { error: payErr } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id
        })
        .eq('id', payment.id);

      if (payErr) throw payErr;

      // 2. Update order status to 'processing'
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', payment.order_id);

      if (orderErr) throw orderErr;

      // 3. Create customer notification
      await supabase.from('notifications').insert({
        user_id: payment.orders?.user_id,
        title: 'Pembayaran Dikonfirmasi',
        message: `Pembayaran sebesar Rp ${Number(payment.amount).toLocaleString('id-ID')} untuk pesanan ${payment.orders?.order_number} telah berhasil dikonfirmasi. Pesanan Anda kini sedang diproses.`,
        type: 'order'
      });

      toast.success(`Pembayaran untuk order ${payment.orders?.order_number} berhasil dikonfirmasi`);
      setDetailOpen(false);
      fetchPayments();
    } catch (err: any) {
      toast.error('Gagal mengonfirmasi pembayaran: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject payment & cancel order
  const handleRejectPayment = async (payment: any) => {
    if (!confirm(`Apakah Anda yakin ingin menolak pembayaran untuk pesanan ${payment.orders?.order_number}?`)) return;

    setActionLoading(true);
    try {
      // 1. Update payment status to 'failed'
      const { error: payErr } = await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      if (payErr) throw payErr;

      // 2. Update order status to 'cancelled'
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled', 
          notes: '[Ditolak] Pembayaran tidak valid / tidak masuk ke rekening toko' 
        })
        .eq('id', payment.order_id);

      if (orderErr) throw orderErr;

      // 3. Restore product/variant stock
      if (payment.orders?.order_items) {
        for (const item of payment.orders.order_items) {
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
      }

      // 4. Create customer notification
      await supabase.from('notifications').insert({
        user_id: payment.orders?.user_id,
        title: 'Pembayaran Ditolak',
        message: `Mohon maaf, pembayaran untuk pesanan ${payment.orders?.order_number} ditolak karena tidak valid. Pesanan Anda otomatis dibatalkan dan stok dikembalikan.`,
        type: 'order'
      });

      toast.success(`Pembayaran untuk order ${payment.orders?.order_number} berhasil ditolak`);
      setDetailOpen(false);
      fetchPayments();
    } catch (err: any) {
      toast.error('Gagal menolak pembayaran: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;

    if (!searchQuery) return matchesStatus && matchesMethod;

    const q = searchQuery.toLowerCase();
    const orderNum = (p.orders?.order_number || '').toLowerCase();
    const custName = (p.customerProfile?.full_name || '').toLowerCase();
    const phone = (p.customerProfile?.phone || '').toLowerCase();
    const amountStr = String(p.amount);
    const bankName = (p.bank_name || '').toLowerCase();

    return matchesStatus && matchesMethod && (
      orderNum.includes(q) ||
      custName.includes(q) ||
      phone.includes(q) ||
      amountStr.includes(q) ||
      bankName.includes(q)
    );
  });

  // Calculate stats metrics
  const totalRevenue = payments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingApprovals = payments.filter(p => p.status === 'pending').length;
  
  const codCount = payments.filter(p => p.method === 'cod').length;
  const midtransCount = payments.filter(p => p.method === 'midtrans').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200';
    }
  };

  const getStatusLabel = (st: string) => {
    if (st === 'confirmed') return 'Dikonfirmasi';
    if (st === 'failed') return 'Gagal / Ditolak';
    return 'Pending';
  };

  const getMethodLabel = (m: string) => {
    if (m === 'midtrans') return 'Midtrans (Online)';
    if (m === 'cod') return 'COD (Bayar di Tempat)';
    return m.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Kelola Pembayaran</h1>
        <p className="text-sm text-muted-foreground">Monitor laporan pembayaran customer, verifikasi transfer, dan kelola konfirmasi secara real-time.</p>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pendapatan (Sukses)</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-primary">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-500/10 text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Menunggu Konfirmasi</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-yellow-600">{pendingApprovals} Transaksi</p>
            </div>
            <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Metode Midtrans</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-blue-600">{midtransCount} Transaksi</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Metode COD</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-orange-600">{codCount} Transaksi</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari no. order, customer, nominal..."
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

        {/* Filter Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Status:</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground w-36"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="failed">Gagal / Ditolak</option>
            </select>
          </div>

          {/* Method filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Metode:</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground w-36"
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
            >
              <option value="all">Semua Metode</option>
              <option value="midtrans">Midtrans</option>
              <option value="cod">COD</option>
            </select>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchPayments} className="h-9 px-2" title="Segarkan Data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-card/30 rounded-xl border border-border">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground text-sm font-medium">Memuat data pembayaran...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-xl border border-border text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium">Tidak ada transaksi pembayaran yang ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No. Order</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Metode</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jumlah</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => {
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/10 transition">
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{p.orders?.order_number || 'N/A'}</td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {p.customerProfile?.full_name || '-'}
                      <span className="block text-[10px] text-muted-foreground font-normal">{p.customerProfile?.phone || ''}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium text-xs">{getMethodLabel(p.method)}</td>
                    <td className="px-4 py-3 font-bold text-foreground">Rp {Number(p.amount).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusBadge(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-semibold gap-1"
                          onClick={() => {
                            setSelectedPayment(p);
                            setDetailOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" /> Detail
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction Details Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <CreditCard className="h-5 w-5 text-primary" /> Rincian Transaksi & Pembayaran
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6 py-2">
              {/* Top Banner Status */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 rounded-xl border border-border bg-secondary/20 shadow-sm">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">ID Pembayaran</span>
                  <span className="font-mono text-xs text-foreground font-medium select-all">{selectedPayment.id}</span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Status Pembayaran</span>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold border ${getStatusBadge(selectedPayment.status)}`}>
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>
              </div>

              {/* Grid Context Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Column 1: Customer Details */}
                <div className="space-y-3 rounded-lg border border-border/80 bg-card p-4">
                  <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" /> Informasi Pelanggan
                  </h3>
                  <div className="text-xs space-y-1.5">
                    <p className="font-bold text-foreground text-sm">{selectedPayment.customerProfile?.full_name || '-'}</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" /> {selectedPayment.customerProfile?.phone || '-'}
                    </p>
                    {selectedPayment.orders?.addresses && (
                      <div className="pt-1.5 border-t border-border/50 text-muted-foreground space-y-0.5">
                        <span className="font-semibold text-foreground text-[10px] uppercase block mb-0.5">Alamat Pengiriman:</span>
                        <p className="flex items-start gap-1 leading-relaxed">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                          <span>
                            {selectedPayment.orders.addresses.full_address}, {selectedPayment.orders.addresses.city}, {selectedPayment.orders.addresses.province} ({selectedPayment.orders.addresses.postal_code})
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Order Context */}
                <div className="space-y-3 rounded-lg border border-border/80 bg-card p-4">
                  <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Rincian Pembayaran
                  </h3>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted-foreground">Nomor Order:</span>
                      <span className="font-mono font-bold text-foreground">{selectedPayment.orders?.order_number || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted-foreground">Metode Pembayaran:</span>
                      <span className="font-bold text-foreground">{getMethodLabel(selectedPayment.method)}</span>
                    </div>
                    {selectedPayment.bank_name && (
                      <div className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">Detail Bank:</span>
                        <span className="font-semibold text-foreground">{selectedPayment.bank_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted-foreground">Waktu Transaksi:</span>
                      <span className="text-foreground">{new Date(selectedPayment.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    {selectedPayment.status === 'confirmed' && (
                      <div className="pt-1 text-[11px] text-green-700 bg-green-500/10 p-2 rounded border border-green-200/50 space-y-0.5">
                        <p>✓ Dikonfirmasi pada: <span className="font-semibold">{new Date(selectedPayment.confirmed_at).toLocaleString('id-ID')}</span></p>
                        {selectedPayment.adminProfile && <p>✓ Oleh Administrator: <span className="font-semibold">{selectedPayment.adminProfile.full_name}</span></p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Products List */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-primary" /> Produk yang Dibeli
                </h3>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-secondary/40 border-b border-border text-[10px] font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Nama Produk</th>
                        <th className="px-3 py-2 text-center">Jumlah</th>
                        <th className="px-3 py-2 text-right">Harga Satuan</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayment.orders?.order_items?.map((item: any) => (
                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-secondary/5">
                          <td className="px-3 py-2 font-medium text-foreground">
                            {item.products?.name}
                            {item.variants?.name && <span className="block text-[10px] text-muted-foreground">Varian: {item.variants.name}</span>}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-foreground">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                          <td className="px-3 py-2 text-right font-bold text-foreground">Rp {Number(item.total).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Billing Totals Breakdown */}
              <div className="rounded-xl border border-border bg-secondary/10 p-4 max-w-sm ml-auto text-xs space-y-2 shadow-inner">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Belanja:</span>
                  <span className="text-foreground">Rp {Number(selectedPayment.orders?.subtotal || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Ongkos Kirim:</span>
                  <span className="text-foreground">
                    {Number(selectedPayment.orders?.shipping_cost) === 0 ? 'GRATIS' : `Rp ${Number(selectedPayment.orders?.shipping_cost || 0).toLocaleString('id-ID')}`}
                  </span>
                </div>
                {selectedPayment.orders?.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher Diskon:</span>
                    <span>-Rp {Number(selectedPayment.orders.discount_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-sm">
                  <span className="text-foreground">Total Pembayaran:</span>
                  <span className="text-primary">Rp {Number(selectedPayment.amount).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Upload Proof Check if applicable */}
              {selectedPayment.proof_url && (
                <div className="space-y-2 border-t border-border pt-4">
                  <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Bukti Transfer Upload</h3>
                  <div className="rounded-lg border border-border p-2 bg-secondary/10 text-center shadow-inner">
                    <img 
                      src={selectedPayment.proof_url} 
                      alt="Bukti Transfer" 
                      className="mx-auto rounded border border-border shadow-sm max-h-[300px] object-contain cursor-zoom-in"
                      onClick={() => window.open(selectedPayment.proof_url, '_blank')}
                    />
                    <p className="text-[10px] text-muted-foreground mt-2 italic">* Klik gambar untuk memperbesar di tab baru.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={() => setDetailOpen(false)}>Tutup</Button>
            
            {selectedPayment && selectedPayment.status === 'pending' && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={actionLoading}
                  onClick={() => handleRejectPayment(selectedPayment)}
                >
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Tolak Pembayaran
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  disabled={actionLoading}
                  onClick={() => handleConfirmPayment(selectedPayment)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Konfirmasi Pembayaran
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
