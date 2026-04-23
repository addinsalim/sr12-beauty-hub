import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [checking, setChecking] = useState(true);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Deteksi event PASSWORD_RECOVERY dari Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
      }
      setChecking(false);
    });

    // Timeout fallback — jika tidak ada event dalam 3 detik
    const timer = setTimeout(() => setChecking(false), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6) return { label: 'Terlalu pendek', color: 'bg-red-500', width: 'w-1/4' };
    if (pwd.length < 8) return { label: 'Lemah', color: 'bg-orange-400', width: 'w-2/4' };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Sedang', color: 'bg-yellow-400', width: 'w-3/4' };
    return { label: 'Kuat', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Password terlalu pendek', description: 'Minimal 6 karakter', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Password tidak cocok', description: 'Pastikan konfirmasi password sama', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: 'Gagal mengubah password', description: error.message, variant: 'destructive' });
    } else {
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memverifikasi link reset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center bg-background px-4 py-12 overflow-hidden">
      <div className="absolute top-10 right-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-20 h-64 w-64 rounded-full bg-rose-gold/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative">
        <div className="mb-8 text-center opacity-0 animate-blur-in">
          <h1 className="font-display text-3xl font-bold text-foreground">Buat Password Baru</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pilih password yang kuat dan mudah diingat</p>
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
                  Anda akan diarahkan ke halaman login dalam beberapa detik...
                </p>
              </div>
            </div>
          ) : !isRecoverySession ? (
            /* ─── Invalid/Expired Link State ─── */
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <ShieldCheck className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">Link Tidak Valid</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Link reset password ini sudah kedaluwarsa atau tidak valid. Silakan minta link baru.
                </p>
              </div>
              <button
                onClick={() => navigate('/forgot-password')}
                className="mt-2 shimmer rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:scale-[1.02]"
              >
                Minta Link Baru
              </button>
            </div>
          ) : (
            /* ─── Form State ─── */
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Password Baru */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Password Baru</label>
                <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                    required
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground transition-colors hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {strength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">Kekuatan: <span className="font-medium text-foreground">{strength.label}</span></p>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Konfirmasi Password</label>
                <div className={`flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 ${confirm && password !== confirm ? 'ring-1 ring-red-400/50' : 'focus-within:ring-primary/30'}`}>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted-foreground transition-colors hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="mt-1.5 text-xs text-red-400">Password tidak cocok</p>
                )}
                {confirm && password === confirm && confirm.length >= 6 && (
                  <p className="mt-1.5 text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Password cocok
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirm || password.length < 6}
                className="shimmer w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
