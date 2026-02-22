import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getColorOfTheDay, DEFAULT_PRIMARY, applyAccentColor, getColorName } from '../lib/colorOfTheDay';
import { todayStr } from '../lib/dateUtils';

const Layout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [colorInfoOpen, setColorInfoOpen] = useState(false);

  // ── Dark mode ──────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('vellum-theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('vellum-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ── Color of the Day ──────────────────────────────────────
  const today = todayStr();
  const dailyColor = useMemo(() => getColorOfTheDay(today), [today]);
  const [useDefaultColor, setUseDefaultColor] = useState(() =>
    localStorage.getItem('vellum-color-reverted') === today
  );

  useEffect(() => {
    const color = useDefaultColor ? DEFAULT_PRIMARY : dailyColor;
    applyAccentColor(color, darkMode);
  }, [dailyColor, darkMode, useDefaultColor]);

  // First-visit-of-the-day reveal
  const [showColorReveal, setShowColorReveal] = useState(() => {
    const lastSeen = localStorage.getItem('vellum-color-seen');
    return lastSeen !== today && !useDefaultColor;
  });

  useEffect(() => {
    if (showColorReveal) {
      localStorage.setItem('vellum-color-seen', today);
      const timer = setTimeout(() => setShowColorReveal(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [showColorReveal, today]);

  const colorName = useMemo(() => getColorName(dailyColor), [dailyColor]);

  const revertColor = () => {
    setUseDefaultColor(true);
    localStorage.setItem('vellum-color-reverted', today);
  };
  const restoreDailyColor = () => {
    setUseDefaultColor(false);
    localStorage.removeItem('vellum-color-reverted');
  };

  // Listen for focus-mode class on documentElement (set by DailyLeaf)
  const [focusMode, setFocusMode] = useState(false);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setFocusMode(document.documentElement.classList.contains('focus-mode'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { to: '/daily', label: 'Daily', icon: 'edit_note' },
    { to: '/flow', label: 'Flow', icon: 'timeline' },
    { to: '/habit-trace', label: 'Habits', icon: 'show_chart' },
    { to: '/archive', label: 'Archive', icon: 'inventory_2' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-body text-ink bg-background-light">
      {/* ── Color of the Day reveal — full-screen flash on first visit ── */}
      {showColorReveal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ animation: 'colorReveal 2.2s ease-out forwards' }}
        >
          <div
            className="absolute inset-0"
            style={{ background: `var(--color-gradient)`, opacity: 0.85 }}
          />
          <div className="relative z-10 text-center" style={{ animation: 'colorRevealText 2.2s ease-out forwards' }}>
            <div
              className="size-16 rounded-full mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: dailyColor.css }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/80 mb-1">today&rsquo;s color</p>
            <p className="font-header italic text-3xl text-white">{colorName}</p>
          </div>
        </div>
      )}

      {/* ── Bold color stripe at very top ── */}
      <div
        className={`h-1 w-full flex-none transition-all duration-300 ${focusMode ? 'h-0' : ''}`}
        style={{ background: useDefaultColor ? 'transparent' : `var(--color-gradient)` }}
      />

      <header className={`sticky top-0 z-40 bg-paper/90 backdrop-blur-sm border-b border-wood-light/50 px-4 md:px-6 py-3 shadow-sm transition-all duration-300 ${focusMode ? 'h-0 overflow-hidden border-none py-0 opacity-0' : ''}`}>
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
            {/* Color of the Day — prominent pill */}
            <button
              onClick={() => setColorInfoOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:scale-105"
              style={{
                backgroundColor: useDefaultColor ? 'transparent' : `var(--color-tint-medium)`,
                border: useDefaultColor ? '1px solid var(--color-border)' : `1.5px solid var(--color-primary)`,
              }}
            >
              <span
                className="inline-block size-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: dailyColor.css }}
              />
              <span className="font-mono text-[10px] uppercase tracking-wider"
                style={{ color: useDefaultColor ? 'var(--color-pencil)' : 'var(--color-primary)' }}
              >
                {colorName}
              </span>
            </button>
            {/* Color popover */}
            {colorInfoOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColorInfoOpen(false)} />
                <div className="absolute right-16 top-14 w-72 p-5 bg-paper rounded-xl shadow-lifted border border-wood-light/30 z-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="size-10 rounded-xl shadow-md"
                      style={{ background: `var(--color-gradient)` }}
                    />
                    <div>
                      <p className="font-header italic text-lg text-ink">{colorName}</p>
                      <p className="font-mono text-[9px] text-pencil uppercase tracking-widest">today&rsquo;s accent</p>
                    </div>
                  </div>
                  <p className="font-body text-sm text-ink/70 leading-relaxed mb-3">
                    Every day the whole app shifts to a new color — buttons, highlights, progress bars, everything. A fresh coat of paint to keep things interesting.
                  </p>
                  <button
                    onClick={() => { useDefaultColor ? restoreDailyColor() : revertColor(); setColorInfoOpen(false); }}
                    className="w-full text-center py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: useDefaultColor ? 'var(--color-tint-medium)' : 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    {useDefaultColor ? 'Use today\u2019s color' : 'Revert to default amber'}
                  </button>
                </div>
              </>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              className="text-pencil/50 hover:text-ink transition-colors p-1"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-xl">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>

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
