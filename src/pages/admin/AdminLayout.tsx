import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart, CreditCard,
  Truck, BarChart3, LogOut, Ticket, MessageCircle, Store, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingCart },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
  { href: '/admin/shipments', label: 'Pengiriman', icon: Truck },
  { href: '/admin/vouchers', label: 'Voucher', icon: Ticket },
  { href: '/admin/chat', label: 'Pesan', icon: MessageCircle },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/login');
  }, [user, isAdmin, loading, navigate]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!user || !isAdmin) return null;

  const isActive = (href: string) =>
    href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <Link to="/" className="font-display text-xl font-bold text-foreground">
            SR12 <span className="text-gradient-gold">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          {sidebarLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(link.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <p className="text-xs text-muted-foreground mb-2 truncate px-2">{profile?.full_name || user.email}</p>
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-primary/10 text-primary font-medium hover:bg-primary/20 transition mb-1">
            <Store className="h-4 w-4" /> Lihat Toko
          </Link>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition">
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* ── Mobile Header ── */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <Link to="/admin" className="font-display text-lg font-bold">
            SR12 <span className="text-gradient-gold">Admin</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* ── Mobile Drawer Overlay ── */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-72 flex flex-col bg-card border-l border-border shadow-xl lg:hidden animate-in slide-in-from-right">
              {/* Drawer header */}
              <div className="flex h-14 items-center justify-between px-5 border-b border-border">
                <span className="font-display text-lg font-bold">
                  SR12 <span className="text-gradient-gold">Admin</span>
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
                {sidebarLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                      isActive(link.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <link.icon className="h-5 w-5 shrink-0" />
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Drawer footer */}
              <div className="border-t border-border p-3">
                <p className="text-xs text-muted-foreground mb-2 truncate px-2">{profile?.full_name || user.email}</p>
                <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm bg-primary/10 text-primary font-medium hover:bg-primary/20 transition mb-1">
                  <Store className="h-4 w-4" /> Lihat Toko
                </Link>
                <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition">
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
