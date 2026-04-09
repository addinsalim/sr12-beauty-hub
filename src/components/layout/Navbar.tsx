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
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar — gradient shimmer */}
      <div className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[gradient-shift_6s_ease_infinite] bg-[length:200%_100%]" />
        <div className="container relative mx-auto flex items-center justify-between px-4 py-1.5 text-xs font-body">
          <span className="flex items-center gap-1.5">✨ Free Ongkir untuk pembelian di atas Rp200.000</span>
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
      <div className="glass-strong border-b border-border/40">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
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
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <div className="relative hidden md:block">
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

            <Link
              to="/login"
              className="rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:scale-110"
            >
              <User className="h-5 w-5" />
            </Link>

            <Link
              to="/cart"
              className="relative rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:scale-110"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground animate-pulse-glow">
                0
              </span>
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

      {/* Mobile menu — slide down */}
      {isOpen && (
        <div className="glass-strong border-b border-border/40 lg:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground opacity-0 animate-slide-down"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border/50" />
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-primary transition-all hover:bg-primary/5 opacity-0 animate-slide-down"
              style={{ animationDelay: `${navLinks.length * 0.05}s` }}
            >
              {t.nav.login}
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-primary transition-all hover:bg-primary/5 opacity-0 animate-slide-down"
              style={{ animationDelay: `${(navLinks.length + 1) * 0.05}s` }}
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
