import { useState } from 'react';
import { MapPin, Clock, Phone, Instagram, Navigation, ExternalLink, Car, Bus, Copy, Check } from 'lucide-react';

const STORE = {
  name: 'SR12 Beauty Hub',
  subname: 'Toko Offline – Purwakarta',
  address: 'Pesantren Mafatih, Legokhuni, Kec. Wanayasa',
  city: 'Kabupaten Purwakarta, Jawa Barat 41174',
  fullAddress: 'Pesantren Mafatih, Legokhuni, Kec. Wanayasa, Kabupaten Purwakarta, Jawa Barat 41174',
  phone: '+62 811-xxx-xxxx',
  instagram: '@sr12beautyhub',
  hours: [
    { day: 'Senin – Jumat', time: '08.00 – 17.00 WIB', open: true },
    { day: 'Sabtu', time: '08.00 – 15.00 WIB', open: true },
    { day: 'Minggu & Hari Libur', time: 'Tutup', open: false },
  ],
  googleMapsUrl:
    'https://www.google.com/maps/search/Pesantren+Mafatih+Legokhuni+Wanayasa+Purwakarta+Jawa+Barat',
  googleMapsEmbed:
    'https://maps.google.com/maps?q=Pesantren+Mafatih,+Legokhuni,+Wanayasa,+Purwakarta,+Jawa+Barat+41174&output=embed&z=15&hl=id',
  wazeUrl:
    'https://waze.com/ul?q=Pesantren+Mafatih+Legokhuni+Wanayasa+Purwakarta',
};

// Cek apakah hari ini toko buka
const getTodayStatus = () => {
  const day = new Date().getDay(); // 0=Minggu, 6=Sabtu
  if (day === 0) return { open: false, label: 'Tutup Hari Ini' };
  if (day === 6) return { open: true, label: 'Buka s/d 15.00 WIB' };
  return { open: true, label: 'Buka s/d 17.00 WIB' };
};

