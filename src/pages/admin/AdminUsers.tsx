import { useEffect, useState } from 'react';
import { Search, X, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.user_roles || []).some((r: any) => r.role.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Kelola Pengguna</h1>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
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

      {!loading && (
        <p className="text-xs text-muted-foreground mb-3">
          Menampilkan {filtered.length} dari {users.length} pengguna
          {search && <span className="ml-1">untuk "<strong>{search}</strong>"</span>}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telepon</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tanggal Daftar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-muted-foreground">Memuat...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">
                    {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada pengguna.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition">
                  <td className="px-4 py-3 font-medium text-foreground">{u.full_name || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {u.user_roles?.length > 0
                      ? u.user_roles.map((r: any) => (
                        <span key={r.role} className="mr-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {r.role}
                        </span>
                      ))
                      : <span className="text-xs text-muted-foreground">customer</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
