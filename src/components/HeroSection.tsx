import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import heroBanner from '@/assets/hero-banner.png';

const HeroSection = () => {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />

      <div className="container relative mx-auto px-4 py-20 md:py-32 lg:py-40">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4 text-gold" />
            <span>100% Bahan Alami & Bersertifikat</span>
          </div>

          {/* Title */}
          <h1 className="mb-4 font-display text-4xl font-bold leading-tight tracking-tight text-foreground opacity-0 animate-fade-in md:text-5xl lg:text-6xl" style={{ animationDelay: '0.15s' }}>
            {t.hero.title}
            <br />
            <span className="text-gradient-gold">{t.hero.titleAccent}</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground opacity-0 animate-fade-in md:text-lg" style={{ animationDelay: '0.3s' }}>
            {t.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in" style={{ animationDelay: '0.45s' }}>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:opacity-90"
            >
              {t.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register?role=reseller"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-secondary"
            >
              {t.hero.ctaSecondary}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 flex flex-wrap gap-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {[
              { value: '10K+', label: 'Pelanggan Puas' },
              { value: '500+', label: 'Produk' },
              { value: '50+', label: 'Reseller Aktif' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
