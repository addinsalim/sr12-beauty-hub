import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, Globe, Home, Package, Info, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t, lang, setLang } = useI18n();
  const location = useLocation();
  const { user, isAdmin, profile, signOut } = useAuth();
  const { totalItems } = useCart();

  const navLinks = [
    { href: '/', label: t.nav.home, icon: Home },
    { href: '/products', label: t.nav.products, icon: Package },
    { href: '/products?category=parfum', label: t.nav.parfum },
    { href: '/products?category=kosmetik', label: t.nav.kosmetik },
    { href: '/products?category=skincare', label: t.nav.skincare },
    { href: '/about', label: t.nav.about, icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar — gradient shimmer */}
      <div className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[gradient-shift_6s_ease_infinite] bg-[length:200%_100%]" />
        <div className="container relative mx-auto flex items-center justify-between px-4 py-1.5 text-[10px] sm:text-xs font-body">
          <span className="flex items-center gap-1.5 truncate">✨ Free Ongkir untuk pembelian di atas Rp200.000</span>
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 transition-all hover:bg-primary-foreground/15 hover:scale-105"
          >
            <Globe className="h-3 w-3" />
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
        </div>
      </div>

      {/* Main nav — glassmorphism */}
      <div className="glass border-b border-border/40">
        <div className="container mx-auto flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              SR12 <span className="text-gradient-gold">Store</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`underline-grow rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-300 ${location.pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop & Mobile search */}
            <div className="relative hidden sm:block">
              {isSearchOpen ? (
                <div className="flex items-center rounded-full glass px-3 py-1.5 animate-scale-in">
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t.nav.search}
                    className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                    onBlur={() => setIsSearchOpen(false)}
                  />
                  <button onClick={() => setIsSearchOpen(false)}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-glow hover:scale-110"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="rounded-full p-2.5 text-muted-foreground active:bg-secondary sm:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Auth Block */}
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                {isAdmin && (
                  <Link to="/admin" className="rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:scale-110">
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                )}
                <Link to="/my-orders" className="rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:scale-110">
                  <Package className="h-5 w-5" />
                </Link>
                <div className="flex items-center bg-secondary/50 rounded-full px-3 py-1 border border-border">
                  <span className="text-sm font-medium truncate max-w-[100px] text-foreground">{profile?.full_name || user.email?.split('@')[0]}</span>
                </div>
                <button onClick={signOut} className="rounded-full p-2 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500 hover:scale-110">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:scale-110 sm:flex">
                <User className="h-5 w-5" />
              </Link>
            )}

            <Link
              to="/cart"
              className="relative rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:scale-110"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground animate-pulse-glow">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary hover:scale-110 lg:hidden"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-md animate-fade-in lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-0 top-0 z-50 max-h-[85vh] overflow-y-auto rounded-b-3xl border-b border-border/50 glass-strong shadow-elegant animate-slide-down lg:hidden">
            {/* Mobile header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <span className="font-display text-xl font-bold text-foreground">
                SR12 <span className="text-gradient-gold">Store</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 transition hover:bg-secondary hover:scale-110"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Mobile search bar */}
            <div className="px-4 py-3">
              <div className="flex items-center rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5">
                <Search className="mr-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t.nav.search}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <nav className="flex flex-col px-3 pb-3">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-all active:bg-secondary ${
                    location.pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {link.icon && <link.icon className="h-5 w-5" />}
                  {!link.icon && <span className="h-5 w-5" />}
                  {link.label}
                </Link>
              ))}

              <div className="my-2 mx-4 border-t border-border/30" />

              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-foreground hover:bg-secondary/50">
                      <LayoutDashboard className="h-5 w-5 text-primary" /> Admin Dashboard
                    </Link>
                  )}
                  <Link to="/my-orders" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-foreground hover:bg-secondary/50">
                    <Package className="h-5 w-5 text-primary" /> Pesanan Saya
                  </Link>
                  <button onClick={() => { signOut(); setIsOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-destructive hover:bg-red-500/10">
                    <LogOut className="h-5 w-5 text-destructive" /> Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-foreground hover:bg-secondary/50">
                    <LogIn className="h-5 w-5 text-primary" /> {t.nav.login}
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-foreground hover:bg-secondary/50">
                    <UserPlus className="h-5 w-5 text-primary" /> {t.nav.register}
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
