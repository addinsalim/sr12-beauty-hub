import { supabase } from '@/integrations/supabase/client';

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Public product columns (excludes reseller_price)
const PUBLIC_PRODUCT_COLUMNS = 'id, name, slug, category_id, price, discount, stock, description, rating, review_count, bpom, halal, weight, expired_date, is_active, created_at, updated_at, categories(name, slug), product_images(id, image_url, is_primary, sort_order), variants(id, name, type, price, stock)';

// Product queries (public-facing — no reseller_price)
export async function fetchProducts(categorySlug?: string) {
  let query = supabase
    .from('products')
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (categorySlug) {
    query = query.eq('categories.slug', categorySlug);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Filter by category if needed (since join filter works differently)
  if (categorySlug) {
    return (data || []).filter((p: any) => p.categories?.slug === categorySlug);
  }
  return data || [];
}

export async function fetchProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data || [];
}

// Admin product CRUD
export async function createProduct(product: any) {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, product: any) {
  const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Variants
export async function createVariant(variant: any) {
  const { data, error } = await supabase.from('variants').insert(variant).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVariant(id: string) {
  const { error } = await supabase.from('variants').delete().eq('id', id);
  if (error) throw error;
}

// Product images
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export async function uploadProductImage(file: File, productId: string) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file maksimal 5MB');
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Hanya file gambar (JPG, PNG, WebP, GIF) yang diizinkan');
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Ekstensi file tidak valid');
  }

  const path = `${productId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
  return urlData.publicUrl;
}

export async function addProductImage(productId: string, imageUrl: string, isPrimary = false) {
  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, image_url: imageUrl, is_primary: isPrimary })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductImage(id: string, imageUrl: string) {
  // Delete from storage
  const path = imageUrl.split('/product-images/')[1];
  if (path) {
    await supabase.storage.from('product-images').remove([path]);
  }
  // Delete from DB
  const { error } = await supabase.from('product_images').delete().eq('id', id);
  if (error) throw error;
}

// Admin fetch all products (including inactive)
export async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`*, categories(name, slug), product_images(id, image_url, is_primary, sort_order), variants(id, name, type, price, stock)`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
