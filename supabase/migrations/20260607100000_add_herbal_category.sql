-- Tambah kategori Herbal ke tabel categories
INSERT INTO public.categories (name, slug, description)
VALUES ('Herbal', 'herbal', 'Produk herbal alami SR12 – solusi kesehatan & kecantikan dari alam')
ON CONFLICT (slug) DO NOTHING;