const StoreLocation = () => {
  const [copied, setCopied] = useState(false);
  const todayStatus = getTodayStatus();

  const copyAddress = () => {
    navigator.clipboard.writeText(STORE.fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-modern" />
        <div className="absolute top-8 right-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl animate-float" />
        <div
          className="absolute bottom-8 left-8 h-48 w-48 rounded-full bg-rose-gold/10 blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 shadow-glow backdrop-blur-sm ring-1 ring-primary/30">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl opacity-0 animate-blur-in">
            Lokasi Toko Kami
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-muted-foreground leading-relaxed opacity-0 animate-blur-in"
            style={{ animationDelay: '0.15s' }}
          >
            Kunjungi toko offline SR12 Beauty Hub dan rasakan pengalaman berbelanja skincare langsung!
          </p>

          {/* Status buka/tutup badge */}
          <div
            className="inline-flex items-center gap-2 mt-5 rounded-full px-4 py-2 text-sm font-semibold opacity-0 animate-blur-in"
            style={{
              animationDelay: '0.25s',
              background: todayStatus.open ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: todayStatus.open ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
              color: todayStatus.open ? '#16a34a' : '#dc2626',
            }}
          >
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: todayStatus.open ? '#16a34a' : '#dc2626' }}
            />
            {todayStatus.open ? '🟢' : '🔴'} {todayStatus.label}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-5">

          {/* ── Peta — span 3 ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Map card */}
            <div className="overflow-hidden rounded-2xl border border-border/40 shadow-card bg-card group">

              {/* Map header bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-card/80 backdrop-blur-sm">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    Pesantren Mafatih, Wanayasa, Purwakarta
                  </span>
                </div>
              </div>

              {/* Google Maps iframe */}
              <div className="relative w-full" style={{ height: '380px' }}>
                <iframe
                  id="map-sr12-store"
                  title="Lokasi SR12 Beauty Hub – Pesantren Mafatih, Wanayasa, Purwakarta"
                  src={STORE.googleMapsEmbed}
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                {/* Overlay pin label */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <div className="flex items-center gap-2 rounded-xl bg-card/90 backdrop-blur-md border border-border/40 px-3 py-2 shadow-card">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-glow">
                      <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight">SR12 Beauty Hub</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">Wanayasa, Purwakarta</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol navigasi */}
              <div className="flex flex-wrap items-center gap-3 p-4 border-t border-border/30 bg-card/50">
                <a
                  id="btn-open-googlemaps"
                  href={STORE.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 hover:scale-105 transition-all duration-200"
                >
                  <Navigation className="h-4 w-4" />
                  Buka Google Maps
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
                <a
                  id="btn-open-waze"
                  href={STORE.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15 hover:scale-105 transition-all duration-200"
                >
                  <Car className="h-4 w-4" />
                  Buka Waze
                </a>
              </div>
            </div>

            {/* Cara ke Sini */}
            <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Bus className="h-4.5 w-4.5 text-primary" />
                </div>
                <h2 className="font-display text-sm font-bold text-foreground">Cara ke Sini</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: '🚗', label: 'Mobil / Motor', desc: 'Dari Purwakarta kota ±40 menit via Jl. Wanayasa' },
                  { icon: '🚌', label: 'Angkot', desc: 'Jurusan Wanayasa, turun di Pesantren Mafatih' },
                  { icon: '📍', label: 'Patokan', desc: 'Depan Pesantren Mafatih, Legokhuni, Wanayasa' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/30 bg-secondary/30 p-3 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-xs font-semibold text-foreground mt-1.5 mb-1">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Info Toko — span 2 ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Store ID Card */}
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-card">
              {/* Card header gradient */}
              <div className="relative px-5 py-5 bg-gradient-modern overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-glow ring-1 ring-white/20">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground leading-tight">
                      {STORE.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{STORE.subname}</p>
                    <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Toko Resmi SR12
                    </span>
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div className="px-5 py-4 border-b border-border/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Alamat</p>
                <p className="text-sm text-foreground leading-relaxed">{STORE.fullAddress}</p>
                <button
                  id="btn-copy-address"
                  onClick={copyAddress}
                  className="mt-2.5 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5" /> Tersalin!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Salin Alamat</>
                  )}
                </button>
              </div>

              {/* Jam Operasional */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jam Operasional</p>
                </div>
                <ul className="space-y-2.5">
                  {STORE.hours.map((h) => (
                    <li key={h.day} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs">{h.day}</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          h.open
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {h.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Kontak */}
            <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hubungi Kami</h2>
              </div>
              <div className="space-y-3">
                <a
                  id="link-whatsapp-store"
                  href="https://wa.me/6281100000000?text=Halo+SR12+Beauty+Hub%2C+saya+mau+bertanya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/30 px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                >
                  <span className="text-lg">📱</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {STORE.phone}
                    </p>
                    <p className="text-[11px] text-muted-foreground">WhatsApp – Respons cepat!</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                <a
                  id="link-instagram-store"
                  href="https://instagram.com/sr12beautyhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/30 px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                >
                  <Instagram className="h-5 w-5 text-rose-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {STORE.instagram}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Produk & promo terbaru</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Banner CTA ── */}
        <div className="mt-10 rounded-2xl overflow-hidden relative border border-border/30">
          <div className="absolute inset-0 bg-gradient-modern opacity-80" />
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-rose-gold/10 blur-2xl" />
          <div className="relative px-8 py-10 text-center">
            <p className="text-3xl mb-2">🛍️</p>
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Tidak bisa datang langsung?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
              Belanja online tetap mudah dan aman! Produk SR12 dikirim ke seluruh Indonesia
              dengan ekspedisi terpercaya dalam 1–5 hari kerja.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                id="btn-belanja-online"
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90 hover:scale-105 transition-all duration-200"
              >
                Belanja Online Sekarang
              </a>
              <a
                id="btn-whatsapp-order"
                href="https://wa.me/6281100000000?text=Halo+SR12+Beauty+Hub%2C+saya+mau+pesan+produk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-8 py-3 text-sm font-bold text-primary hover:bg-primary/15 hover:scale-105 transition-all duration-200"
              >
                Order via WhatsApp 📱
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLocation;
