import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Layout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { settings } = useApp();

  const links = [
    { to: '/daily', label: 'Daily Leaf', icon: 'edit_note' },
    { to: '/archive', label: 'The Vault', icon: 'inventory_2' },
    { to: '/flow', label: 'Flow', icon: 'timeline' },
    { to: '/habit-trace', label: 'Habits', icon: 'show_chart' },
    { to: '/scrapbook', label: 'Scrapbook', icon: 'celebration' },
    { to: '/thought-cloud', label: 'Thoughts', icon: 'cloud' },
    { to: '/migration', label: 'Migration', icon: 'move_up' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-body text-ink transition-colors duration-300 ${settings.paperTexture > 50 ? 'bg-vellum-texture' : 'bg-background-light'} ${settings.inkColor === 'navy' ? 'text-ink-navy' : settings.inkColor === 'sepia' ? 'text-ink-sepia' : 'text-ink-charcoal'}`}>
      <header className="sticky top-0 z-50 bg-vellum/90 backdrop-blur-sm border-b border-wood-light/50 px-6 py-3 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="size-8 text-primary flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <span className="material-symbols-outlined text-3xl">auto_stories</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight font-header italic">Soft Vellum Journal</h1>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors font-handwriting text-lg flex items-center gap-1 hover:text-primary ${pathname === link.to ? 'text-primary border-b-2 border-primary' : 'text-ink-light'}`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-10 rounded-full bg-surface-light border border-wood-light shadow-sm cursor-pointer hover:shadow-md transition-shadow hover:text-primary">
              <span className="material-symbols-outlined">notifications</span>
            </div>
            <div className="size-10 rounded-full bg-cover bg-center border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDYNeuEnEgusx9SfrC0-_1R-xiV2ykJTbP0KfldlNCP7i2pHU-lRflis1M2k1yX_nC2wTuIMe20QNrzTqPGdvjyAvLOHVByVq4n5XFivH_SjtblRMFIfzS5Sb8Bl_uL35365EAID--nznnZ0W51rHD63PtVQAu6Xa9deJIFsiv5YPuIG_xvqhWOl9m-U3GPg3O_ywA1-RqAoWfvA0vG3Cu2nDcWGDUIlHt0FWMSvOnHQbhrdhRmC9VYtIVDH8L2SHtKLX-HfysZyf8')" }}></div>

            {/* Mobile Menu Button (Simplified for now) */}
            <button className="lg:hidden text-ink hover:text-primary">
               <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;
