import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ImagePlus, X, Package, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, fetchAllProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, addProductImage, deleteProductImage, createVariant, deleteVariant, fetchCategories } from '@/lib/supabaseHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AdminProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Form state — NOTE: reseller_price dihapus (tidak ada di schema DB)
  const [form, setForm] = useState({
    name: '', slug: '', category_id: '', price: 0,
    discount: 0, stock: 0, description: '', bpom: false, halal: false,
    weight: 0, expired_date: '', is_active: true,
  });

  const [newVariant, setNewVariant] = useState({ name: '', type: 'Ukuran', price: 0, stock: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([fetchAllProducts(), fetchCategories()]);
      setProducts(prods);

      // Pastikan kategori Herbal selalu ada di list (fallback jika migration DB belum dijalankan)
      const REQUIRED_CATEGORIES = [
        { slug: 'parfum',   name: 'Parfum',   description: 'Koleksi parfum eksklusif SR12' },
        { slug: 'kosmetik', name: 'Kosmetik', description: 'Produk kosmetik berkualitas SR12' },
        { slug: 'skincare', name: 'Skincare', description: 'Rangkaian perawatan kulit SR12' },
        { slug: 'herbal',   name: 'Herbal',   description: 'Produk herbal alami SR12' },
      ];
      const mergedCats = [...cats];
      for (const req of REQUIRED_CATEGORIES) {
        if (!mergedCats.find(c => c.slug === req.slug)) {
          // Coba insert ke DB, jika gagal tetap tampilkan sebagai fallback lokal
          try {
            const { data: inserted } = await (await import('@/integrations/supabase/client')).supabase
              .from('categories')
              .insert({ name: req.name, slug: req.slug, description: req.description })
              .select()
              .single();
            if (inserted) mergedCats.push(inserted);
          } catch {
            mergedCats.push({ id: `local-${req.slug}`, ...req });
          }
        }
      }
      // Urutkan alfabetis
      mergedCats.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(mergedCats);
    } catch (err: any) {
      console.error('[AdminProducts] loadData error:', err);
      toast({ title: 'Gagal memuat data', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', category_id: '', price: 0, discount: 0, stock: 0, description: '', bpom: false, halal: false, weight: 0, expired_date: '', is_active: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (product: any) => {
    setForm({
      name: product.name, slug: product.slug, category_id: product.category_id || '',
      price: Number(product.price),
      discount: product.discount || 0, stock: product.stock, description: product.description || '',
      bpom: !!product.bpom, halal: !!product.halal, weight: product.weight || 0,
      expired_date: product.expired_date || '', is_active: product.is_active !== false,
    });
    setEditing(product);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Nama produk wajib diisi', variant: 'destructive' });
      return;
    }
    if (!form.price || form.price <= 0) {
      toast({ title: 'Harga harus lebih dari 0', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const slugGenerated = (form.slug || form.name)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const payload = {
        name: form.name.trim(),
        slug: slugGenerated,
        category_id: form.category_id || null,
        price: Number(form.price),
        discount: Number(form.discount) || 0,
        stock: Number(form.stock) || 0,
        description: form.description.trim() || null,
        bpom: form.bpom,
        halal: form.halal,
        weight: form.weight ? Number(form.weight) : null,
        expired_date: form.expired_date || null,
        is_active: form.is_active,
      };

      console.log('[AdminProducts] Submitting payload:', payload);

      if (editing) {
        await updateProduct(editing.id, payload);
        toast({ title: '✅ Produk diperbarui!' });
      } else {
        await createProduct(payload);
        toast({ title: '✅ Produk ditambahkan!' });
      }
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('[AdminProducts] handleSubmit error:', err);
      // Show detailed error info from Supabase
      const errCode = err?.code ? ` (kode: ${err.code})` : '';
      const errHint = err?.hint ? ` — ${err.hint}` : '';
      const errDetail = err?.details ? ` — ${err.details}` : '';
      toast({
        title: 'Gagal menyimpan produk',
        description: `${err.message}${errCode}${errHint}${errDetail}`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await deleteProduct(id);
      toast({ title: 'Produk berhasil dihapus!' });
      loadData();
    } catch (err: any) {
      if (err.message === 'has_transactions') {
        toast({
          title: 'Produk Dinonaktifkan',
          description: 'Produk tidak bisa dihapus karena sudah memiliki riwayat transaksi/pesanan. Status produk otomatis diubah menjadi non-aktif.',
        });
        loadData();
      } else {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    }
  };

  const handleImageUpload = async (productId: string, files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file, productId);
        const product = products.find(p => p.id === productId);
        const isPrimary = !product?.product_images?.length;
        await addProductImage(productId, url, isPrimary);
      }
      toast({ title: 'Gambar diupload!' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleDeleteImage = async (imgId: string, imgUrl: string) => {
    try {
      await deleteProductImage(imgId, imgUrl);
      toast({ title: 'Gambar dihapus!' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddVariant = async (productId: string) => {
    if (!newVariant.name) return;
    try {
      await createVariant({ ...newVariant, product_id: productId });
      setNewVariant({ name: '', type: 'Ukuran', price: 0, stock: 0 });
      toast({ title: 'Varian ditambahkan!' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteVariant = async (id: string) => {
    try {
      await deleteVariant(id);
      toast({ title: 'Varian dihapus!' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.categories?.name || '').toLowerCase().includes(q) ||
      (p.slug || '').toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Kelola Produk</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1" /> Tambah Produk
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="admin-products-search"
          placeholder="Cari nama produk, kategori..."
          className="pl-9 pr-9 w-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Menampilkan {filteredProducts.length} dari {products.length} produk
        {search && <span className="ml-1">untuk "<strong>{search}</strong>"</span>}
      </p>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl my-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{editing ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button onClick={resetForm} disabled={submitting}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Nama Produk *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Parfum Rose Gold 50ml"
                    required
                  />
                </div>
                <div>
                  <Label>Slug <span className="text-xs text-muted-foreground">(otomatis dari nama)</span></Label>
                  <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="kosongkan untuk auto-generate" />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Harga Normal (Rp) *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.price || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setForm({ ...form, price: val ? Number(val) : 0 });
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Diskon (%)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.discount || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const num = val ? Number(val) : 0;
                      setForm({ ...form, discount: Math.min(num, 100) });
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.stock || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setForm({ ...form, stock: val ? Number(val) : 0 });
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Berat (gram)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.weight || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setForm({ ...form, weight: val ? Number(val) : 0 });
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Tanggal Expired</Label>
                  <Input type="date" value={form.expired_date} onChange={e => setForm({ ...form, expired_date: e.target.value })} className="w-full" />
                </div>
              </div>

              <div>
                <Label>Deskripsi</Label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                  placeholder="Deskripsi produk..."
                />
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.bpom} onChange={e => setForm({ ...form, bpom: e.target.checked })} className="accent-primary" /> Bersertifikat BPOM
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.halal} onChange={e => setForm({ ...form, halal: e.target.checked })} className="accent-primary" /> Halal
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-primary" /> Produk Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={resetForm} disabled={submitting} className="w-full sm:w-auto">Batal</Button>
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting && <span className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" />}
                  {editing ? 'Simpan Perubahan' : 'Tambah Produk'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start gap-4">
              {/* Thumbnail */}
              <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {product.product_images?.[0] ? (
                  <img src={product.product_images.find((i: any) => i.is_primary)?.image_url || product.product_images[0].image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-6 w-6 sm:h-8 sm:w-8" /></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight mb-1">{product.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{product.categories?.name || 'Tanpa kategori'}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEdit(product)}><Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleDelete(product.id)}><Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm items-center">
                  <span className="font-medium text-primary">{formatPrice(Number(product.price))}</span>
                  <span className="text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">Stok: {product.stock}</span>
                  {!product.is_active && <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Nonaktif</span>}
                </div>
              </div>
            </div>

            {/* Images section */}
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-foreground">Gambar</span>
                <label className={`flex items-center gap-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 ${uploading ? 'opacity-50' : ''}`}>
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => e.target.files && handleImageUpload(product.id, e.target.files)} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.product_images?.map((img: any) => (
                  <div key={img.id} className="group relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-lg border border-border">
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => handleDeleteImage(img.id, img.image_url)} className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                    {img.is_primary && <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center">Utama</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Variants section */}
            <div className="mt-3 border-t border-border pt-3">
              <span className="text-sm font-medium text-foreground mb-2 block">Varian ({product.variants?.length || 0})</span>
              <div className="flex flex-wrap gap-2 mb-3">
                {product.variants?.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5 text-xs">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-muted-foreground">({v.type})</span>
                    <span className="text-primary font-semibold">{formatPrice(Number(v.price))}</span>
                    <button onClick={() => handleDeleteVariant(v.id)} className="ml-1 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-end">
                <Input placeholder="Nama" className="h-8 text-xs col-span-2 sm:col-span-1 sm:w-28" value={newVariant.name} onChange={e => setNewVariant({ ...newVariant, name: e.target.value })} />
                <select className="h-8 rounded-md border border-input bg-background px-2 text-xs w-full sm:w-24" value={newVariant.type} onChange={e => setNewVariant({ ...newVariant, type: e.target.value })}>
                  <option>Ukuran</option><option>Warna</option><option>Jenis</option>
                </select>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Harga"
                  className="h-8 text-xs w-full sm:w-28"
                  value={newVariant.price || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewVariant({ ...newVariant, price: val ? Number(val) : 0 });
                  }}
                />
                <div className="flex gap-2 col-span-2 sm:col-span-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Stok"
                    className="h-8 text-xs flex-1 sm:w-20"
                    value={newVariant.stock || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNewVariant({ ...newVariant, stock: val ? Number(val) : 0 });
                    }}
                  />
                  <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={() => handleAddVariant(product.id)}>+ Varian</Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-12 w-12" />
            <p>Belum ada produk. Klik "Tambah Produk" untuk mulai.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
