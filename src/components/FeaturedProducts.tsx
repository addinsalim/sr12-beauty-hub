import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchProducts } from '@/lib/supabaseHelpers';
import ProductCard from './ProductCard';

const FeaturedProducts = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(data => {
        setProducts(
          (data || []).slice(0, 4).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category: p.categories?.slug || 'skincare',
            price: Number(p.price),
            discount: p.discount || undefined,
            stock: p.stock,
            primaryImage:
              p.product_images?.find((i: any) => i.is_primary)?.image_url ||
              p.product_images?.[0]?.image_url,
            images: (p.product_images || []).map((i: any) => i.image_url),
            rating: Number(p.rating),
            reviewCount: p.review_count || 0,
            bpom: p.bpom,
            halal: p.halal,
          }))
        );
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative py-10 sm:py-16 md:py-28">
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

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[75vw] sm:min-w-0 shrink-0 aspect-[3/4] animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
            <PackageOpen className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada produk tersedia.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {products.map((product, i) => (
              <div key={product.id} className="min-w-[75vw] shrink-0 snap-center sm:min-w-0 sm:shrink opacity-0 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-10 text-center md:hidden">
            <Link
              to="/products"
              className="shimmer inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:shadow-glow-lg hover:scale-105"
            >
              {t.products.viewAll} <ArrowRight className="h-4 w-4 transition-transform hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
