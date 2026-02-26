import { Link } from 'react-router-dom';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
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
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">{t.footer.quickLinks}</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/products', label: t.nav.products },
                { href: '/products?category=parfum', label: t.nav.parfum },
                { href: '/products?category=kosmetik', label: t.nav.kosmetik },
                { href: '/products?category=skincare', label: t.nav.skincare },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground transition hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">{t.footer.customerService}</h4>
            <ul className="space-y-2.5">
              {[t.footer.faq, t.footer.shipping, t.footer.returns, t.footer.privacy, t.footer.terms].map(label => (
                <li key={label}>
                  <a href="#" className="text-sm text-muted-foreground transition hover:text-primary">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">{t.footer.contact}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>📧 hello@sr12store.com</li>
              <li>📱 +62 812 3456 7890</li>
              <li>📍 Jakarta, Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SR12 Store. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
