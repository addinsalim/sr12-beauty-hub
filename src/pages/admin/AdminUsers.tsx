import { useEffect, useState } from 'react';
import { Search, X, Users, Edit2, ShieldAlert, Award, Star, Loader2, ShieldCheck, Phone, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Dialog States
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<'admin' | 'customer' | 'courier'>('customer');
  const [pointsDelta, setPointsDelta] = useState<number>(0);
  const [pointsAction, setPointsAction] = useState<'add' | 'set'>('add');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles and roles separately
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];

      if (profiles.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = profiles.map(p => p.user_id);

      // 2. Fetch points & orders count in parallel
      const [pointsRes, ordersRes] = await Promise.all([
        supabase.from('user_points').select('user_id, balance').in('user_id', userIds),
        supabase.from('orders').select('user_id, id').in('user_id', userIds),
      ]);

      const pointsMap = new Map(pointsRes.data?.map(p => [p.user_id, p.balance]) || []);
      const ordersCountMap = new Map();
      ordersRes.data?.forEach(o => {
        ordersCountMap.set(o.user_id, (ordersCountMap.get(o.user_id) || 0) + 1);
      });

      const rolesMap = new Map(roles.map(r => [r.user_id, r]));

      // 3. Enrich users object
      const enriched = profiles.map(p => {
        const primaryRoleObj = rolesMap.get(p.user_id);
        return {
          ...p,
          role: primaryRoleObj?.role || 'customer',
          roleId: primaryRoleObj?.id,
          points: pointsMap.get(p.user_id) || 0,
          ordersCount: ordersCountMap.get(p.user_id) || 0,
        };
      });

      setUsers(enriched);
    } catch (err: any) {
      toast.error('Gagal memuat data pengguna: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      case 'admin':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'courier':
        return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    }
  };

  const handleOpenRoleDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role === 'owner' ? 'admin' : user.role);
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    if (selectedUser.role === 'owner') {
      toast.error('Role Owner tidak dapat diubah');
      return;
    }

    setActionLoading(true);
    try {
      if (selectedUser.roleId) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('id', selectedUser.roleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.user_id, role: newRole });
        if (error) throw error;
      }

      toast.success(`Role untuk ${selectedUser.full_name || 'pengguna'} berhasil diubah menjadi ${newRole}`);
      setRoleDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error('Gagal memperbarui role: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPointsDialog = (user: any) => {
    setSelectedUser(user);
    setPointsDelta(0);
    setPointsAction('add');
    setPointsDialogOpen(true);
  };

  const handleSavePoints = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const currentPoints = selectedUser.points;
      let newPoints = currentPoints;

      if (pointsAction === 'add') {
        newPoints = currentPoints + pointsDelta;
      } else {
        newPoints = pointsDelta;
      }

      if (newPoints < 0) {
        toast.error('Poin tidak boleh negatif');
        setActionLoading(false);
        return;
      }

      const { error } = await supabase
        .from('user_points')
        .upsert({
          user_id: selectedUser.user_id,
          balance: newPoints,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(`Poin ${selectedUser.full_name || 'pengguna'} diperbarui menjadi ${newPoints}`);
      setPointsDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error('Gagal memperbarui poin: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'owner').length;
  const courierCount = users.filter(u => u.role === 'courier').length;
  const customerCount = users.filter(u => u.role === 'customer').length;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Kelola Pengguna</h1>

      {/* Summary Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pengguna</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{totalUsers}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Admin & Owner</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{adminCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Kurir</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{courierCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
              <Phone className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Customer</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{customerCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-500/10 text-green-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="admin-users-search"
            placeholder="Cari nama, telepon, role..."
            className="pl-9 pr-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">Filter Role:</span>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-1.5 text-sm w-full sm:w-40"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">Semua Role</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="courier">Kurir</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground mb-3">
          Menampilkan {filtered.length} dari {users.length} pengguna
          {search && <span className="ml-1">untuk "<strong>{search}</strong>"</span>}
        </p>
      )}

      {/* Main Content List / Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-card/30 rounded-xl border border-border">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground text-sm font-medium">Memuat data pengguna...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-xl border border-border">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm font-medium">
            {search ? `Tidak ada hasil pencarian untuk "${search}"` : 'Belum ada pengguna terdaftar.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pengguna</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Telepon</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Loyalitas</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Transaksi</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const initials = (u.full_name || 'U').slice(0, 2).toUpperCase();
                  const isCurrentUser = user?.id === u.user_id;
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/10 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-gold/30 to-rose-gold/30 flex items-center justify-center font-bold text-xs text-foreground shrink-0 border border-primary/20">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : initials}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-1.5">
                              {u.full_name || '-'}
                              {isCurrentUser && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-normal">Anda</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Gabung: {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                          <span>{u.points} Poin</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">{u.ordersCount} Pesanan</td>
                      <td className="px-4 py-3 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRoleDialog(u)}
                            disabled={u.role === 'owner' || isCurrentUser}
                            title="Ubah Role"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPointsDialog(u)}
                            title="Kelola Poin"
                            className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filtered.map(u => {
              const initials = (u.full_name || 'U').slice(0, 2).toUpperCase();
              const isCurrentUser = user?.id === u.user_id;
              return (
                <div key={u.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm hover:shadow-md transition duration-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gold/30 to-rose-gold/30 flex items-center justify-center font-bold text-sm text-foreground shrink-0 border border-primary/20">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          {isCurrentUser && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-normal">Anda</span>}
                          {u.full_name || '-'}
                        </p>
                        <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRoleDialog(u)}
                        disabled={u.role === 'owner' || isCurrentUser}
                        className="h-7 px-2 text-[11px]"
                      >
                        Role
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPointsDialog(u)}
                        className="h-7 px-2 text-[11px] text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
                      >
                        Poin
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-medium">Telepon</span>
                      <span className="text-foreground">{u.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-medium">Bergabung</span>
                      <span className="text-foreground">
                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-medium">Loyalitas</span>
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                        <span>{u.points} Poin</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-medium">Transaksi</span>
                      <span className="text-foreground font-medium">{u.ordersCount} Pesanan</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Role Pengguna</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gold/30 to-rose-gold/30 flex items-center justify-center font-bold text-sm text-foreground shrink-0">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (selectedUser.full_name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.full_name || '-'}</p>
                  <p className="text-xs text-muted-foreground">Role Saat Ini: <span className="font-semibold text-primary">{selectedUser.role}</span></p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-select">Pilih Role Baru *</Label>
                <select
                  id="role-select"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                >
                  <option value="customer">Customer (Pelanggan biasa)</option>
                  <option value="courier">Courier (Kurir Pengantaran)</option>
                  <option value="admin">Admin (Pengelola Toko)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-600 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Mengubah role akan memberi atau membatasi hak akses pengguna ini pada sistem. Pastikan Anda mempercayai pengguna ini sebelum memberikan role Admin.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveRole} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Points Management Dialog */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kelola Poin Loyalitas</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gold/30 to-rose-gold/30 flex items-center justify-center font-bold text-sm text-foreground shrink-0">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (selectedUser.full_name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedUser.full_name || '-'}</p>
                    <p className="text-xs text-muted-foreground">Gabung: {new Date(selectedUser.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block font-medium uppercase">Poin Saat Ini</span>
                  <span className="font-bold text-foreground flex items-center gap-1 justify-end text-sm">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                    {selectedUser.points}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tindakan *</Label>
                  <select
                    className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={pointsAction}
                    onChange={e => setPointsAction(e.target.value as any)}
                  >
                    <option value="add">Tambah / Kurangi</option>
                    <option value="set">Atur Langsung</option>
                  </select>
                </div>
                <div>
                  <Label>{pointsAction === 'add' ? 'Jumlah (+ / -)' : 'Nilai Baru'}</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={pointsDelta}
                    onChange={e => setPointsDelta(Number(e.target.value))}
                    placeholder={pointsAction === 'add' ? 'Contoh: 50 atau -20' : 'Contoh: 100'}
                  />
                </div>
              </div>

              {pointsAction === 'add' && (
                <p className="text-[10px] text-muted-foreground italic">
                  * Gunakan nilai negatif untuk mengurangi poin (misal: -10).
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPointsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSavePoints} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Perbarui Poin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
