import { Shield, Award, Leaf, Heart } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.png';

const About = () => {
  const values = [
    { icon: Leaf, title: 'Bahan Alami', desc: 'Semua produk menggunakan bahan alami berkualitas tinggi yang aman untuk kulit.' },
    { icon: Shield, title: 'Bersertifikat BPOM', desc: 'Produk telah teruji dan terdaftar di BPOM untuk keamanan Anda.' },
    { icon: Award, title: 'Halal', desc: 'Seluruh produk telah bersertifikat halal dari MUI.' },
    { icon: Heart, title: 'Cruelty Free', desc: 'Tidak diuji pada hewan dan ramah lingkungan.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-hero py-20">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${heroBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-background/60" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Tentang SR12 Store</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            SR12 Herbal adalah brand kecantikan Indonesia yang menghadirkan produk skincare, kosmetik, dan parfum berkualitas tinggi dengan bahan alami.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-10 text-center font-display text-3xl font-bold text-foreground">Nilai Kami</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-6 text-center shadow-card opacity-0 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <v.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-card-foreground">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
