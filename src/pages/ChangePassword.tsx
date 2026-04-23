import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ChangePassword = () => {
  const { user, loading: authLoading, verifyCurrentPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Redirect jika belum login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6) return { label: 'Terlalu pendek', color: 'bg-red-500', width: 'w-1/4' };
    if (pwd.length < 8) return { label: 'Lemah', color: 'bg-orange-400', width: 'w-2/4' };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Sedang', color: 'bg-yellow-400', width: 'w-3/4' };
    return { label: 'Kuat', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: 'Password terlalu pendek', description: 'Minimal 6 karakter', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Password tidak cocok', description: 'Konfirmasi password baru tidak sesuai', variant: 'destructive' });
      return;
    }
    if (oldPassword === newPassword) {
      toast({ title: 'Password sama', description: 'Password baru harus berbeda dari password lama', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Langkah 1: verifikasi password lama
    const { error: verifyError } = await verifyCurrentPassword(user!.email!, oldPassword);
    if (verifyError) {
      setLoading(false);
      toast({ title: 'Password lama salah', description: 'Periksa kembali password lama Anda', variant: 'destructive' });
      return;
    }

    // Langkah 2: update ke password baru
    const { error: updateError } = await updatePassword(newPassword);
    setLoading(false);

    if (updateError) {
      toast({ title: 'Gagal mengubah password', description: updateError.message, variant: 'destructive' });
    } else {
      setDone(true);
      toast({ title: 'Password berhasil diubah!', description: 'Gunakan password baru untuk login berikutnya.' });
      setTimeout(() => navigate('/'), 2500);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center bg-background px-4 py-12 overflow-hidden">
      <div className="absolute top-10 right-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-20 h-64 w-64 rounded-full bg-rose-gold/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="mb-8 text-center opacity-0 animate-blur-in">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Ganti Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Perbarui keamanan akun Anda</p>
        </div>

        <div className="rounded-3xl glass-strong p-8 shadow-glow opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {done ? (
            /* ─── Success State ─── */
            <div className="flex flex-col items-center gap-5 text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">Password Berhasil Diubah!</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mengalihkan ke beranda...
                </p>
              </div>
            </div>
          ) : (
            /* ─── Form State ─── */
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Password Lama */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Password Saat Ini</label>
                <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                    required
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="text-muted-foreground transition-colors hover:text-foreground">
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-1.5 flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                    Lupa password saat ini?
                  </Link>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-xs text-muted-foreground">Password Baru</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              {/* Password Baru */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Password Baru</label>
                <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                    required
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="text-muted-foreground transition-colors hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {strength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">Kekuatan: <span className="font-medium text-foreground">{strength.label}</span></p>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Konfirmasi Password Baru</label>
                <div className={`flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 ${confirmPassword && newPassword !== confirmPassword ? 'ring-1 ring-red-400/50' : 'focus-within:ring-primary/30'}`}>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted-foreground transition-colors hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">Password tidak cocok</p>
                )}
                {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
                  <p className="mt-1.5 text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Password cocok
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 6 || !oldPassword}
                className="shimmer w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Memverifikasi...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}

          {/* Back */}
          {!done && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
