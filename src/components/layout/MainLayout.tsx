import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Global Background Decorations */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] h-[40%] w-[40%] rounded-full bg-gold/5 blur-[120px] animate-float" />
        <div className="absolute top-[20%] -left-[10%] h-[35%] w-[35%] rounded-full bg-rose-gold/5 blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[10%] right-[15%] h-[45%] w-[45%] rounded-full bg-primary/5 blur-[130px] animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
