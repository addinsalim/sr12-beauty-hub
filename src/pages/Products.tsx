import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid3X3, List, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { mockProducts } from '@/lib/mockData';
import ProductCard from '@/components/ProductCard';

const Products = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filtered = useMemo(() => {
    let products = mockProducts;
    if (categoryFilter) {
      products = products.filter(p => p.category === categoryFilter);
    }
    if (search) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sortBy === 'price-low') products.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') products.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') products.sort((a, b) => b.rating - a.rating);
    return products;
  }, [categoryFilter, search, sortBy]);

  const categories = [
    { value: '', label: 'Semua' },
    { value: 'parfum', label: t.nav.parfum },
    { value: 'kosmetik', label: t.nav.kosmetik },
    { value: 'skincare', label: t.nav.skincare },
  ];

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

      <div className="container mx-auto px-4 py-10">
        {/* Filters — glass styling */}
        <div className="mb-10 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex flex-1 items-center rounded-full glass px-4 py-2.5 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
            <Search className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.nav.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2">
            {categories.map(cat => (
              <a
                key={cat.value}
                href={cat.value ? `/products?category=${cat.value}` : '/products'}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${categoryFilter === cat.value || (!categoryFilter && !cat.value)
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
            className="rounded-full glass px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:shadow-glow focus:ring-1 focus:ring-primary/30"
          >
            <option value="newest">Terbaru</option>
            <option value="price-low">Harga Terendah</option>
            <option value="price-high">Harga Tertinggi</option>
            <option value="rating">Rating Tertinggi</option>
          </select>
        </div>

        {/* Products grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, i) => (
            <div key={product.id} className="opacity-0 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-lg text-muted-foreground">Tidak ada produk ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
