import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t, lang, setLang } = useI18n();
  const location = useLocation();

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/products', label: t.nav.products },
    { href: '/products?category=parfum', label: t.nav.parfum },
    { href: '/products?category=kosmetik', label: t.nav.kosmetik },
    { href: '/products?category=skincare', label: t.nav.skincare },
    { href: '/about', label: t.nav.about },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5 text-xs font-body">
          <span>✨ Free Ongkir untuk pembelian di atas Rp200.000</span>
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="flex items-center gap-1.5 rounded-full px-2 py-0.5 transition hover:bg-primary-foreground/10"
          >
            <Globe className="h-3 w-3" />
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
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
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
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

          <Link
            to="/login"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <User className="h-5 w-5" />
          </Link>

          <Link
            to="/cart"
            className="relative rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              0
            </span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-border bg-background animate-fade-in lg:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-primary transition hover:bg-secondary"
            >
              {t.nav.login}
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-primary transition hover:bg-secondary"
            >
              {t.nav.register}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
