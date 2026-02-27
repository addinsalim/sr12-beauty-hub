import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Shield, Award } from 'lucide-react';
import { Product, formatPrice } from '@/lib/mockData';
import { useI18n } from '@/lib/i18n';
import productParfum from '@/assets/product-parfum.png';
import productSkincare from '@/assets/product-skincare.png';
import productKosmetik from '@/assets/product-kosmetik.png';

const categoryImages: Record<string, string> = {
  parfum: productParfum,
  skincare: productSkincare,
  kosmetik: productKosmetik,
};

const ProductCard = ({ product }: { product: Product }) => {
  const { t } = useI18n();
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {product.discount && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
            -{product.discount}%
          </span>
        )}
        {isOutOfStock && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {t.products.outOfStock}
          </span>
        )}
      </div>

      {/* Image */}
      <Link to={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-gradient-gold">
        <img
          src={categoryImages[product.category] || productParfum}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-primary/90 py-3 backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
            <ShoppingBag className="mr-2 h-4 w-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">{t.products.addToCart}</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Certifications */}
        <div className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
          {product.bpom && (
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium text-muted-foreground">
              <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {t.products.bpom}
            </span>
          )}
          {product.halal && (
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium text-muted-foreground">
              <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {t.products.halal}
            </span>
          )}
        </div>

        <Link to={`/products/${product.slug}`}>
          <h3 className="mb-1 font-display text-xs sm:text-sm font-semibold leading-snug text-card-foreground transition-colors hover:text-primary line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mb-1.5 sm:mb-2 flex items-center gap-1">
          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-gold text-gold" />
          <span className="text-[10px] sm:text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
          {product.discount ? (
            <>
              <span className="font-display text-sm sm:text-lg font-bold text-primary">
                {formatPrice(product.price * (1 - product.discount / 100))}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="font-display text-sm sm:text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
