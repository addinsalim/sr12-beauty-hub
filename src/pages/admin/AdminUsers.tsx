import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false })
      .then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Kelola Pengguna</h1>
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
            {users.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{u.full_name || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.phone || '-'}</td>
                <td className="px-4 py-3">
                  {u.user_roles?.map((r: any) => (
                    <span key={r.role} className="mr-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r.role}</span>
                  ))}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-8 text-center text-muted-foreground">Belum ada pengguna.</p>}
      </div>
    </div>
  );
};
export default AdminUsers;
