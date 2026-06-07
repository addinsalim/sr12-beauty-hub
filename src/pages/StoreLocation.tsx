import { MapPin, Clock, Phone, Instagram, Navigation, ExternalLink, Car, Bus } from 'lucide-react';

const STORE = {
  name: 'SR12 Beauty Hub – Toko Offline',
  address: 'Pesantren Mafatih, Legokhuni, Kec. Wanayasa',
  city: 'Kabupaten Purwakarta, Jawa Barat 41174',
  phone: '+62 811-xxx-xxxx',
  instagram: '@sr12beautyhub',
  hours: [
    { day: 'Senin – Jumat', time: '08.00 – 17.00 WIB' },
    { day: 'Sabtu', time: '08.00 – 15.00 WIB' },
    { day: 'Minggu & Hari Libur', time: 'Tutup' },
  ],
  // Google Maps embed untuk "Pesantren Mafatih, Wanayasa, Purwakarta"
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.0!2d107.4500!3d-6.8900!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e697b0000000001%3A0x0!2sPesantren+Mafatih%2C+Legokhuni%2C+Wanayasa%2C+Purwakarta!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid',
  googleMapsUrl:
    'https://maps.google.com/?q=Pesantren+Mafatih+Legokhuni+Wanayasa+Purwakarta+Jawa+Barat',
  wazeUrl:
    'https://waze.com/ul?q=Pesantren+Mafatih+Legokhuni+Wanayasa+Purwakarta',
};

const StoreLocation = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-modern" />
        {/* Decorative blobs */}
        <div className="absolute top-8 right-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl animate-float" />
        <div
          className="absolute bottom-8 left-8 h-48 w-48 rounded-full bg-rose-gold/10 blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 shadow-glow backdrop-blur-sm ring-1 ring-primary/30">
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
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-5">

          {/* ── Peta — span 3 ── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border/40 shadow-card bg-card">
              {/* Map iframe */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  title="Lokasi SR12 Beauty Hub"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.8!2d107.4516!3d-6.8875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e697d1b7b5dd5cb%3A0x8b0c3e3e3e3e3e3e!2sWanayasa%2C+Purwakarta+Regency%2C+West+Java!5e0!3m2!1sid!2sid!4v1717747698000!5m2!1sid!2sid"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Tombol navigasi */}
              <div className="flex flex-wrap gap-3 p-4 border-t border-border/30 bg-card/50">
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
                  Navigasi Waze
                </a>
              </div>
            </div>
          </div>

          {/* ── Info Toko — span 2 ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Alamat */}
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-card hover:shadow-glow-lg transition-shadow duration-300">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-glow">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground mb-1">Alamat Toko</h2>
                  <p className="text-sm text-foreground font-medium leading-relaxed">
                    {STORE.name}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    {STORE.address},<br />
                    {STORE.city}
                  </p>
                </div>
              </div>
            </div>

            {/* Jam Operasional */}
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-card hover:shadow-glow-lg transition-shadow duration-300">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-glow">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-base font-bold text-foreground mb-3">Jam Operasional</h2>
                  <ul className="space-y-2">
                    {STORE.hours.map((h) => (
                      <li key={h.day} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{h.day}</span>
                        <span
                          className={`font-semibold ${
                            h.time === 'Tutup' ? 'text-destructive' : 'text-primary'
                          }`}
                        >
                          {h.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-card hover:shadow-glow-lg transition-shadow duration-300">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-glow">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground mb-3">Hubungi Kami</h2>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a
                        id="link-whatsapp-store"
                        href={`https://wa.me/${STORE.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        📱 <span className="font-medium">{STORE.phone}</span>
                        <span className="text-xs text-primary">(WhatsApp)</span>
                      </a>
                    </li>
                    <li>
                      <a
                        id="link-instagram-store"
                        href="https://instagram.com/sr12beautyhub"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                        <span className="font-medium">{STORE.instagram}</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cara ke Sini */}
            <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-card hover:shadow-glow-lg transition-shadow duration-300">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-glow">
                  <Bus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground mb-3">Cara ke Sini</h2>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold shrink-0">🚗</span>
                      <span>Dari pusat kota Purwakarta ±40 menit via Jl. Wanayasa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold shrink-0">🚌</span>
                      <span>Naik angkot jurusan Wanayasa, turun di Pesantren Mafatih</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold shrink-0">📍</span>
                      <span>Patokan: Pesantren Mafatih, Legokhuni, Wanayasa</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Banner CTA ── */}
        <div className="mt-10 rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-modern opacity-90" />
          <div className="relative px-8 py-10 text-center">
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Tidak bisa datang langsung? 🛍️
            </h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Belanja online tetap mudah dan aman! Produk SR12 dikirim ke seluruh Indonesia dengan
              ekspedisi terpercaya.
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
                href={`https://wa.me/62811xxxxxxx?text=Halo+SR12+Beauty+Hub%2C+saya+mau+pesan+produk`}
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
