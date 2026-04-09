import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import productParfum from '@/assets/product-parfum.png';
import productSkincare from '@/assets/product-skincare.png';
import productKosmetik from '@/assets/product-kosmetik.png';

const CategoriesSection = () => {
  const { t } = useI18n();

  const categories = [
    {
      name: t.categories.parfum,
      description: t.categories.parfumDesc,
      image: productParfum,
      href: '/products?category=parfum',
      gradient: 'from-gold/20 to-rose-gold-light/30',
    },
    {
      name: t.categories.kosmetik,
      description: t.categories.kosmetikDesc,
      image: productKosmetik,
      href: '/products?category=kosmetik',
      gradient: 'from-rose-gold-light/30 to-champagne/40',
    },
    {
      name: t.categories.skincare,
      description: t.categories.skincareDesc,
      image: productSkincare,
      href: '/products?category=skincare',
      gradient: 'from-champagne/30 to-cream/40',
    },
  ];

  return (
    <section className="py-10 sm:py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 sm:mb-14 text-center">
          <h2 className="font-display text-3xl sm:text-3xl font-bold text-foreground md:text-4xl accent-line-center">
            {t.categories.title}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">{t.categories.subtitle}</p>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:pb-0">
          {categories.map((cat, i) => (
            <Link
              key={cat.name}
              to={cat.href}
              className="group glow-ring relative min-w-[85vw] shrink-0 snap-center overflow-hidden rounded-3xl glass border-border/30 p-8 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-glow-lg opacity-0 animate-slide-up sm:min-w-0 sm:shrink"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-40 transition-opacity duration-500 group-hover:opacity-70`} />
              <div className="relative flex flex-col items-center text-center">
                <div className="mb-6 h-36 w-36 sm:h-44 sm:w-44 overflow-hidden rounded-full bg-secondary/30 p-4 ring-2 ring-border/30 transition-all duration-500 group-hover:ring-primary/30 group-hover:shadow-glow">
                  <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-115" />
                </div>
                <h3 className="mb-2 font-display text-xl font-bold text-card-foreground">{cat.name}</h3>
                <p className="mb-5 text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-all duration-300 group-hover:gap-3">
                  Lihat Produk <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
