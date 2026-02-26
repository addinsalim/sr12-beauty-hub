import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, Shield, Award, Minus, Plus, Heart, Share2, Truck, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { mockProducts, formatPrice } from '@/lib/mockData';
import productParfum from '@/assets/product-parfum.png';
import productSkincare from '@/assets/product-skincare.png';
import productKosmetik from '@/assets/product-kosmetik.png';
import ProductCard from '@/components/ProductCard';

const categoryImages: Record<string, string> = {
  parfum: productParfum,
  skincare: productSkincare,
  kosmetik: productKosmetik,
};

const ProductDetail = () => {
  const { slug } = useParams();
  const { t } = useI18n();
  const product = mockProducts.find(p => p.slug === slug);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg text-muted-foreground">Produk tidak ditemukan.</p>
        <Link to="/products" className="mt-4 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Produk
        </Link>
      </div>
    );
  }

  const variant = product.variants[selectedVariant];
  const displayPrice = variant?.price || product.price;
  const finalPrice = product.discount ? displayPrice * (1 - product.discount / 100) : displayPrice;
  const relatedProducts = mockProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">{t.nav.products}</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Image */}
          <div className="overflow-hidden rounded-2xl bg-gradient-gold">
            <img
              src={categoryImages[product.category]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Certifications */}
            <div className="mb-3 flex items-center gap-3">
              {product.bpom && (
                <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <Shield className="h-3 w-3" /> {t.products.bpom}
                </span>
              )}
              {product.halal && (
                <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <Award className="h-3 w-3" /> {t.products.halal}
                </span>
              )}
            </div>

            <h1 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-gold text-gold' : 'text-border'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount} review)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold text-primary">
                  {formatPrice(finalPrice)}
                </span>
                {product.discount && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(displayPrice)}</span>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                      -{product.discount}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants.length > 1 && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {product.variants[0].type}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(i)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        selectedVariant === i
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground hover:border-primary/50'
                      } ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                      disabled={v.stock === 0}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Jumlah</h3>
              <div className="inline-flex items-center rounded-lg border border-border">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-muted-foreground transition hover:text-foreground"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-muted-foreground transition hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="ml-3 text-sm text-muted-foreground">
                Stok: {variant?.stock || product.stock}
              </span>
            </div>

            {/* Actions */}
            <div className="mb-6 flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-90">
                <ShoppingBag className="h-4 w-4" />
                {t.products.addToCart}
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <Heart className="h-5 w-5" />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" /> Free Ongkir Rp200rb+
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" /> Produk Original
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Deskripsi</h3>
              <p className="leading-relaxed text-muted-foreground">{product.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <span className="text-muted-foreground">Berat:</span>
                  <span className="ml-1 font-medium text-foreground">{product.weight}g</span>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <span className="text-muted-foreground">Expired:</span>
                  <span className="ml-1 font-medium text-foreground">{product.expiredDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground">Produk Terkait</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
