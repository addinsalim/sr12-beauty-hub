import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  User as UserIcon, Camera, KeyRound, Loader2, Check, Shield, Mail, Phone, Info
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
});

const MAX_AVATAR = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const AdminProfile = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  // Hydrate form fields
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Profile Save Handler
  const handleSaveProfile = async () => {
    const parsed = profileSchema.safeParse({ full_name: fullName, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null
      })
      .eq('user_id', user.id);

    setSavingProfile(false);
    if (error) {
      toast.error('Gagal menyimpan: ' + error.message);
      return;
    }

    toast.success('Profil admin berhasil diperbarui');
    await refreshProfile();
  };

  // Avatar Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format foto harus JPEG/PNG/WebP/GIF');
      return;
    }
    if (file.size > MAX_AVATAR) {
      toast.error('Maksimal ukuran file 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Sesi telah berakhir, silakan login kembali');
        setUploadingAvatar(false);
        return;
      }

      const extRaw = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const ext = extRaw === 'jpeg' ? 'jpg' : extRaw;
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (upErr) {
        console.error('Avatar upload error:', upErr);
        toast.error('Gagal mengunggah foto: ' + upErr.message);
        setUploadingAvatar(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const finalUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('user_id', user.id);

      if (updErr) {
        console.error('Profile update error:', updErr);
        toast.error('Gagal memperbarui database profil: ' + updErr.message);
        setUploadingAvatar(false);
        return;
      }

      toast.success('Foto profil berhasil diperbarui');
      await refreshProfile();
    } catch (err: any) {
      console.error('Unexpected avatar upload error:', err);
      toast.error('Terjadi kesalahan: ' + (err?.message || 'tidak diketahui'));
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const initials = (profile?.full_name || user.email || 'A').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Profil Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Ubah identitas akun dan foto profil admin Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Stats */}
        <Card className="md:col-span-1 border border-border bg-card">
          <CardContent className="pt-6 text-center">
            <div className="relative group inline-block mx-auto">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-secondary border-4 border-primary/20 flex items-center justify-center shadow-md relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Admin Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-4xl text-primary font-bold">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground p-2.5 shadow-lg hover:scale-110 transition disabled:opacity-50 border-2 border-background"
                title="Unggah foto baru"
              >
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <h3 className="font-semibold text-lg text-foreground mt-4 truncate">
              {profile?.full_name || 'Administrator'}
            </h3>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Akun Utama Admin</span>
            </div>

            <div className="border-t border-border mt-6 pt-6 text-left space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground truncate">{user.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-secondary/20 border-t border-border px-6 py-4 flex flex-col items-stretch">
            <Link to="/change-password">
              <Button variant="outline" className="w-full text-xs">
                <KeyRound className="h-3.5 w-3.5 mr-2" /> Ganti Password
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Right Column: Update Name & Info Form */}
        <Card className="md:col-span-2 border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Profil</CardTitle>
            <CardDescription>Perbarui nama tampilan dan nomor kontak administrasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email Terdaftar</Label>
              <Input id="admin-email" value={user.email || ''} disabled className="bg-secondary/40 cursor-not-allowed" />
              <p className="text-[11px] text-muted-foreground">Email tidak dapat diubah secara langsung demi keamanan akun.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Nama Lengkap Admin *</Label>
              <Input
                id="admin-name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Contoh: Admin Utama SR12"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-phone">Nomor Telepon Kontak</Label>
              <Input
                id="admin-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                maxLength={20}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border px-6 py-4 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;
