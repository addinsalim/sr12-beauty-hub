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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5 text-[10px] sm:text-xs font-body">
          <span className="truncate">✨ Free Ongkir pembelian di atas Rp200.000</span>
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 transition hover:bg-primary-foreground/10 active:bg-primary-foreground/20"
          >
            <Globe className="h-3 w-3" />
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            SR12 <span className="text-gradient-gold">Store</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground ${
                location.pathname === link.href
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile search */}
          {isSearchOpen && (
            <div className="fixed inset-x-0 top-0 z-[60] flex items-center gap-2 bg-background px-3 py-3 shadow-lg animate-fade-in sm:hidden">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder={t.nav.search}
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="rounded-full p-2 active:bg-secondary"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Desktop search */}
          <div className="relative hidden sm:block">
            {isSearchOpen ? (
              <div className="flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 animate-scale-in">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t.nav.search}
                  className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                  onBlur={() => setIsSearchOpen(false)}
                />
                <button onClick={() => setIsSearchOpen(false)}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Mobile search trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="rounded-full p-2.5 text-muted-foreground active:bg-secondary sm:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              {isAdmin && (
                <Link to="/admin" className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              )}
              <span className="text-sm text-muted-foreground truncate max-w-[100px]">{profile?.full_name || user.email?.split('@')[0]}</span>
              <button onClick={signOut} className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:flex">
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link
            to="/cart"
            className="relative rounded-full p-2.5 text-muted-foreground transition active:bg-secondary sm:p-2 sm:hover:bg-secondary sm:hover:text-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {totalItems}
            </span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full p-2.5 text-muted-foreground active:bg-secondary lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu - full screen overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm animate-fade-in lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-0 top-0 z-50 max-h-[85vh] overflow-y-auto rounded-b-2xl border-b border-border bg-background shadow-xl animate-fade-in lg:hidden">
            {/* Mobile header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-display text-xl font-bold text-foreground">
                SR12 <span className="text-gradient-gold">Store</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2.5 active:bg-secondary"
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
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium transition active:bg-secondary ${
                    location.pathname === link.href
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.icon && <link.icon className="h-5 w-5" />}
                  {!link.icon && <span className="h-5 w-5" />}
                  {link.label}
                </Link>
              ))}

              <div className="my-2 mx-4 border-t border-border" />

              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-primary active:bg-secondary">
                      <LayoutDashboard className="h-5 w-5" /> Admin Dashboard
                    </Link>
                  )}
                  <button onClick={() => { signOut(); setIsOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-destructive active:bg-secondary">
                    <LogOut className="h-5 w-5" /> Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-primary active:bg-secondary">
                    <LogIn className="h-5 w-5" /> {t.nav.login}
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-primary active:bg-secondary">
                    <UserPlus className="h-5 w-5" /> {t.nav.register}
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
