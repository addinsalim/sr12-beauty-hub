import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const Register = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'reseller' ? 'reseller' : 'customer';
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'reseller'>(defaultRole);

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Decorative blurred shapes */}
      <div className="absolute top-20 left-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 h-60 w-60 rounded-full bg-rose-gold/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative">
        <div className="mb-8 text-center opacity-0 animate-blur-in">
          <h1 className="font-display text-3xl font-bold text-foreground">{t.auth.register}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Buat akun SR12 Store Anda
          </p>
        </div>

        <div className="rounded-3xl glass-strong p-8 shadow-glow opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Role Selector */}
          <div className="mb-6">
            <label className="mb-2.5 block text-sm font-medium text-foreground">{t.auth.registerAs}</label>
            <div className="grid grid-cols-2 gap-3">
              {(['customer', 'reseller'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${role === r
                      ? 'border-primary bg-primary/10 text-primary shadow-glow'
                      : 'glass text-muted-foreground hover:border-primary/50 hover:shadow-card'
                    }`}
                >
                  {r === 'customer' ? t.auth.customer : t.auth.reseller}
                </button>
              ))}
            </div>
            {role === 'reseller' && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl glass p-4 animate-scale-in">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-xs text-muted-foreground leading-relaxed">{t.auth.resellerNote}</p>
              </div>
            )}
          </div>

          <form className="space-y-5" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t.auth.name}</label>
              <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                <User className="h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Nama lengkap" className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t.auth.email}</label>
              <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input type="email" placeholder="email@contoh.com" className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t.auth.phone}</label>
              <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input type="tel" placeholder="08xx xxxx xxxx" className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t.auth.password}</label>
              <div className="flex items-center rounded-xl glass px-4 transition-all duration-300 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-primary/30">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 karakter"
                  className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground transition-colors hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="shimmer w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02]"
            >
              {t.auth.register}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary/80">
              {t.auth.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
