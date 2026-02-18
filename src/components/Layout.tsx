import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navLinks = [
    { to: '/daily', label: 'Daily', icon: 'edit_note' },
    { to: '/flow', label: 'Flow', icon: 'timeline' },
    { to: '/habit-trace', label: 'Habits', icon: 'show_chart' },
    { to: '/archive', label: 'Archive', icon: 'inventory_2' },
    { to: '/scrapbook', label: 'Wins', icon: 'celebration' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-body text-ink bg-background-light">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-sm border-b border-wood-light/50 px-4 md:px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-primary text-2xl group-hover:rotate-12 transition-transform duration-300">auto_stories</span>
            <h1 className="text-lg md:text-xl font-bold tracking-tight font-header italic hidden sm:block">Soft Vellum</h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-ink-light hover:text-ink hover:bg-surface-light'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                <span className="font-body">{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="size-9 rounded-full bg-cover bg-center border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform overflow-hidden"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {user?.displayName?.[0] || '?'}
                  </div>
                )}
              </button>

              {showProfile && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                  <div className="absolute right-0 top-12 z-50 bg-paper rounded-lg shadow-lifted border border-wood-light/50 p-4 min-w-[200px]">
                    <p className="text-sm font-medium text-ink truncate">{user?.displayName}</p>
                    <p className="text-xs text-pencil truncate mb-3">{user?.email}</p>
                    <button
                      onClick={logout}
                      className="w-full text-left text-sm text-ink-light hover:text-ink py-1.5 px-2 rounded hover:bg-surface-light transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              className="lg:hidden text-ink hover:text-primary p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className="material-symbols-outlined text-2xl">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden mt-3 pb-2 flex flex-wrap gap-2 border-t border-wood-light/30 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-ink-light hover:text-ink hover:bg-surface-light'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col w-full relative">
        {children}
      </main>

    </div>
  );
};

export default Layout;
