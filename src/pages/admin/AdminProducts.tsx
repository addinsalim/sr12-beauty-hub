import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ImagePlus, X, Package } from 'lucide-react';
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

  // Form state
  const [form, setForm] = useState({
    name: '', slug: '', category_id: '', price: 0, reseller_price: 0,
    discount: 0, stock: 0, description: '', bpom: false, halal: false,
    weight: 0, expired_date: '', is_active: true,
  });

  const [newVariant, setNewVariant] = useState({ name: '', type: 'Ukuran', price: 0, stock: 0 });

  const loadData = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([fetchAllProducts(), fetchCategories()]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', category_id: '', price: 0, reseller_price: 0, discount: 0, stock: 0, description: '', bpom: false, halal: false, weight: 0, expired_date: '', is_active: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (product: any) => {
    setForm({
      name: product.name, slug: product.slug, category_id: product.category_id || '',
      price: Number(product.price), reseller_price: Number(product.reseller_price),
      discount: product.discount || 0, stock: product.stock, description: product.description || '',
      bpom: product.bpom, halal: product.halal, weight: product.weight || 0,
      expired_date: product.expired_date || '', is_active: product.is_active,
    });
    setEditing(product);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const payload = { ...form, slug, category_id: form.category_id || null };
      if (editing) {
        await updateProduct(editing.id, payload);
        toast({ title: 'Produk diperbarui!' });
      } else {
        await createProduct(payload);
        toast({ title: 'Produk ditambahkan!' });
      }
      resetForm();
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await deleteProduct(id);
      toast({ title: 'Produk dihapus!' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Kelola Produk</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Produk
        </Button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl my-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={resetForm}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nama Produk *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Harga Normal (Rp)</Label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Harga Reseller (Rp)</Label>
                  <Input type="number" value={form.reseller_price} onChange={e => setForm({ ...form, reseller_price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Diskon (%)</Label>
                  <Input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Berat (gram)</Label>
                  <Input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Tanggal Expired</Label>
                  <Input type="date" value={form.expired_date} onChange={e => setForm({ ...form, expired_date: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Deskripsi</Label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.bpom} onChange={e => setForm({ ...form, bpom: e.target.checked })} /> BPOM
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.halal} onChange={e => setForm({ ...form, halal: e.target.checked })} /> Halal
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Batal</Button>
                <Button type="submit">{editing ? 'Simpan Perubahan' : 'Tambah Produk'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start gap-4">
              {/* Thumbnail */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {product.product_images?.[0] ? (
                  <img src={product.product_images.find((i: any) => i.is_primary)?.image_url || product.product_images[0].image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-8 w-8" /></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.categories?.name || 'Tanpa kategori'}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-sm">
                  <span className="font-medium text-primary">{formatPrice(Number(product.price))}</span>
                  <span className="text-muted-foreground">Stok: {product.stock}</span>
                  {!product.is_active && <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Nonaktif</span>}
                </div>
              </div>
            </div>

            {/* Images section */}
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-foreground">Gambar</span>
                <label className={`flex items-center gap-1 cursor-pointer rounded-lg px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 ${uploading ? 'opacity-50' : ''}`}>
                  <ImagePlus className="h-3.5 w-3.5" />
                  Upload
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => e.target.files && handleImageUpload(product.id, e.target.files)} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.product_images?.map((img: any) => (
                  <div key={img.id} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border">
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
              <div className="flex flex-wrap gap-2 mb-2">
                {product.variants?.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-muted-foreground">({v.type})</span>
                    <span className="text-primary">{formatPrice(Number(v.price))}</span>
                    <button onClick={() => handleDeleteVariant(v.id)}><X className="h-3 w-3 text-destructive" /></button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <Input placeholder="Nama" className="w-24 h-8 text-xs" value={newVariant.name} onChange={e => setNewVariant({ ...newVariant, name: e.target.value })} />
                <select className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={newVariant.type} onChange={e => setNewVariant({ ...newVariant, type: e.target.value })}>
                  <option>Ukuran</option><option>Warna</option><option>Jenis</option>
                </select>
                <Input type="number" placeholder="Harga" className="w-24 h-8 text-xs" value={newVariant.price || ''} onChange={e => setNewVariant({ ...newVariant, price: Number(e.target.value) })} />
                <Input type="number" placeholder="Stok" className="w-16 h-8 text-xs" value={newVariant.stock || ''} onChange={e => setNewVariant({ ...newVariant, stock: Number(e.target.value) })} />
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleAddVariant(product.id)}>+ Varian</Button>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
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
