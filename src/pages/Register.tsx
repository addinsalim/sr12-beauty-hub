import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const { t } = useI18n();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'reseller' ? 'reseller' : 'customer';
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'reseller'>(defaultRole);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: 'Password minimal 8 karakter', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name, phone);
    setLoading(false);
    if (error) {
      toast({ title: 'Registrasi gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registrasi berhasil!', description: 'Silakan cek email untuk verifikasi.' });
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">{t.auth.register}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Buat akun SR12 Store Anda</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-foreground">{t.auth.registerAs}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['customer', 'reseller'] as const).map(r => (
                <button key={r} onClick={() => setRole(r)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${role === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {r === 'customer' ? t.auth.customer : t.auth.reseller}
                </button>
              ))}
            </div>
            {role === 'reseller' && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-accent/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-xs text-muted-foreground">{t.auth.resellerNote}</p>
              </div>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.name}</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap" className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" required />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.email}</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" required />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.phone}</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xx xxxx xxxx" className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t.auth.password}</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 karakter" className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-90 disabled:opacity-50">
              {loading ? 'Memproses...' : t.auth.register}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">{t.auth.login}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
