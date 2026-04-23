import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast({
        title: 'Gagal mengirim email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Decorative blurred shapes */}
      <div className="absolute top-10 right-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-20 h-64 w-64 rounded-full bg-rose-gold/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="mb-8 text-center opacity-0 animate-blur-in">
          <h1 className="font-display text-3xl font-bold text-foreground">Lupa Kata Sandi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent ? 'Cek inbox email Anda' : 'Masukkan email untuk menerima link reset'}
          </p>
        </div>

        <div className="rounded-3xl glass-strong p-8 shadow-glow opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {sent ? (
            /* ─── Success State ─── */
            <div className="flex flex-col items-center gap-5 text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">Email Terkirim!</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Link reset kata sandi telah dikirim ke <span className="font-medium text-foreground">{email}</span>.
                  Silakan cek inbox (dan folder spam) Anda.
                </p>
              </div>
              <div className="mt-2 rounded-xl glass p-4 w-full text-left space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Langkah selanjutnya:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-none">
                  <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">1.</span> Buka email dari SR12 Store</li>
                  <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">2.</span> Klik tombol "Reset Password"</li>
                  <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">3.</span> Buat kata sandi baru Anda</li>
                </ol>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Kirim ulang ke email lain
              </button>
            </div>
          ) : (
            /* ─── Form State ─── */
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Alamat Email</label>
                <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                    required
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Masukkan email yang terdaftar di akun SR12 Anda
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="shimmer w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
          )}

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke halaman masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
