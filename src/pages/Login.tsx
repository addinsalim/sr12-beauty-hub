import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const { t } = useI18n();
  const { signIn, user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) navigate('/admin', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Login gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Login berhasil!' });
    }
  };

  if (authLoading) return null;
  if (user) return null;

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Decorative blurred shapes */}
      <div className="absolute top-10 right-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-20 h-64 w-64 rounded-full bg-rose-gold/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative">
        <div className="mb-8 text-center opacity-0 animate-blur-in">
          <h1 className="font-display text-3xl font-bold text-foreground">{t.auth.login}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Selamat datang kembali di SR12 Store</p>
        </div>

        <div className="rounded-3xl glass-strong p-8 shadow-glow opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t.auth.email}</label>
              <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t.auth.password}</label>
              <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground transition-colors hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border accent-primary" />
                Ingat saya
              </label>
              <a href="#" className="text-sm text-primary transition-colors hover:text-primary/80">{t.auth.forgotPassword}</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="shimmer w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Memproses...' : t.auth.login}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-xs text-muted-foreground">{t.auth.loginWith}</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-xl glass py-3 text-sm font-medium text-foreground transition-all duration-300 hover:shadow-card hover:scale-[1.02]">
              Google
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl glass py-3 text-sm font-medium text-foreground transition-all duration-300 hover:shadow-card hover:scale-[1.02]">
              WhatsApp
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{' '}
            <Link to="/register" className="font-medium text-primary transition-colors hover:text-primary/80">
              {t.auth.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
