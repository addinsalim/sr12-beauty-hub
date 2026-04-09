import { useState, useEffect, useCallback, useRef } from 'react';
import { Star, MessageSquare, User, Pencil, Trash2, X, ImagePlus, ZoomIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ReviewImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile?: { full_name: string | null; avatar_url: string | null };
  images?: ReviewImage[];
}

interface ProductReviewsProps {
  productId: string;
  onReviewAdded?: () => void;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

const ImageUploader = ({
  images,
  onAdd,
  onRemove,
  disabled,
}: {
  images: { file?: File; url: string; id?: string }[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onAdd(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((img, i) => (
        <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
          <img src={img.url} alt="" className="h-full w-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      {images.length < MAX_IMAGES && !disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-[10px]">Foto</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

const ReviewImageGallery = ({ images }: { images: ReviewImage[] }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {images.map(img => (
          <button
            key={img.id}
            onClick={() => setLightboxUrl(img.image_url)}
            className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border transition hover:border-primary sm:h-20 sm:w-20"
          >
            <img src={img.image_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition group-hover:bg-foreground/20">
              <ZoomIn className="h-4 w-4 text-background opacity-0 transition group-hover:opacity-100" />
            </div>
          </button>
        ))}
      </div>
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-2xl border-none bg-transparent p-0 shadow-none">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="" className="max-h-[80vh] w-full rounded-xl object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
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
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Image states
  const [newImages, setNewImages] = useState<{ file: File; url: string }[]>([]);
  const [editImages, setEditImages] = useState<{ file?: File; url: string; id?: string }[]>([]);
  const [editRemovedImageIds, setEditRemovedImageIds] = useState<string[]>([]);

  const validateAndAddImages = (
    files: File[],
    current: { file?: File; url: string }[],
    setter: (imgs: any[]) => void
  ) => {
    const remaining = MAX_IMAGES - current.length;
    const valid: { file: File; url: string }[] = [];

    for (const file of files.slice(0, remaining)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: 'Format tidak didukung', description: 'Gunakan JPEG, PNG, WebP, atau GIF.', variant: 'destructive' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'File terlalu besar', description: 'Maksimal 5MB per gambar.', variant: 'destructive' });
        continue;
      }
      valid.push({ file, url: URL.createObjectURL(file) });
    }

    if (valid.length > 0) setter([...current, ...valid]);
  };

  const uploadImages = async (reviewId: string, files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user!.id}/${reviewId}/${Date.now()}-${i}.${ext}`;

      const { error } = await supabase.storage
        .from('review-images')
        .upload(path, file, { contentType: file.type });

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('review-images')
        .getPublicUrl(path);

      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) { setLoading(false); return; }

    const reviewList = data || [];
    const reviewIds = reviewList.map(r => r.id);
    const userIds = [...new Set(reviewList.map(r => r.user_id))];

    // Fetch profiles and images in parallel
    const [profilesRes, imagesRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds)
        : Promise.resolve({ data: [] }),
      reviewIds.length > 0
        ? supabase.from('review_images').select('*').in('review_id', reviewIds).order('sort_order')
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    (profilesRes.data || []).forEach(p => { profileMap[p.user_id] = p; });

    const imageMap: Record<string, ReviewImage[]> = {};
    (imagesRes.data || []).forEach((img: any) => {
      if (!imageMap[img.review_id]) imageMap[img.review_id] = [];
      imageMap[img.review_id].push(img);
    });

    const enriched = reviewList.map(r => ({
      ...r,
      profile: profileMap[r.user_id],
      images: imageMap[r.id] || [],
    }));
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

  const updateProductRating = async (updatedReviews: { rating: number }[]) => {
    const count = updatedReviews.length;
    const avg = count > 0 ? updatedReviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    await supabase.from('products').update({
      rating: Math.round(avg * 10) / 10,
      review_count: count,
    }).eq('id', productId);
  };

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
    const { data: insertedReview, error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating: newRating,
      comment: trimmed || null,
    }).select('id').single();

    if (error || !insertedReview) {
      toast({ title: 'Gagal mengirim ulasan', description: error?.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Upload images
    if (newImages.length > 0) {
      const urls = await uploadImages(insertedReview.id, newImages.map(i => i.file));
      if (urls.length > 0) {
        await supabase.from('review_images').insert(
          urls.map((url, idx) => ({ review_id: insertedReview.id, image_url: url, sort_order: idx }))
        );
      }
    }

    const updatedReviews = [...reviews.map(r => ({ rating: r.rating })), { rating: newRating }];
    await updateProductRating(updatedReviews);

    toast({ title: 'Ulasan terkirim', description: 'Terima kasih atas ulasan Anda!' });
    setNewRating(0);
    setNewComment('');
    setNewImages([]);
    setSubmitting(false);
    fetchReviews();
    onReviewAdded?.();
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
    setEditImages((review.images || []).map(img => ({ url: img.image_url, id: img.id })));
    setEditRemovedImageIds([]);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditComment('');
    setEditImages([]);
    setEditRemovedImageIds([]);
  };

  const handleSaveEdit = async () => {
    if (!editingReview || editRating === 0) return;
    const trimmed = editComment.trim();
    if (trimmed.length > 500) {
      toast({ title: 'Komentar terlalu panjang', description: 'Maksimal 500 karakter.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').update({
      rating: editRating,
      comment: trimmed || null,
    }).eq('id', editingReview.id);

    if (error) {
      toast({ title: 'Gagal mengubah ulasan', description: error.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Delete removed images
    if (editRemovedImageIds.length > 0) {
      await supabase.from('review_images').delete().in('id', editRemovedImageIds);
    }

    // Upload new images
    const newFiles = editImages.filter(img => img.file).map(img => img.file!);
    if (newFiles.length > 0) {
      const urls = await uploadImages(editingReview.id, newFiles);
      if (urls.length > 0) {
        const existingCount = editImages.filter(img => !img.file).length;
        await supabase.from('review_images').insert(
          urls.map((url, idx) => ({ review_id: editingReview.id, image_url: url, sort_order: existingCount + idx }))
        );
      }
    }

    const updatedReviews = reviews.map(r =>
      r.id === editingReview.id ? { rating: editRating } : { rating: r.rating }
    );
    await updateProductRating(updatedReviews);

    toast({ title: 'Ulasan diperbarui' });
    handleCancelEdit();
    setSubmitting(false);
    fetchReviews();
    onReviewAdded?.();
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ulasan ini?')) return;

    setDeleting(true);
    // Images will be cascade-deleted from review_images table
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

    if (error) {
      toast({ title: 'Gagal menghapus ulasan', description: error.message, variant: 'destructive' });
      setDeleting(false);
      return;
    }

    const updatedReviews = reviews.filter(r => r.id !== reviewId).map(r => ({ rating: r.rating }));
    await updateProductRating(updatedReviews);

    toast({ title: 'Ulasan dihapus' });
    setUserReview(null);
    setDeleting(false);
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
          <div className="mb-3">
            <label className="mb-1 block text-xs text-muted-foreground">Foto (opsional, maks {MAX_IMAGES} gambar, 5MB per gambar)</label>
            <ImageUploader
              images={newImages}
              onAdd={(files) => validateAndAddImages(files, newImages, setNewImages)}
              onRemove={(i) => {
                URL.revokeObjectURL(newImages[i].url);
                setNewImages(prev => prev.filter((_, idx) => idx !== i));
              }}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || newRating === 0} className="rounded-full">
            {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </Button>
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
          {reviews.map(review => {
            const isOwn = user?.id === review.user_id;
            const isEditing = editingReview?.id === review.id;

            return (
              <div key={review.id} className={`rounded-xl border bg-card p-4 ${isOwn ? 'border-primary/30' : 'border-border'}`}>
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                    {review.profile?.avatar_url ? (
                      <img src={review.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {review.profile?.full_name || 'Pengguna'}
                      {isOwn && <span className="ml-2 text-xs text-primary">(Anda)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                  {!isEditing && <StarRating rating={review.rating} size="sm" />}
                  {isOwn && !isEditing && (
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(review)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground" title="Edit ulasan">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(review.id)} disabled={deleting} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" title="Hapus ulasan">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Rating</label>
                      <StarRating rating={editRating} onChange={setEditRating} />
                    </div>
                    <div>
                      <Textarea
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                        placeholder="Bagikan pengalaman Anda..."
                        maxLength={500}
                        className="resize-none"
                        rows={3}
                      />
                      <span className="mt-1 block text-right text-xs text-muted-foreground">{editComment.length}/500</span>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Foto (maks {MAX_IMAGES} gambar)</label>
                      <ImageUploader
                        images={editImages}
                        onAdd={(files) => validateAndAddImages(files, editImages, setEditImages)}
                        onRemove={(i) => {
                          const img = editImages[i];
                          if (img.id) setEditRemovedImageIds(prev => [...prev, img.id!]);
                          if (img.file) URL.revokeObjectURL(img.url);
                          setEditImages(prev => prev.filter((_, idx) => idx !== i));
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} disabled={submitting || editRating === 0} size="sm" className="rounded-full">
                        {submitting ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm" className="rounded-full">
                        <X className="mr-1 h-3 w-3" /> Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {review.comment && <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}
                    <ReviewImageGallery images={review.images || []} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
