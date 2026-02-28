import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const { t } = useI18n();
  const { signIn, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    if (isAdmin) navigate('/admin');
    else navigate('/');
  }

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

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">{t.auth.login}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Selamat datang kembali di SR12 Store</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.email}</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" required />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.password}</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-90 disabled:opacity-50">
              {loading ? 'Memproses...' : t.auth.login}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">{t.auth.register}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
