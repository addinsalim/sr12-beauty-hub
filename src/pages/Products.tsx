import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchProducts, formatPrice } from '@/lib/supabaseHelpers';
import ProductCard from '@/components/ProductCard';

const Products = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts(categoryFilter || undefined)
      .then(data => setProducts(data))
      .finally(() => setLoading(false));
  }, [categoryFilter]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (sortBy === 'price-low') result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === 'price-high') result.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === 'rating') result.sort((a, b) => Number(b.rating) - Number(a.rating));
    return result;
  }, [products, search, sortBy]);

  const categories = [
    { value: '', label: 'Semua' },
    { value: 'parfum', label: t.nav.parfum },
    { value: 'kosmetik', label: t.nav.kosmetik },
    { value: 'skincare', label: t.nav.skincare },
  ];

  // Map DB product to ProductCard-compatible shape
  const mapProduct = (p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.categories?.slug || 'skincare',
    price: Number(p.price),
    resellerPrice: Number(p.reseller_price),
    discount: p.discount || undefined,
    stock: p.stock,
    description: p.description || '',
    images: (p.product_images || []).map((i: any) => i.image_url),
    primaryImage: p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url,
    variants: (p.variants || []).map((v: any) => ({ id: v.id, name: v.name, type: v.type, price: Number(v.price), stock: v.stock })),
    rating: Number(p.rating),
    reviewCount: p.review_count || 0,
    bpom: p.bpom,
    halal: p.halal,
    weight: p.weight || 0,
    expiredDate: p.expired_date || '',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header — animated gradient */}
      <div className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-modern" />
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl opacity-0 animate-blur-in">
            {t.nav.products}
          </h1>
          <p className="mt-3 text-muted-foreground opacity-0 animate-blur-in" style={{ animationDelay: '0.1s' }}>
            {categoryFilter
              ? categories.find(c => c.value === categoryFilter)?.label
              : t.products.subtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-10">
        {/* Filters — glass styling */}
        <div className="mb-8 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          {/* Search */}
          <div className="flex flex-1 items-center rounded-full glass px-4 py-2.5 sm:py-2.5 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
            <Search className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.nav.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <a
                key={cat.value}
                href={cat.value ? `/products?category=${cat.value}` : '/products'}
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${categoryFilter === cat.value || (!categoryFilter && !cat.value)
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'glass text-muted-foreground hover:text-foreground hover:shadow-card'
                  }`}
              >
                {cat.label}
              </a>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full sm:w-auto rounded-full glass px-4 py-2.5 sm:py-2 text-sm text-foreground outline-none transition-all focus:shadow-glow focus:ring-1 focus:ring-primary/30"
          >
            <option value="newest">Terbaru</option>
            <option value="price-low">Harga Terendah</option>
            <option value="price-high">Harga Tertinggi</option>
            <option value="rating">Rating Tertinggi</option>
          </select>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="flex justify-center py-24"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product, i) => (
              <div key={product.id} className="opacity-0 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProductCard product={mapProduct(product)} />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-lg text-muted-foreground">Tidak ada produk ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
