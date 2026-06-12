import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Shield, Award, Minus, Plus, Heart, Share2, Truck, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchProductBySlug, formatPrice } from '@/lib/supabaseHelpers';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/hooks/use-toast';
import { trackRecentlyViewed } from '@/lib/recentlyViewed';
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
  const { user, hasAddress } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Touch / drag state untuk swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProductBySlug(slug)
      .then(data => {
        setProduct(data);
        if (data?.id) trackRecentlyViewed(data.id);
      })
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
  const variant = selectedVariant !== null ? variants[selectedVariant] : (variants.length === 1 ? variants[0] : null);
  const displayPrice = variant ? Number(variant.price) : Number(product.price);
  const finalPrice = product.discount > 0 ? displayPrice * (1 - product.discount / 100) : displayPrice;
  const allImages = (product.product_images || [])
    .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order || 0) - (b.sort_order || 0))
    .map((i: any) => i.image_url);
  if (allImages.length === 0) {
    allImages.push(categoryImages[product.categories?.slug] || productParfum);
  }
  const imgSrc = allImages[selectedImageIndex] || allImages[0];
  const total = allImages.length;

  const goPrev = () => setSelectedImageIndex(i => (i - 1 + total) % total);
  const goNext = () => setSelectedImageIndex(i => (i + 1) % total);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb — glass */}
      <div className="glass flex items-center justify-center border-b border-border/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3.5 text-sm text-muted-foreground overflow-hidden">
          <Link to="/" className="transition-colors hover:text-primary whitespace-nowrap shrink-0">Home</Link>
          <span className="text-border shrink-0">/</span>
          <Link to="/products" className="transition-colors hover:text-primary whitespace-nowrap shrink-0">{t.nav.products}</Link>
          <span className="text-border shrink-0">/</span>
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </div>
      </div>

      {/* ── Layout: Full-bleed image on mobile, 2-col on desktop ── */}
      <div className="md:container md:mx-auto md:px-4 md:py-14 overflow-hidden">
        <div className="grid md:gap-12 md:grid-cols-2 min-w-0">

          {/* ── Image Slider Section ── */}
          <div className="space-y-3 md:space-y-4 min-w-0">
            {/* Main image — full width on mobile, rounded on desktop */}
            <div
              className="relative group overflow-hidden bg-gradient-gold shadow-glow md:rounded-3xl opacity-0 animate-blur-in w-full aspect-square select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Slide images */}
              <img
                key={selectedImageIndex}
                src={imgSrc}
                alt={product.name}
                className="h-full w-full object-contain bg-white/40 backdrop-blur-sm transition-all duration-500 animate-fade-in"
                draggable={false}
              />

              {/* Arrow buttons */}
              {total > 1 && (
                <>
                  <button
                    id="img-prev"
                    onClick={goPrev}
                    aria-label="Gambar sebelumnya"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 backdrop-blur-md shadow-card border border-border/40 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background/90 hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    id="img-next"
                    onClick={goNext}
                    aria-label="Gambar berikutnya"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 backdrop-blur-md shadow-card border border-border/40 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background/90 hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {allImages.map((_: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        aria-label={`Gambar ${i + 1}`}
                        className={`rounded-full transition-all duration-300 ${
                          selectedImageIndex === i
                            ? 'w-5 h-2 bg-primary shadow-glow'
                            : 'w-2 h-2 bg-white/60 hover:bg-white/90'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Counter badge */}
                  <div className="absolute top-3 right-3 z-10 rounded-full bg-background/60 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border/30">
                    {selectedImageIndex + 1} / {total}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip — full-width scroll on mobile */}
            {total > 1 && (
              <div className="flex gap-2 overflow-x-auto px-4 md:px-0 pb-1 scrollbar-hide snap-x">
                {allImages.map((url: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`h-16 w-16 sm:h-20 sm:w-20 shrink-0 snap-start overflow-hidden rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                      selectedImageIndex === i
                        ? 'border-primary ring-2 ring-primary/50 shadow-glow scale-[1.05]'
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
          <div className="flex flex-col opacity-0 animate-slide-up px-4 md:px-0 min-w-0" style={{ animationDelay: '0.15s' }}>
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

            <h1 className="mb-2 sm:mb-3 font-display text-[22px] sm:text-3xl font-bold leading-tight text-foreground md:text-4xl">
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
            <div className="mb-6 sm:mb-8 border-b border-border/30 pb-6 sm:pb-8">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-2xl sm:text-3xl font-bold text-gradient-gold">
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
                      className={`rounded-xl border px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-medium transition-all duration-300 ${
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
            <div className="mb-6 sm:mb-8">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Jumlah</h3>
              <div className="flex items-center flex-wrap gap-4">
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
                <span className="text-sm text-muted-foreground">
                  Stok: {variant?.stock || product.stock}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mb-8 flex flex-col sm:flex-row flex-wrap gap-3">
              <button
                onClick={() => {
                  if (!user) {
                    toast({ title: 'Silakan Login', description: 'Anda harus login untuk menambahkan ke keranjang.', variant: 'destructive' });
                    navigate('/login');
                    return;
                  }
                  if (!hasAddress) {
                    toast({ title: 'Alamat Kosong', description: 'Silakan isi alamat pengiriman di Profil Anda terlebih dahulu.', variant: 'destructive' });
                    navigate('/profile?tab=addresses');
                    return;
                  }
                  if (variants.length > 1 && selectedVariant === null) {
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
                className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary bg-transparent py-3.5 text-[13px] sm:text-sm font-semibold text-primary shadow-glow transition-all duration-300 hover:bg-primary/5 hover:scale-[1.02]"
              >
                <ShoppingBag className="h-4 w-4 shrink-0" /> Tambah ke Keranjang
              </button>
              
              <button
                onClick={() => {
                  if (!user) {
                    toast({ title: 'Silakan Login', description: 'Anda harus login untuk memproses pesanan.', variant: 'destructive' });
                    navigate('/login');
                    return;
                  }
                  if (!hasAddress) {
                    toast({ title: 'Alamat Kosong', description: 'Silakan isi alamat pengiriman di Profil Anda terlebih dahulu.', variant: 'destructive' });
                    navigate('/profile?tab=addresses');
                    return;
                  }
                  if (variants.length > 1 && selectedVariant === null) {
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
                className="shimmer flex w-full sm:flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[13px] sm:text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02]"
              >
                Beli Sekarang
              </button>
              
              <div className="flex w-full sm:w-auto justify-center sm:justify-start gap-3 mt-2 sm:mt-0">
                <button
                  onClick={() => toggleWishlist(product.id, product.name)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full glass border border-border/30 transition-all duration-300 hover:shadow-glow hover:scale-110 shrink-0 ${isInWishlist(product.id) ? 'text-rose-gold' : 'text-muted-foreground hover:text-rose-gold'}`}
                  aria-label="Wishlist"
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full glass border border-border/30 text-muted-foreground transition-all duration-300 hover:text-foreground hover:shadow-glow hover:scale-110 shrink-0">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap gap-3 sm:gap-4 rounded-2xl glass p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">
                <Truck className="h-4 w-4 text-primary shrink-0" /> Free Ongkir Rp200rb+
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">
                <Shield className="h-4 w-4 text-primary shrink-0" /> Produk Original
              </div>
            </div>

            {/* Description */}
            <div className="mt-8 sm:mt-10">
              <h3 className="mb-3 sm:mb-4 font-display text-base sm:text-lg font-semibold text-foreground accent-line">Deskripsi</h3>
              <div className="leading-relaxed text-sm sm:text-base text-muted-foreground whitespace-pre-wrap text-justify">{product.description}</div>
              <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="rounded-xl glass p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center">
                  <span className="text-muted-foreground">Berat:</span>
                  <span className="sm:ml-1 font-semibold sm:font-medium text-foreground">{product.weight}g</span>
                </div>
                <div className="rounded-xl glass p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center">
                  <span className="text-muted-foreground">Expired:</span>
                  <span className="sm:ml-1 font-semibold sm:font-medium text-foreground">{product.expired_date || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-10 sm:mt-20 px-4 md:px-0">
          <h2 className="mb-6 sm:mb-8 font-display text-xl sm:text-2xl font-bold text-foreground accent-line opacity-0 animate-slide-up">Ulasan Produk</h2>
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
