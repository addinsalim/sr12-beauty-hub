-- Seed mock products for testing
INSERT INTO public.products (name, slug, category_id, price, discount, stock, description, rating, review_count, bpom, halal, weight, is_active)
SELECT 
  'Exclusive Parfum Gold', 
  'exclusive-parfum-gold', 
  id, 
  150000, 
  10, 
  50, 
  'Parfum mewah dengan aroma keemasan yang segar dan tahan lama sepanjang hari.', 
  4.8, 
  12, 
  true, 
  true, 
  100, 
  true
FROM public.categories WHERE slug = 'parfum'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, category_id, price, discount, stock, description, rating, review_count, bpom, halal, weight, is_active)
SELECT 
  'Facial Wash SR12', 
  'facial-wash-sr12', 
  id, 
  65000, 
  0, 
  100, 
  'Sabun pembersih wajah dengan formula lembut untuk membersihkan kotoran dan menjaga kelembaban kulit.', 
  4.7, 
  25, 
  true, 
  true, 
  150, 
  true
FROM public.categories WHERE slug = 'skincare'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, category_id, price, discount, stock, description, rating, review_count, bpom, halal, weight, is_active)
SELECT 
  'Lip cream Matte Red', 
  'lip-cream-matte-red', 
  id, 
  85000, 
  15, 
  75, 
  'Lip cream matte dengan warna merah intens yang tahan lama dan tidak membuat bibir kering.', 
  4.9, 
  18, 
  true, 
  true, 
  50, 
  true
FROM public.categories WHERE slug = 'kosmetik'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, category_id, price, discount, stock, description, rating, review_count, bpom, halal, weight, is_active)
SELECT 
  'Madu Hutan Asli SR12', 
  'madu-hutan-asli-sr12', 
  id, 
  120000, 
  5, 
  30, 
  'Madu hutan alami berkualitas tinggi untuk menjaga kesehatan dan imunitas tubuh.', 
  4.9, 
  40, 
  true, 
  true, 
  250, 
  true
FROM public.categories WHERE slug = 'herbal'
ON CONFLICT (slug) DO NOTHING;
