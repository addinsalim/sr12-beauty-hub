import { Link } from 'react-router-dom';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="relative border-t border-border/50">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="bg-secondary/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-5">
              <span className="font-display text-xl font-bold text-foreground">
                SR12 <span className="text-gradient-gold">Store</span>
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.footer.description}
              </p>
              <div className="flex gap-3">
                {[Instagram, Facebook, MessageCircle].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="group flex h-10 w-10 items-center justify-center rounded-full glass text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-glow hover:scale-110"
                  >
                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-5 font-display text-sm font-semibold text-foreground accent-line">{t.footer.quickLinks}</h4>
              <ul className="space-y-3">
                {[
                  { href: '/products', label: t.nav.products },
                  { href: '/products?category=parfum', label: t.nav.parfum },
                  { href: '/products?category=kosmetik', label: t.nav.kosmetik },
                  { href: '/products?category=skincare', label: t.nav.skincare },
                ].map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
                      <span className="inline-block h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="mb-5 font-display text-sm font-semibold text-foreground accent-line">{t.footer.customerService}</h4>
              <ul className="space-y-3">
                {[t.footer.faq, t.footer.shipping, t.footer.returns, t.footer.privacy, t.footer.terms].map(label => (
                  <li key={label}>
                    <a href="#" className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
                      <span className="inline-block h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-5 font-display text-sm font-semibold text-foreground accent-line">{t.footer.contact}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">📧 hello@sr12store.com</li>
                <li className="flex items-center gap-2">📱 +62 812 3456 7890</li>
                <li className="flex items-center gap-2">📍 Jakarta, Indonesia</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} SR12 Store. {t.footer.rights}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
