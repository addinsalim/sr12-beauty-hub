import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchProducts } from '@/lib/supabaseHelpers';
import { mockProducts } from '@/lib/mockData';
import ProductCard from './ProductCard';

const FeaturedProducts = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts().then(data => {
      if (data.length > 0) {
        setProducts(data.slice(0, 4).map((p: any) => ({
          id: p.id, name: p.name, slug: p.slug,
          category: p.categories?.slug || 'skincare',
          price: Number(p.price), discount: p.discount || undefined,
          stock: p.stock,
          primaryImage: p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url,
          images: (p.product_images || []).map((i: any) => i.image_url),
          rating: Number(p.rating), reviewCount: p.review_count || 0,
          bpom: p.bpom, halal: p.halal,
        })));
      } else {
        // Fallback to mock data if DB is empty
        setProducts(mockProducts.slice(0, 4).map(p => ({
          ...p, primaryImage: undefined,
        })));
      }
    }).catch(() => {
      setProducts(mockProducts.slice(0, 4).map(p => ({ ...p, primaryImage: undefined })));
    });
  }, []);

  return (
    <section className="relative py-10 sm:py-16 md:py-28">
      {/* Subtle glass background */}
      <div className="absolute inset-0 bg-secondary/20 backdrop-blur-sm" />

      <div className="container relative mx-auto px-4">
        <div className="mb-8 sm:mb-12 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground md:text-4xl accent-line">
              {t.products.title}
            </h2>
            <p className="mt-2 sm:mt-4 text-sm sm:text-base text-muted-foreground">{t.products.subtitle}</p>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1.5 text-sm font-medium text-primary transition-all duration-300 hover:gap-3 underline-grow md:flex"
          >
            {t.products.viewAll} <ArrowRight className="h-4 w-4 transition-transform hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product, i) => (
            <div key={product.id} className="opacity-0 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link
            to="/products"
            className="shimmer inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:shadow-glow-lg hover:scale-105"
          >
            {t.products.viewAll} <ArrowRight className="h-4 w-4 transition-transform hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
