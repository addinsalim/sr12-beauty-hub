import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Shield, Award, Minus, Plus, Heart, Share2, Truck, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchProductBySlug, formatPrice } from '@/lib/supabaseHelpers';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import productParfum from '@/assets/product-parfum.png';
import productSkincare from '@/assets/product-skincare.png';
import productKosmetik from '@/assets/product-kosmetik.png';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';

const categoryImages: Record<string, string> = {
  parfum: productParfum,
  skincare: productSkincare,
  kosmetik: productKosmetik,
};

const ProductDetail = () => {
  const { slug } = useParams();
  const { t } = useI18n();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProductBySlug(slug)
      .then(data => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

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

  const variants = product.variants || [];
  const variant = variants[selectedVariant];
  const displayPrice = variant ? Number(variant.price) : Number(product.price);
  const finalPrice = product.discount > 0 ? displayPrice * (1 - product.discount / 100) : displayPrice;
  const allImages = (product.product_images || [])
    .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order || 0) - (b.sort_order || 0))
    .map((i: any) => i.image_url);
  if (allImages.length === 0) {
    allImages.push(categoryImages[product.categories?.slug] || productParfum);
  }
  const imgSrc = allImages[selectedImageIndex] || allImages[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb — glass */}
      <div className="glass flex items-center justify-center border-b border-border/30">
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
          {/* Images Section */}
          <div className="space-y-4">
            <div className="group overflow-hidden rounded-3xl bg-gradient-gold shadow-glow transition-shadow duration-500 hover:shadow-glow-lg opacity-0 animate-blur-in aspect-square">
              <img
                src={imgSrc}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((url: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                      selectedImageIndex === i
                        ? 'border-primary ring-2 ring-primary/50 shadow-glow'
                        : 'border-transparent glass hover:border-primary/50 hover:shadow-card'
                    }`}
                  >
                    <img src={url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
            <div className="mb-6 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(Number(product.rating)) ? 'fill-gold text-gold' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.review_count} review)</span>
            </div>

            {/* Price */}
            <div className="mb-8 border-b border-border/30 pb-8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold text-gradient-gold">
                  {formatPrice(finalPrice)}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(displayPrice)}</span>
                    <span className="rounded-full bg-accent/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-accent-foreground shadow-sm">
                      -{product.discount}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div className="mb-8">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {variants[0].type}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v: any, i: number) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(i)}
                      className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                        selectedVariant === i
                          ? 'border-primary bg-primary/10 text-primary shadow-glow'
                          : 'border-transparent glass text-foreground hover:border-primary/50 hover:shadow-card'
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
              <div className="inline-flex items-center rounded-xl glass overflow-hidden border border-border/30">
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
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (variants.length > 1 && !variant) {
                    toast({ title: 'Pilih varian', description: 'Harap pilih varian produk terlebih dahulu.', variant: 'destructive' });
                    return;
                  }
                  addItem({
                    productId: product.id,
                    variantId: variant?.id,
                    name: product.name,
                    variantName: variant?.name,
                    price: finalPrice,
                    image: imgSrc,
                    slug: product.slug,
                    stock: variant?.stock || product.stock,
                  }, quantity);
                  toast({ title: 'Ditambahkan ke keranjang', description: `${product.name} x${quantity}` });
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary bg-transparent py-3.5 text-sm font-semibold text-primary shadow-glow transition-all duration-300 hover:bg-primary/5 hover:scale-[1.02]"
              >
                <ShoppingBag className="h-4 w-4" /> {t.products.addToCart}
              </button>
              
              <button
                onClick={() => {
                  if (variants.length > 1 && !variant) {
                    toast({ title: 'Pilih varian', description: 'Harap pilih varian produk terlebih dahulu.', variant: 'destructive' });
                    return;
                  }
                  const buyNowItem = {
                    productId: product.id,
                    variantId: variant?.id,
                    name: product.name,
                    variantName: variant?.name,
                    price: finalPrice,
                    image: imgSrc,
                    slug: product.slug,
                    stock: variant?.stock || product.stock,
                    quantity,
                  };
                  navigate('/checkout', { state: { buyNowItem } });
                }}
                className="shimmer flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02]"
              >
                Beli Sekarang
              </button>
              
              <button className="flex h-12 w-12 items-center justify-center rounded-full glass border border-border/30 text-muted-foreground transition-all duration-300 hover:text-rose-gold hover:shadow-glow hover:scale-110 shrink-0">
                <Heart className="h-5 w-5" />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full glass border border-border/30 text-muted-foreground transition-all duration-300 hover:text-foreground hover:shadow-glow hover:scale-110 shrink-0">
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
                  <span className="ml-1 font-medium text-foreground">{product.expired_date || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20">
          <h2 className="mb-8 font-display text-2xl font-bold text-foreground accent-line opacity-0 animate-slide-up">Ulasan Produk</h2>
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <ProductReviews productId={product.id} onReviewAdded={() => {
              fetchProductBySlug(slug!).then(data => setProduct(data));
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
