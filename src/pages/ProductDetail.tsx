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
        <Link to="/products" className="mt-4 inline-flex items-center gap-2 text-primary transition-all hover:gap-3">
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
      {/* Breadcrumb — glass */}
      <div className="glass-strong border-b border-border/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3.5 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-primary">Home</Link>
          <span className="text-border">/</span>
          <Link to="/products" className="transition-colors hover:text-primary">{t.nav.products}</Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Image — with glow shadow */}
          <div className="group overflow-hidden rounded-3xl bg-gradient-gold shadow-glow transition-shadow duration-500 hover:shadow-glow-lg opacity-0 animate-blur-in">
            <img
              src={categoryImages[product.category]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col opacity-0 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            {/* Certifications */}
            <div className="mb-4 flex items-center gap-3">
              {product.bpom && (
                <span className="flex items-center gap-1.5 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-foreground">
                  <Shield className="h-3.5 w-3.5 text-primary" /> {t.products.bpom}
                </span>
              )}
              {product.halal && (
                <span className="flex items-center gap-1.5 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-foreground">
                  <Award className="h-3.5 w-3.5 text-primary" /> {t.products.halal}
                </span>
              )}
            </div>

            <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mb-5 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
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
            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold text-gradient-gold">
                  {formatPrice(finalPrice)}
                </span>
                {product.discount && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(displayPrice)}</span>
                    <span className="rounded-full bg-accent/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                      -{product.discount}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants.length > 1 && (
              <div className="mb-8">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {product.variants[0].type}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(i)}
                      className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${selectedVariant === i
                          ? 'border-primary bg-primary/10 text-primary shadow-glow'
                          : 'glass text-foreground hover:border-primary/50 hover:shadow-card'
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
            <div className="mb-8">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Jumlah</h3>
              <div className="inline-flex items-center rounded-xl glass overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-14 text-center text-sm font-medium text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2.5 text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="ml-4 text-sm text-muted-foreground">
                Stok: {variant?.stock || product.stock}
              </span>
            </div>

            {/* Actions */}
            <div className="mb-8 flex gap-3">
              <button className="shimmer flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02]">
                <ShoppingBag className="h-4 w-4" />
                {t.products.addToCart}
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full glass text-muted-foreground transition-all duration-300 hover:text-rose-gold hover:shadow-glow hover:scale-110">
                <Heart className="h-5 w-5" />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full glass text-muted-foreground transition-all duration-300 hover:text-foreground hover:shadow-glow hover:scale-110">
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap gap-4 rounded-2xl glass p-5">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" /> Free Ongkir Rp200rb+
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" /> Produk Original
              </div>
            </div>

            {/* Description */}
            <div className="mt-10">
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground accent-line">Deskripsi</h3>
              <p className="leading-relaxed text-muted-foreground">{product.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl glass p-4">
                  <span className="text-muted-foreground">Berat:</span>
                  <span className="ml-1 font-medium text-foreground">{product.weight}g</span>
                </div>
                <div className="rounded-xl glass p-4">
                  <span className="text-muted-foreground">Expired:</span>
                  <span className="ml-1 font-medium text-foreground">{product.expiredDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-8 font-display text-2xl font-bold text-foreground accent-line">Produk Terkait</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p, i) => (
                <div key={p.id} className="opacity-0 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
