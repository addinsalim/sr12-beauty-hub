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
      {/* Hero — animated gradient */}
      <div className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-modern" />
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${heroBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />

        {/* Decorative shapes */}
        <div className="absolute top-10 right-20 h-60 w-60 rounded-full bg-gold/10 blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 h-48 w-48 rounded-full bg-rose-gold/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="container relative mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl lg:text-6xl opacity-0 animate-blur-in">
            Tentang SR12 Store
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground leading-relaxed opacity-0 animate-blur-in" style={{ animationDelay: '0.15s' }}>
            SR12 Herbal adalah brand kecantikan Indonesia yang menghadirkan produk skincare, kosmetik, dan parfum berkualitas tinggi dengan bahan alami.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="mb-14 text-center font-display text-3xl font-bold text-foreground accent-line-center">Nilai Kami</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <div
              key={v.title}
              className="group glow-ring rounded-2xl glass p-8 text-center shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-glow-lg opacity-0 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-glow group-hover:scale-110">
                <v.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 font-display text-lg font-semibold text-card-foreground">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
