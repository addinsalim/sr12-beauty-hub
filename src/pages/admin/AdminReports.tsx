import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Download, FileText, Sheet, FileDown, TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2, 160 60% 45%))', 'hsl(var(--chart-3, 30 80% 55%))', 'hsl(var(--chart-4, 280 65% 60%))', 'hsl(var(--chart-5, 340 75% 55%))'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const AdminReports = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-report-orders', year],
    queryFn: async () => {
      const start = `${year}-01-01`;
      const end = `${year}-12-31T23:59:59`;
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, subtotal, shipping_cost, total, created_at')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['admin-report-items', year],
    queryFn: async () => {
      const start = `${year}-01-01`;
      const end = `${year}-12-31T23:59:59`;
      const { data, error } = await supabase
        .from('order_items')
        .select('quantity, total, product_id, created_at')
        .gte('created_at', start)
        .lte('created_at', end);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-report-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, name');
      if (error) throw error;
      return data || [];
    },
  });

  // Summary stats
  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed' || o.status === 'shipped' || o.status === 'processing');
    const totalRevenue = completed.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = orders.length;
    const completedOrders = completed.length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    return { totalRevenue, totalOrders, completedOrders, cancelledOrders };
  }, [orders]);

  // Monthly revenue chart
  const monthlyRevenue = useMemo(() => {
    const map = Array.from({ length: 12 }, (_, i) => ({ month: MONTHS[i], revenue: 0, orders: 0 }));
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const m = new Date(o.created_at).getMonth();
      map[m].revenue += Number(o.total);
      map[m].orders += 1;
    });
    return map;
  }, [orders]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    const labels: Record<string, string> = {
      pending_payment: 'Menunggu Pembayaran',
      processing: 'Diproses',
      shipped: 'Dikirim',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    orders.forEach(o => {
      const label = labels[o.status] || o.status;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    orderItems.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      const name = prod?.name || 'Unknown';
      if (!map[item.product_id]) map[item.product_id] = { name, qty: 0, revenue: 0 };
      map[item.product_id].qty += item.quantity;
      map[item.product_id].revenue += Number(item.total);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [orderItems, products]);

  // Export helpers
  const getReportData = () => monthlyRevenue.map(m => ({
    Bulan: m.month,
    'Jumlah Pesanan': m.orders,
    'Pendapatan (Rp)': m.revenue,
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Laporan Penjualan SR12 - ${year}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Total Pendapatan: ${formatRupiah(stats.totalRevenue)}`, 14, 32);
    doc.text(`Total Pesanan: ${stats.totalOrders} | Selesai: ${stats.completedOrders} | Batal: ${stats.cancelledOrders}`, 14, 39);

    autoTable(doc, {
      startY: 48,
      head: [['Bulan', 'Jumlah Pesanan', 'Pendapatan']],
      body: monthlyRevenue.map(m => [m.month, m.orders, formatRupiah(m.revenue)]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    if (topProducts.length) {
      doc.text('Top Produk Terlaris', 14, finalY + 12);
      autoTable(doc, {
        startY: finalY + 18,
        head: [['Produk', 'Qty Terjual', 'Pendapatan']],
        body: topProducts.map(p => [p.name, p.qty, formatRupiah(p.revenue)]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
      });
    }

    doc.save(`Laporan-SR12-${year}.pdf`);
  };

  const exportExcel = () => {
    const ws1 = XLSX.utils.json_to_sheet(getReportData());
    const ws2 = XLSX.utils.json_to_sheet(topProducts.map(p => ({ Produk: p.name, 'Qty Terjual': p.qty, 'Pendapatan (Rp)': p.revenue })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Penjualan Bulanan');
    XLSX.utils.book_append_sheet(wb, ws2, 'Produk Terlaris');
    XLSX.writeFile(wb, `Laporan-SR12-${year}.xlsx`);
  };

  const exportDoc = () => {
    let html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#8B5CF6;color:#fff}</style></head><body>`;
    html += `<h1>Laporan Penjualan SR12 - ${year}</h1>`;
    html += `<p><strong>Total Pendapatan:</strong> ${formatRupiah(stats.totalRevenue)}</p>`;
    html += `<p><strong>Total Pesanan:</strong> ${stats.totalOrders} | <strong>Selesai:</strong> ${stats.completedOrders} | <strong>Batal:</strong> ${stats.cancelledOrders}</p>`;
    html += `<h2>Penjualan Bulanan</h2><table><tr><th>Bulan</th><th>Pesanan</th><th>Pendapatan</th></tr>`;
    monthlyRevenue.forEach(m => { html += `<tr><td>${m.month}</td><td>${m.orders}</td><td>${formatRupiah(m.revenue)}</td></tr>`; });
    html += `</table>`;
    if (topProducts.length) {
      html += `<h2>Top Produk Terlaris</h2><table><tr><th>Produk</th><th>Qty</th><th>Pendapatan</th></tr>`;
      topProducts.forEach(p => { html += `<tr><td>${p.name}</td><td>${p.qty}</td><td>${formatRupiah(p.revenue)}</td></tr>`; });
      html += `</table>`;
    }
    html += `</body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Laporan-SR12-${year}.doc`;
    a.click();
  };

  const chartConfig = {
    revenue: { label: 'Pendapatan', color: 'hsl(var(--primary))' },
    orders: { label: 'Pesanan', color: 'hsl(var(--chart-2, 160 60% 45%))' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Laporan Penjualan</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Sheet className="mr-1.5 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportDoc}>
            <FileDown className="mr-1.5 h-4 w-4" /> Document
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pendapatan</p>
              <p className="text-lg font-bold text-foreground">{formatRupiah(stats.totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5"><ShoppingCart className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pesanan</p>
              <p className="text-lg font-bold text-foreground">{stats.totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-500/10 p-2.5"><Package className="h-5 w-5 text-green-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Pesanan Selesai</p>
              <p className="text-lg font-bold text-foreground">{stats.completedOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-destructive/10 p-2.5"><TrendingUp className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Pesanan Batal</p>
              <p className="text-lg font-bold text-foreground">{stats.cancelledOrders}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
          <TabsTrigger value="orders">Pesanan</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="products">Produk Terlaris</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader><CardTitle className="text-base">Pendapatan Bulanan {year}</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={monthlyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatRupiah(Number(value))} />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle className="text-base">Jumlah Pesanan Bulanan {year}</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <LineChart data={monthlyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader><CardTitle className="text-base">Distribusi Status Pesanan</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="h-[350px] w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle className="text-base">Top 10 Produk Terlaris</CardTitle></CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Belum ada data produk terjual.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left font-medium text-muted-foreground">#</th>
                        <th className="pb-2 text-left font-medium text-muted-foreground">Produk</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Qty Terjual</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                          <td className="py-2.5 font-medium text-foreground">{p.name}</td>
                          <td className="py-2.5 text-right text-foreground">{p.qty}</td>
                          <td className="py-2.5 text-right text-foreground">{formatRupiah(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
