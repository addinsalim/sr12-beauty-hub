import { useEffect, useState } from 'react';
import { Package, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/supabaseHelpers';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, revenue: 0 });

  useEffect(() => {
    const load = async () => {
      const [products, profiles, orders] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total, status'),
      ]);
      const completedOrders = (orders.data || []).filter((o: any) => o.status === 'completed');
      const revenue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      setStats({
        products: products.count || 0,
        users: profiles.count || 0,
        orders: (orders.data || []).length,
        revenue,
      });
    };
    load();
  }, []);

  const cards = [
    { label: 'Total Produk', value: stats.products, icon: Package, color: 'text-blue-500' },
    { label: 'Total Pengguna', value: stats.users, icon: Users, color: 'text-green-500' },
    { label: 'Total Pesanan', value: stats.orders, icon: ShoppingCart, color: 'text-orange-500' },
    { label: 'Total Pendapatan', value: formatPrice(stats.revenue), icon: DollarSign, color: 'text-primary' },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Dashboard Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
