import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const Login = () => {
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">{t.auth.login}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selamat datang kembali di SR12 Store
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.email}</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.password}</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="rounded border-border" />
                Ingat saya
              </label>
              <a href="#" className="text-sm text-primary hover:underline">{t.auth.forgotPassword}</a>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-90"
            >
              {t.auth.login}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t.auth.loginWith}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary">
              Google
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary">
              WhatsApp
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t.auth.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
