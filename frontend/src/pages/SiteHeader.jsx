import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserCheck, Sun, Moon, CircleUserRound, Menu, X, Landmark, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext';

function AccountButton() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname }}
        aria-label="Sign in"
        className="w-8 h-8 rounded border border-outline-variant bg-surface-container-low flex items-center justify-center shrink-0 text-primary hover:bg-surface-container transition-colors"
      >
        <CircleUserRound size={18} />
      </Link>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="text-[13px] font-semibold text-primary">{t('login_hi')}, {user.name.split(' ')[0]}</span>
      <button
        onClick={() => { logout(); navigate('/'); }}
        className="text-[11px] px-2 py-1 border border-outline-variant rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
      >
        {t('logout_btn')}
      </button>
    </div>
  );
}

export default function SiteHeader({ active }) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { key: 'home', label: t('nav_home'), to: '/' },
    { key: 'chat', label: t('nav_chat'), to: '/chat' },
    { key: 'eligibility', label: t('nav_eligibility'), to: '/eligibility' },
    { key: 'schemes', label: t('nav_schemes'), to: '/schemes' },
    { key: 'plan', label: t('nav_plan'), to: '/plan' },
    { key: 'compare', label: t('nav_compare'), to: '/compare' },
    { key: 'history', label: t('nav_history'), to: '/history' },
    { key: 'about', label: t('nav_about'), to: '/about' },
  ];

  // Close the drawer whenever a link is used.
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-outline-variant">
      <div className="h-20 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 group" aria-label="SchemeSaathi home">
          <span className="h-9 w-9 rounded bg-primary text-on-primary flex items-center justify-center shrink-0 group-hover:bg-primary-container transition-colors">
            <Landmark size={19} />
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">
                SchemeSaathi
              </span>
              <span className="hidden sm:inline-block border border-outline-variant bg-surface-container-low text-primary px-1.5 py-0.5 rounded text-[11px] font-semibold">
                Beta
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Civic Welfare Copilot
            </span>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-3">
          {links.map((link) => (
            <Link
              key={link.key}
              to={link.to}
              className={
                active === link.key
                  ? 'border-b-2 border-secondary text-primary font-bold px-1 py-2 text-[11px]'
                  : 'border-b-2 border-transparent text-on-surface-variant hover:text-primary px-1 py-2 text-[11px] font-medium transition-colors'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="relative hidden sm:flex items-center border border-outline-variant bg-surface-container-low rounded p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-0.5 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                language === 'en' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-0.5 rounded font-label-sm text-label-sm font-medium transition-colors ${
                language === 'hi' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              हिन्दी
            </button>
          </div>
          <button
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            onClick={toggleTheme}
            className="w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
            type="button"
          >
            {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-secondary text-on-secondary hover:bg-secondary-dark transition-all font-label-md text-label-md font-semibold border border-secondary-dark" to="/eligibility">
            <UserCheck size={17} />
            <span>{t('check_eligibility_btn')}</span>
          </Link>
          <AccountButton />
          <button
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="xl:hidden w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors"
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="xl:hidden fixed inset-0 top-20 z-40 bg-black/30" onClick={() => setMenuOpen(false)}>
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="bg-surface-container-lowest border-b border-outline-variant max-h-[calc(100vh-5rem)] overflow-y-auto p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.key}
                  to={link.to}
                  onClick={closeMenu}
                  className={
                    active === link.key
                      ? 'bg-primary text-on-primary font-semibold px-3 py-2.5 rounded text-body-sm'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2.5 rounded text-body-sm transition-colors'
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-outline-variant flex flex-col gap-3">
              <Link
                to="/eligibility"
                onClick={closeMenu}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded bg-secondary text-on-secondary font-label-md text-label-md font-semibold"
              >
                <UserCheck size={17} />
                <span>{t('check_eligibility_btn')}</span>
              </Link>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center border border-outline-variant bg-surface-container-low rounded p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                      language === 'en' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('hi')}
                    className={`px-3 py-1 rounded font-label-sm text-label-sm font-medium transition-colors ${
                      language === 'hi' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant font-label-sm text-label-sm font-semibold hover:text-primary"
                  >
                    <LogOut size={14} />
                    <span>{t('logout_btn')}</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: location.pathname }}
                    onClick={closeMenu}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-outline-variant text-primary font-label-sm text-label-sm font-semibold"
                  >
                    <CircleUserRound size={14} />
                    <span>Sign in</span>
                  </Link>
                )}
              </div>

              {user && (
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {t('login_hi')}, {user.name}
                </p>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
