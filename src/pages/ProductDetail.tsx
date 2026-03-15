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
        <Link to="/products" className="mt-4 inline-flex items-center gap-2 text-primary"><ArrowLeft className="h-4 w-4" /> Kembali ke Produk</Link>
      </div>
    );
  }

  const variants = product.variants || [];
  const variant = variants[selectedVariant];
  const displayPrice = variant ? Number(variant.price) : Number(product.price);
  const finalPrice = product.discount ? displayPrice * (1 - product.discount / 100) : displayPrice;
  const allImages = (product.product_images || [])
    .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order || 0) - (b.sort_order || 0))
    .map((i: any) => i.image_url);
  if (allImages.length === 0) {
    allImages.push(categoryImages[product.categories?.slug] || productParfum);
  }
  const imgSrc = allImages[selectedImageIndex] || allImages[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">{t.nav.products}</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8 md:py-12">
        <div className="grid gap-6 sm:gap-10 md:grid-cols-2">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-gold aspect-square">
              <img src={imgSrc} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((url: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-20 ${selectedImageIndex === i ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <img src={url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-3">
              {product.bpom && <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"><Shield className="h-3 w-3" /> {t.products.bpom}</span>}
              {product.halal && <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"><Award className="h-3 w-3" /> {t.products.halal}</span>}
            </div>

            <h1 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl">{product.name}</h1>

            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(Number(product.rating)) ? 'fill-gold text-gold' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.review_count} review)</span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold text-primary">{formatPrice(finalPrice)}</span>
                {product.discount > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(displayPrice)}</span>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">-{product.discount}%</span>
                  </>
                )}
              </div>
            </div>

            {variants.length > 1 && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-foreground">{variants[0]?.type}</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v: any, i: number) => (
                    <button key={v.id} onClick={() => setSelectedVariant(i)} className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${selectedVariant === i ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:border-primary/50'} ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`} disabled={v.stock === 0}>
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Jumlah</h3>
              <div className="inline-flex items-center rounded-lg border border-border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-muted-foreground transition hover:text-foreground"><Minus className="h-4 w-4" /></button>
                <span className="w-12 text-center text-sm font-medium text-foreground">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-muted-foreground transition hover:text-foreground"><Plus className="h-4 w-4" /></button>
              </div>
              <span className="ml-3 text-sm text-muted-foreground">Stok: {variant?.stock || product.stock}</span>
            </div>

            <div className="mb-6 flex gap-2 sm:gap-3">
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
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary bg-transparent py-3.5 sm:py-3 text-sm font-semibold text-primary shadow-elegant transition active:scale-[0.98] hover:bg-primary/5"
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
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 sm:py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition active:scale-[0.98] hover:opacity-90"
              >
                Beli Sekarang
              </button>
              <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition active:bg-secondary hover:bg-secondary hover:text-foreground"><Heart className="h-5 w-5" /></button>
              <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition active:bg-secondary hover:bg-secondary hover:text-foreground"><Share2 className="h-5 w-5" /></button>
            </div>

            <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4" /> Free Ongkir Rp200rb+</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4" /> Produk Original</div>
            </div>

            <div className="mt-8">
              <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Deskripsi</h3>
              <p className="leading-relaxed text-muted-foreground">{product.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-secondary/50 p-3"><span className="text-muted-foreground">Berat:</span><span className="ml-1 font-medium text-foreground">{product.weight}g</span></div>
                <div className="rounded-lg bg-secondary/50 p-3"><span className="text-muted-foreground">Expired:</span><span className="ml-1 font-medium text-foreground">{product.expired_date || '-'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
