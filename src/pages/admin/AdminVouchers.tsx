import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Ticket, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/supabaseHelpers';

const empty = {
  code: '', description: '', discount_type: 'percent' as 'percent' | 'fixed',
  discount_value: 0, min_purchase: 0, max_discount: '', quota: '',
  valid_until: '', is_active: true,
};

const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false });
    setVouchers(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (v: any) => {
    setEditing(v);
    setForm({
      code: v.code, description: v.description || '',
      discount_type: v.discount_type, discount_value: v.discount_value,
      min_purchase: v.min_purchase, max_discount: v.max_discount?.toString() || '',
      quota: v.quota?.toString() || '', valid_until: v.valid_until ? v.valid_until.slice(0, 10) : '',
      is_active: v.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim() || form.discount_value <= 0) { toast.error('Kode & nilai diskon wajib diisi'); return; }
    setSaving(true);
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_purchase: Number(form.min_purchase) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      quota: form.quota ? Number(form.quota) : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from('vouchers').update(payload).eq('id', editing.id)
      : await supabase.from('vouchers').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? 'Voucher diperbarui' : 'Voucher dibuat');
    setOpen(false);
    load();
  };

  const remove = async (v: any) => {
    if (!confirm(`Hapus voucher ${v.code}?`)) return;
    const { error } = await supabase.from('vouchers').delete().eq('id', v.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Dihapus');
    load();
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Kelola Voucher</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Buat Voucher</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : vouchers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada voucher</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Kode</th>
                <th className="px-4 py-3 text-left font-medium">Diskon</th>
                <th className="px-4 py-3 text-left font-medium">Min. Beli</th>
                <th className="px-4 py-3 text-left font-medium">Terpakai</th>
                <th className="px-4 py-3 text-left font-medium">Berlaku Hingga</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">{v.code}</td>
                  <td className="px-4 py-3">{v.discount_type === 'percent' ? `${v.discount_value}%` : formatPrice(v.discount_value)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatPrice(v.min_purchase)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.used_count}{v.quota ? ` / ${v.quota}` : ''}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.valid_until ? new Date(v.valid_until).toLocaleDateString('id-ID') : '∞'}</td>
                  <td className="px-4 py-3"><Badge variant={v.is_active ? 'default' : 'secondary'}>{v.is_active ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(v)} className="text-primary hover:underline text-xs mr-3"><Pencil className="h-4 w-4 inline" /></button>
                    <button onClick={() => remove(v)} className="text-destructive hover:underline text-xs"><Trash2 className="h-4 w-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Voucher' : 'Buat Voucher Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Kode Voucher *</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="HEMAT10" maxLength={30} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Diskon spesial Lebaran" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipe Diskon *</Label>
                <select className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.discount_type}
                  onChange={e => setForm({ ...form, discount_type: e.target.value as any })}>
                  <option value="percent">Persen (%)</option>
                  <option value="fixed">Nominal (Rp)</option>
                </select>
              </div>
              <div>
                <Label>Nilai *</Label>
                <Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min. Pembelian (Rp)</Label>
                <Input type="number" value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Max Diskon (opsional)</Label>
                <Input type="number" value={form.max_discount} onChange={e => setForm({ ...form, max_discount: e.target.value })} placeholder="kosong = ∞" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kuota (opsional)</Label>
                <Input type="number" value={form.quota} onChange={e => setForm({ ...form, quota: e.target.value })} placeholder="kosong = ∞" />
              </div>
              <div>
                <Label>Berlaku hingga</Label>
                <Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVouchers;
