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
      {/* Header */}
      <div className="bg-gradient-hero py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {t.nav.products}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {categoryFilter
              ? categories.find(c => c.value === categoryFilter)?.label
              : t.products.subtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 sm:py-8">
        {/* Filters */}
        <div className="mb-5 sm:mb-8 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          {/* Search */}
          <div className="flex flex-1 items-center rounded-full border border-border bg-card px-4 py-2.5 sm:py-2">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.nav.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Category pills - horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <a
                key={cat.value}
                href={cat.value ? `/products?category=${cat.value}` : '/products'}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.96] ${
                  categoryFilter === cat.value || (!categoryFilter && !cat.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
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
            className="w-full sm:w-auto rounded-full border border-border bg-card px-4 py-2.5 sm:py-2 text-sm text-foreground outline-none"
          >
            <option value="newest">Terbaru</option>
            <option value="price-low">Harga Terendah</option>
            <option value="price-high">Harga Tertinggi</option>
            <option value="rating">Rating Tertinggi</option>
          </select>
        </div>

        {/* Products grid - 2 columns on mobile */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, i) => (
            <div key={product.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">Tidak ada produk ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
