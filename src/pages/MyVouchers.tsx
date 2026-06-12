import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Coins, Copy, ArrowLeft, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/supabaseHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const MyVouchers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [points, setPoints] = useState(0);
  const [pointTxns, setPointTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from('vouchers').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('user_points').select('balance').eq('user_id', user.id).maybeSingle(),
      supabase.from('point_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]).then(([v, p, pt]) => {
      const now = Date.now();
      setVouchers((v.data || []).filter((x: any) => !x.valid_until || new Date(x.valid_until).getTime() > now));
      setPoints(p.data?.balance || 0);
      setPointTxns(pt.data || []);
      setLoading(false);
    });
  }, [user]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ${code} disalin!`);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-4xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl text-foreground mb-6">Voucher & Poin</h1>

      <Tabs defaultValue="vouchers">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="vouchers"><Ticket className="h-4 w-4 mr-2" />Voucher</TabsTrigger>
          <TabsTrigger value="points"><Coins className="h-4 w-4 mr-2" />Poin Saya</TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <Ticket className="h-14 w-14 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Belum ada voucher tersedia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vouchers.map(v => (
                <div key={v.id} className="rounded-2xl glass p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-l-4 border-primary">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Ticket className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-display text-base sm:text-lg font-bold text-foreground">
                          {v.discount_type === 'percent' ? `${v.discount_value}% OFF` : `${formatPrice(v.discount_value)} OFF`}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">{v.code}</Badge>
                      </div>
                      {v.description && <p className="text-xs text-muted-foreground line-clamp-1">{v.description}</p>}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] sm:text-xs text-muted-foreground">
                        <span>Min. {formatPrice(v.min_purchase)}</span>
                        {v.valid_until && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(v.valid_until).toLocaleDateString('id-ID')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyCode(v.code)}
                    className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground py-2 px-4 text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" /> Salin Kode
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="points">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-rose-gold p-6 sm:p-8 text-primary-foreground mb-6 shadow-glow">
            <p className="text-sm opacity-90">Saldo Poin Anda</p>
            <p className="font-display text-4xl sm:text-5xl font-bold mt-1">{points.toLocaleString('id-ID')}</p>
            <p className="text-xs opacity-80 mt-2">1 poin = Rp1 saat checkout</p>
          </div>

          <h2 className="font-semibold mb-3">Riwayat Poin</h2>
          {pointTxns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada riwayat poin</p>
          ) : (
            <div className="space-y-2">
              {pointTxns.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-xl glass p-3">
                  <div>
                    <p className="text-sm font-medium">{t.reference || (t.type === 'earn' ? 'Poin diperoleh' : t.type === 'redeem' ? 'Poin ditukar' : 'Penyesuaian')}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString('id-ID')}</p>
                  </div>
                  <span className={`font-bold text-sm ${t.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {t.amount > 0 ? '+' : ''}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyVouchers;
