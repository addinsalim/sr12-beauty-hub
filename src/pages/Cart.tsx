import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';

const Cart = () => {
    const { items, updateQuantity, removeItem, clearCart } = useCart();
    const { t } = useI18n();
    const navigate = useNavigate();

    // Track selected items using a state Set of "productId::variantId" keys
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    // Automatically select new items added to the cart
    useEffect(() => {
        if (items.length > 0) {
            setSelectedKeys(prev => {
                const next = new Set(prev);
                let changed = false;
                items.forEach(item => {
                    const key = `${item.productId}::${item.variantId || ''}`;
                    if (!next.has(key)) {
                        next.add(key);
                        changed = true;
                    }
                });
                // Clean up keys that are no longer in the cart items
                const currentKeys = new Set(items.map(item => `${item.productId}::${item.variantId || ''}`));
                next.forEach(key => {
                    if (!currentKeys.has(key)) {
                        next.delete(key);
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        } else {
            setSelectedKeys(new Set());
        }
    }, [items]);

    const toggleItem = (key: string) => {
        setSelectedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const allSelected = items.length > 0 && items.every(item => selectedKeys.has(`${item.productId}::${item.variantId || ''}`));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedKeys(new Set());
        } else {
            const allKeys = new Set(items.map(item => `${item.productId}::${item.variantId || ''}`));
            setSelectedKeys(allKeys);
        }
    };

    // Filter selected items for calculation and checkout
    const selectedItems = items.filter(item => selectedKeys.has(`${item.productId}::${item.variantId || ''}`));
    const selectedTotalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    const selectedTotalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Determine shipping price rule (free above Rp200.000)
    const SHIPPING_THRESHOLD = 200000;
    const SHIPPING_COST = 20000;
    const shipping = selectedItems.length > 0 && selectedTotalPrice >= SHIPPING_THRESHOLD ? 0 : (selectedItems.length > 0 ? SHIPPING_COST : 0);
    const finalTotal = selectedTotalPrice + shipping;

    const handleCheckout = () => {
        if (selectedItems.length === 0) return;
        navigate('/checkout', { state: { checkoutItems: selectedItems } });
    };

    if (items.length === 0) {
        return (
            <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center mx-auto">
                <div className="mb-6 rounded-full glass p-10 opacity-0 animate-scale-in">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                </div>
                <h1 className="mb-4 font-display text-3xl font-bold text-foreground">Keranjang Anda Kosong</h1>
                <p className="mb-10 text-muted-foreground">Sepertinya Anda belum menambahkan produk apapun ke keranjang.</p>
                <Button asChild variant="modern" size="lg">
                    <Link to="/products">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Mulai Belanja
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-10 pt-6 sm:pt-10">
            <div className="container mx-auto px-4">
                <div className="mb-6 sm:mb-10 flex flex-row items-center justify-between gap-4">
                    <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground accent-line">
                        {t.nav.cart || 'Keranjang'} ({items.length})
                    </h1>
                    <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0">
                        <Trash2 className="mr-2 h-4 w-4" /> Kosongkan
                    </Button>
                </div>

                {/* Pilih Semua Bar */}
                <div className="mb-6 flex flex-row items-center justify-between rounded-xl glass p-4 shadow-card">
                    <label className="flex items-center gap-3 cursor-pointer select-none font-medium text-sm text-foreground">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="h-5 w-5 rounded-md border-border text-primary focus:ring-primary/30 accent-primary cursor-pointer animate-scale-in"
                        />
                        Pilih Semua ({items.length} Produk)
                    </label>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                        Pilih produk yang ingin Anda checkout
                    </span>
                </div>

                <div className="grid gap-6 sm:gap-10 lg:grid-cols-3">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {items.map((item, i) => {
                            const key = `${item.productId}::${item.variantId || ''}`;
                            const isChecked = selectedKeys.has(key);
                            return (
                                <div
                                    key={key}
                                    className={`flex flex-row items-center gap-3 sm:gap-6 rounded-2xl sm:rounded-3xl glass p-3 sm:p-6 shadow-card transition-all duration-300 hover:shadow-glow opacity-0 animate-slide-up ${isChecked ? 'border-primary/20 bg-primary/[0.02]' : ''}`}
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    {/* Selection Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleItem(key)}
                                        className="h-5 w-5 rounded-md border-border text-primary focus:ring-primary/30 accent-primary cursor-pointer shrink-0"
                                    />

                                    <Link to={`/products/${item.slug}`} className="h-20 w-20 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-gold">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                                        />
                                    </Link>

                                    <div className="flex flex-1 flex-col w-full">
                                        <div className="mb-1 flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <Link to={`/products/${item.slug}`} className="font-display text-sm sm:text-lg font-bold text-foreground transition-colors hover:text-primary line-clamp-2">
                                                    {item.name}
                                                </Link>
                                                {item.variantName && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">{item.variantName}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.productId, item.variantId)}
                                                className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4">
                                            <div className="inline-flex items-center rounded-xl glass-strong border border-border/30 overflow-hidden">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                                                    className="p-1.5 sm:px-3 sm:py-1.5 transition-colors hover:bg-secondary/50 hover:text-primary"
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="w-8 sm:w-10 text-center text-xs sm:text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                                    className="p-1.5 sm:px-3 sm:py-1.5 transition-colors hover:bg-secondary/50 hover:text-primary"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <div className="font-display text-sm sm:text-lg font-bold text-primary shrink-0">
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-all hover:gap-3">
                            <ArrowLeft className="h-4 w-4" /> Lanjut Belanja
                        </Link>
                    </div>

                    {/* Checkout Summary */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl sm:rounded-3xl glass-strong border border-border/40 p-5 sm:p-8 shadow-glow opacity-0 animate-slide-in-right lg:sticky lg:top-28" style={{ animationDelay: '0.3s' }}>
                            <h2 className="mb-6 font-display text-xl font-bold text-foreground">Ringkasan Belanja</h2>

                            <div className="space-y-4 border-b border-border/30 pb-6 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal ({selectedTotalItems} barang terpilih)</span>
                                    <span>{formatPrice(selectedTotalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Biaya Pengiriman <br/><span className="text-[10px]">*Estimasi</span></span>
                                    <span className="text-right">
                                        {selectedItems.length === 0 ? '-' : (shipping === 0 ? 'Gratis' : formatPrice(shipping))}
                                    </span>
                                </div>
                                {shipping > 0 && selectedTotalPrice < SHIPPING_THRESHOLD && (
                                    <p className="text-[10px] text-accent font-medium mt-1">✨ Tambah {formatPrice(SHIPPING_THRESHOLD - selectedTotalPrice)} lagi untuk Free Ongkir!</p>
                                )}
                            </div>

                            <div className="my-6 flex justify-between font-display text-xl font-bold text-foreground">
                                <span>Total</span>
                                <span className="text-gradient-gold">{formatPrice(finalTotal)}</span>
                            </div>

                            <Button 
                                variant="modern" 
                                onClick={handleCheckout} 
                                className="w-full py-7" 
                                size="lg"
                                disabled={selectedTotalItems === 0}
                            >
                                Proses Checkout ({selectedTotalItems}) <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>

                            <p className="mt-6 text-center text-[11px] text-muted-foreground">
                                Kebijakan pengembalian 7 hari berlaku untuk semua produk.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
