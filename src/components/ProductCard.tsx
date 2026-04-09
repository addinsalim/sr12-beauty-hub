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
    <div className="group glow-ring relative flex flex-col overflow-hidden rounded-2xl glass border-border/30 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-glow-lg">
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {product.discount && (
          <span className="rounded-full bg-accent/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground shadow-sm">
            -{product.discount}%
          </span>
        )}
        {isOutOfStock && (
          <span className="rounded-full bg-muted/80 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {t.products.outOfStock}
          </span>
        )}
      </div>

      {/* Image */}
      <Link to={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-gradient-gold">
        <img
          src={categoryImages[product.category] || productParfum}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center glass py-3.5 transition-transform duration-300 group-hover:translate-y-0">
            <ShoppingBag className="mr-2 h-4 w-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">{t.products.addToCart}</span>
          </div>
        )}
      </Link>

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

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2">
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
            <span className="font-display text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
