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
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {t.categories.title}
          </h2>
          <p className="mt-2 text-muted-foreground">{t.categories.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.name}
              to={cat.href}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-40 transition-opacity group-hover:opacity-60`} />
              <div className="relative flex flex-col items-center text-center">
                <div className="mb-4 h-40 w-40 overflow-hidden rounded-full bg-secondary/50 p-4">
                  <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h3 className="mb-1 font-display text-xl font-bold text-card-foreground">{cat.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{cat.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition group-hover:gap-2">
                  Lihat Produk <ArrowRight className="h-4 w-4" />
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
