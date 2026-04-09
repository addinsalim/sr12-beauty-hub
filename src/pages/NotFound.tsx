import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-1/4 right-1/4 h-80 w-80 rounded-full bg-gold/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-rose-gold/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative text-center opacity-0 animate-blur-in">
        <h1 className="mb-4 font-display text-8xl font-bold text-gradient-gold md:text-9xl">
          404
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Halaman tidak ditemukan
        </p>
        <Link
          to="/"
          className="shimmer inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
