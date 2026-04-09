import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { mockProducts, formatPrice } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import productParfum from '@/assets/product-parfum.png';
import productSkincare from '@/assets/product-skincare.png';

const categoryImages: Record<string, string> = {
    parfum: productParfum,
    skincare: productSkincare,
};

const Cart = () => {
    const { t } = useI18n();
    // Mock cart items using the first two products
    const [items, setItems] = useState([
        { ...mockProducts[0], quantity: 1 },
        { ...mockProducts[1], quantity: 2 },
    ]);

    const updateQuantity = (id: string, delta: number) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 200000 ? 0 : 20000;
    const total = subtotal + shipping;

    if (items.length === 0) {
        return (
            <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
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
        <div className="min-h-screen bg-background pb-20 pt-10">
            <div className="container mx-auto px-4">
                <h1 className="mb-10 font-display text-4xl font-bold text-foreground accent-line">
                    {t.nav.cart || 'Keranjang Belanja'}
                </h1>

                <div className="grid gap-10 lg:grid-cols-3">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {items.map((item, i) => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row items-center gap-6 rounded-3xl glass p-6 shadow-card transition-all duration-300 hover:shadow-glow opacity-0 animate-slide-up"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-gold">
                                    <img
                                        src={categoryImages[item.category] || productParfum}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <div className="flex flex-1 flex-col">
                                    <div className="mb-1 flex items-center justify-between">
                                        <h3 className="font-display text-lg font-bold text-foreground">{item.name}</h3>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-muted-foreground transition-colors hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="mb-4 text-xs text-muted-foreground uppercase tracking-wider">{item.category}</p>

                                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                                        <div className="inline-flex items-center rounded-xl glass-strong border border-border/30 overflow-hidden">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="px-3 py-1.5 transition-colors hover:bg-secondary/50"
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="px-3 py-1.5 transition-colors hover:bg-secondary/50"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="font-display text-lg font-bold text-primary">
                                            {formatPrice(item.price * item.quantity)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-all hover:gap-3">
                            <ArrowLeft className="h-4 w-4" /> Lanjut Belanja
                        </Link>
                    </div>

                    {/* Checkout Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 rounded-3xl glass-strong border border-border/40 p-8 shadow-glow opacity-0 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
                            <h2 className="mb-6 font-display text-xl font-bold text-foreground">Ringkasan Belanja</h2>

                            <div className="space-y-4 border-b border-border/30 pb-6 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Biaya Pengiriman</span>
                                    <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
                                </div>
                                {shipping > 0 && (
                                    <p className="text-[10px] text-accent font-medium">✨ Tambah Rp{formatPrice(200000 - subtotal)} lagi untuk Free Ongkir!</p>
                                )}
                            </div>

                            <div className="my-6 flex justify-between font-display text-xl font-bold text-foreground">
                                <span>Total</span>
                                <span className="text-gradient-gold">{formatPrice(total)}</span>
                            </div>

                            <Button variant="modern" className="w-full py-7" size="lg">
                                Proses Checkout <ArrowRight className="ml-2 h-5 w-5" />
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
