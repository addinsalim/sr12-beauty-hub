import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, CreditCard, Truck, BarChart3, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingCart },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
  { href: '/admin/shipments', label: 'Pengiriman', icon: Truck },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link to="/" className="font-display text-xl font-bold text-foreground">
            SR12 <span className="text-gradient-gold">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {sidebarLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                location.pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 text-sm text-muted-foreground truncate">{profile?.full_name || user.email}</div>
          <div className="flex gap-2">
            <Link to="/" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">
              <ChevronLeft className="h-4 w-4" /> Kembali
            </Link>
            <button onClick={signOut} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <Link to="/admin" className="font-display text-lg font-bold">SR12 <span className="text-gradient-gold">Admin</span></Link>
          <div className="flex gap-2">
            {sidebarLinks.slice(0, 4).map(link => (
              <Link key={link.href} to={link.href} className={`rounded-lg p-2 ${location.pathname === link.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                <link.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
