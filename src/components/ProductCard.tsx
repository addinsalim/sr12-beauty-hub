import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Shield, Award, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/supabaseHelpers';
import productParfum from '@/assets/product-parfum.png';
import productSkincare from '@/assets/product-skincare.png';
import productKosmetik from '@/assets/product-kosmetik.png';
import productHerbal from '@/assets/product-herbal.png';

const categoryImages: Record<string, string> = {
  parfum: productParfum,
  skincare: productSkincare,
  kosmetik: productKosmetik,
  herbal: productHerbal,
};

interface ProductCardProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discount?: number;
  stock: number;
  primaryImage?: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  bpom: boolean;
  halal: boolean;
  variants?: any[];
}

const ProductCard = ({ product }: { product: ProductCardProduct }) => {
  const { t } = useI18n();
  const { user, hasAddress } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isOutOfStock = product.stock === 0;
  const fallback = categoryImages[product.category] || productParfum;
  const allImgs: string[] = product.images && product.images.length > 0
    ? product.images
    : [product.primaryImage || fallback];
  const [imgIdx, setImgIdx] = useState(0);
  const total = allImgs.length;
  const imgSrc = allImgs[imgIdx];
  const wished = isInWishlist(product.id);

  // touch swipe
  const touchX = useState<number | null>(null);
  const startX = { current: null as number | null };

  const goPrev = (e: React.MouseEvent) => { e.preventDefault(); setImgIdx(i => (i - 1 + total) % total); };
  const goNext = (e: React.MouseEvent) => { e.preventDefault(); setImgIdx(i => (i + 1) % total); };

  return (
    <div className="group glow-ring relative flex flex-col overflow-hidden rounded-2xl glass border-border/30 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-glow-lg">
      {/* Wishlist heart button */}
      <button
        onClick={(e) => { e.preventDefault(); toggle(product.id, product.name); }}
        className={`absolute right-3 top-3 z-20 h-8 w-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${wished ? 'bg-rose-gold text-white' : 'bg-white/70 text-muted-foreground hover:text-rose-gold'}`}
        aria-label="Tambah ke wishlist"
      >
        <Heart className={`h-4 w-4 ${wished ? 'fill-current' : ''}`} />
      </button>

      {/* Badges */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5">
        {product.discount ? (
          <span className="rounded-full bg-accent/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground shadow-sm">
            -{product.discount}%
          </span>
        ) : null}
        {isOutOfStock && (
          <span className="rounded-full bg-muted/80 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {t.products.outOfStock}
          </span>
        )}
      </div>

      {/* ── Image Slider ── */}
      <div
        className="relative aspect-square overflow-hidden bg-gradient-gold select-none"
        onTouchStart={e => { startX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (startX.current === null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          if (Math.abs(dx) > 40) {
            if (dx < 0) setImgIdx(i => (i + 1) % total);
            else setImgIdx(i => (i - 1 + total) % total);
          }
          startX.current = null;
        }}
      >
        <Link to={`/products/${product.slug}`}>
          <img
            key={imgIdx}
            src={imgSrc}
            alt={product.name}
            className="h-full w-full object-contain bg-white/40 backdrop-blur-sm transition-all duration-500"
            draggable={false}
          />
        </Link>

        {/* Arrows — hanya jika > 1 gambar */}
        {total > 1 && (
          <>
            <button
              onClick={goPrev}
              aria-label="Sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/70 backdrop-blur-md border border-border/30 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-background/90"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              aria-label="Berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/70 backdrop-blur-md border border-border/30 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-background/90"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
              {allImgs.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.preventDefault(); setImgIdx(i); }}
                  className={`rounded-full transition-all duration-300 ${
                    imgIdx === i ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="absolute top-2 left-2 z-10 rounded-full bg-background/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/20">
              {imgIdx + 1}/{total}
            </div>
          </>
        )}

        {/* Add to cart overlay */}
        {!isOutOfStock && (
          <button
            onClick={(e) => {
              e.preventDefault();
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
              if (product.variants && product.variants.length > 1) {
                toast({ title: 'Pilih varian', description: 'Silakan pilih varian produk terlebih dahulu.' });
                navigate(`/products/${product.slug}`);
                return;
              }
              const finalPrice = product.discount ? product.price * (1 - product.discount / 100) : product.price;
              addItem({
                productId: product.id,
                variantId: product.variants?.length === 1 ? product.variants[0].id : undefined,
                name: product.name,
                variantName: product.variants?.length === 1 ? product.variants[0].name : undefined,
                price: finalPrice,
                image: imgSrc,
                slug: product.slug,
                stock: product.stock,
              });
              toast({ title: 'Ditambahkan ke keranjang', description: product.name });
            }}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center glass py-3.5 transition-transform duration-300 group-hover:translate-y-0 z-10"
          >
            <ShoppingBag className="mr-2 h-4 w-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">
              {product.variants && product.variants.length > 1 ? 'Pilih Varian' : t.products.addToCart}
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Certifications */}
        <div className="mb-2 flex items-center gap-2">
          {product.bpom && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <Shield className="h-3 w-3" /> {t.products.bpom}
            </span>
          )}
          {product.halal && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <Award className="h-3 w-3" /> {t.products.halal}
            </span>
          )}
        </div>

        <Link to={`/products/${product.slug}`}>
          <h3 className="mb-1.5 font-display text-sm font-semibold leading-snug text-card-foreground transition-colors duration-300 hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mb-2.5 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        <div className="mt-auto flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
          {product.discount ? (
            <>
              <span className="font-display text-lg font-bold text-gradient-gold">
                {formatPrice(product.price * (1 - product.discount / 100))}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="font-display text-lg font-bold text-primary">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
