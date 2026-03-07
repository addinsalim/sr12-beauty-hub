import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const { t } = useI18n();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Keranjang Kosong</h2>
        <p className="text-muted-foreground mb-6">Belum ada produk di keranjang Anda.</p>
        <Button asChild>
          <Link to="/products">
            <ArrowLeft className="mr-2 h-4 w-4" /> Belanja Sekarang
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">{t.nav.cart}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">{t.nav.cart} ({totalItems})</h1>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1 h-4 w-4" /> Hapus Semua
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => {
              const key = `${item.productId}::${item.variantId || ''}`;
              return (
                <div key={key} className="flex gap-3 sm:gap-4 rounded-xl border border-border bg-card p-3 sm:p-4">
                  <Link to={`/products/${item.slug}`} className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/products/${item.slug}`} className="font-display text-sm font-semibold text-card-foreground hover:text-primary line-clamp-2">
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>
                        )}
                      </div>
                      <button onClick={() => removeItem(item.productId, item.variantId)} className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <div className="inline-flex items-center rounded-lg border border-border">
                        <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)} className="px-2.5 py-1.5 text-muted-foreground transition hover:text-foreground">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)} className="px-2.5 py-1.5 text-muted-foreground transition hover:text-foreground">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-sm sm:text-base font-bold text-primary">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-bold text-card-foreground mb-4">Ringkasan Belanja</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Produk ({totalItems})</span>
                  <span className="text-foreground font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Ongkos Kirim</span>
                  <span className="text-foreground font-medium">-</span>
                </div>
              </div>
              <div className="my-4 border-t border-border" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-card-foreground">Total</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
              </div>
              <Button className="mt-5 w-full rounded-full" size="lg" onClick={() => navigate('/checkout')}>
                Checkout ({totalItems})
              </Button>
              <Link to="/products" className="mt-3 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition">
                <ArrowLeft className="h-3.5 w-3.5" /> Lanjut Belanja
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
