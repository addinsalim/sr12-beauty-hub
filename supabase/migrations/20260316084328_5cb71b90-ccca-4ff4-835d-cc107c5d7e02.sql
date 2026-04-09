
-- Create review_images table
CREATE TABLE public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view review images
CREATE POLICY "Review images viewable by everyone"
  ON public.review_images FOR SELECT
  USING (true);

-- Users can insert images for their own reviews
CREATE POLICY "Users can insert own review images"
  ON public.review_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_images.review_id
        AND reviews.user_id = auth.uid()
    )
  );

-- Users can delete images from their own reviews
CREATE POLICY "Users can delete own review images"
  ON public.review_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_images.review_id
        AND reviews.user_id = auth.uid()
    )
  );

-- Admins can manage all review images
CREATE POLICY "Admins can manage review images"
  ON public.review_images FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true);

-- Storage policies for review-images bucket
CREATE POLICY "Anyone can view review images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own review images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);
