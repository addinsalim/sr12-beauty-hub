import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile?: { full_name: string | null; avatar_url: string | null };
}

interface ProductReviewsProps {
  productId: string;
  onReviewAdded?: () => void;
}

const StarRating = ({ rating, onChange, size = 'md' }: { rating: number; onChange?: (r: number) => void; size?: 'sm' | 'md' }) => {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star className={`${sizeClass} ${i <= (hover || rating) ? 'fill-gold text-gold' : 'text-border'}`} />
        </button>
      ))}
    </div>
  );
};

const RatingBar = ({ star, count, total }: { star: number; count: number; total: number }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-6 text-right text-muted-foreground">{star}</span>
      <Star className="h-3 w-3 fill-gold text-gold" />
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-muted-foreground">{count}</span>
    </div>
  );
};

const ProductReviews = ({ productId, onReviewAdded }: ProductReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }

    const reviewList = data || [];
    const userIds = [...new Set(reviewList.map(r => r.user_id))];

    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      if (profiles) {
        profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));
      }
    }

    const enriched = reviewList.map(r => ({ ...r, profile: profileMap[r.user_id] }));
    setReviews(enriched);

    if (user) {
      const existing = enriched.find(r => r.user_id === user.id);
      setUserReview(existing || null);
    }

    setLoading(false);
  }, [productId, user]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Login diperlukan', description: 'Silakan login terlebih dahulu untuk memberikan ulasan.', variant: 'destructive' });
      return;
    }
    if (newRating === 0) {
      toast({ title: 'Rating diperlukan', description: 'Pilih rating bintang terlebih dahulu.', variant: 'destructive' });
      return;
    }
    const trimmed = newComment.trim();
    if (trimmed.length > 500) {
      toast({ title: 'Komentar terlalu panjang', description: 'Maksimal 500 karakter.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating: newRating,
      comment: trimmed || null,
    });

    if (error) {
      toast({ title: 'Gagal mengirim ulasan', description: error.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Update product rating/review_count
    const newCount = reviews.length + 1;
    const newAvg = (reviews.reduce((s, r) => s + r.rating, 0) + newRating) / newCount;
    await supabase.from('products').update({
      rating: Math.round(newAvg * 10) / 10,
      review_count: newCount,
    }).eq('id', productId);

    toast({ title: 'Ulasan terkirim', description: 'Terima kasih atas ulasan Anda!' });
    setNewRating(0);
    setNewComment('');
    setSubmitting(false);
    fetchReviews();
    onReviewAdded?.();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-foreground">
        <MessageSquare className="h-5 w-5" /> Ulasan Produk
      </h2>

      {/* Summary */}
      <div className="mb-8 grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl bg-secondary/50 px-8 py-6">
          <span className="font-display text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
          <StarRating rating={Math.round(avgRating)} size="sm" />
          <span className="mt-1 text-sm text-muted-foreground">{reviews.length} ulasan</span>
        </div>
        <div className="flex flex-col justify-center gap-1.5">
          {ratingCounts.map(rc => (
            <RatingBar key={rc.star} star={rc.star} count={rc.count} total={reviews.length} />
          ))}
        </div>
      </div>

      {/* Review form */}
      {user && !userReview && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Tulis Ulasan</h3>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-muted-foreground">Rating</label>
            <StarRating rating={newRating} onChange={setNewRating} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-muted-foreground">Komentar (opsional, maks 500 karakter)</label>
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Bagikan pengalaman Anda..."
              maxLength={500}
              className="resize-none"
              rows={3}
            />
            <span className="mt-1 block text-right text-xs text-muted-foreground">{newComment.length}/500</span>
          </div>
          <Button onClick={handleSubmit} disabled={submitting || newRating === 0} className="rounded-full">
            {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </Button>
        </div>
      )}

      {user && userReview && (
        <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
          Anda sudah memberikan ulasan untuk produk ini.
        </div>
      )}

      {!user && (
        <div className="mb-8 rounded-xl border border-border bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
          <a href="/login" className="font-medium text-primary hover:underline">Login</a> untuk memberikan ulasan.
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Belum ada ulasan untuk produk ini.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  {review.profile?.avatar_url ? (
                    <img src={review.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{review.profile?.full_name || 'Pengguna'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>
              {review.comment && <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
