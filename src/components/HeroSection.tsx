import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import heroBanner from '@/assets/hero-banner.png';

const HeroSection = () => {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-modern" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${heroBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20" />

      {/* Decorative floating shapes */}
      <div className="absolute top-20 right-20 h-72 w-72 rounded-full bg-gold/5 blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-rose-gold/5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="container relative mx-auto px-4 py-20 md:py-32 lg:py-40">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-sm font-medium text-muted-foreground animate-float opacity-0 animate-fade-in" style={{ animationDelay: '0s' }}>
            <Sparkles className="h-4 w-4 text-gold" />
            <span>100% Bahan Alami & Bersertifikat</span>
          </div>

          {/* Title */}
          <h1 className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight text-foreground opacity-0 animate-fade-in md:text-6xl lg:text-7xl" style={{ animationDelay: '0.15s' }}>
            {t.hero.title}
            <br />
            <span className="text-gradient-modern">{t.hero.titleAccent}</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 max-w-lg text-base leading-relaxed text-muted-foreground opacity-0 animate-fade-in md:text-lg" style={{ animationDelay: '0.3s' }}>
            {t.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.45s' }}>
            <Link
              to="/products"
              className="shimmer inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-105"
            >
              {t.hero.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/register?role=reseller"
              className="inline-flex items-center gap-2 rounded-full glass px-8 py-3.5 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-secondary/80 hover:shadow-card hover:scale-105"
            >
              {t.hero.ctaSecondary}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 flex flex-wrap gap-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {[
              { value: '10K+', label: 'Pelanggan Puas' },
              { value: '500+', label: 'Produk' },
              { value: '50+', label: 'Reseller Aktif' },
            ].map((stat, i) => (
              <div key={stat.label} className="glass rounded-2xl px-6 py-4 opacity-0 animate-slide-up" style={{ animationDelay: `${0.7 + i * 0.1}s` }}>
                <div className="font-display text-2xl font-bold text-gradient-gold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
