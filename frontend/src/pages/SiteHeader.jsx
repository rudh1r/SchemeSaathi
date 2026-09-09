import { Link } from 'react-router-dom';
import { UserCheck, Sun, CircleUserRound, Menu } from 'lucide-react';

// Shared header for public-facing pages (Home, About). Chat/Eligibility/Browse
// use the app Sidebar layout instead — this is just for the marketing-style pages.
export default function SiteHeader({ active }) {
  const links = [
    { key: 'home', label: 'Home', to: '/' },
    { key: 'chat', label: 'Chat Assistant', to: '/chat' },
    { key: 'eligibility', label: 'Check Eligibility', to: '/eligibility' },
    { key: 'schemes', label: 'Browse Schemes', to: '/schemes' },
    { key: 'about', label: 'About', to: '/about' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="h-20 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-semibold text-on-surface-variant">
            LOGO
          </div>
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
        </div>

        <nav className="hidden lg:flex items-center gap-1 border-x border-outline-variant px-3 py-1">
          {links.map((link) => (
            <Link
              key={link.key}
              to={link.to}
              className={
                active === link.key
                  ? 'bg-primary text-on-primary font-semibold px-3 py-1.5 rounded text-label-md'
                  : 'text-on-surface-variant hover:text-primary px-3 py-1.5 font-label-md text-label-md transition-colors'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="relative hidden sm:flex items-center border border-outline-variant bg-surface-container-low rounded p-0.5 gap-0.5">
            <button type="button" className="px-2.5 py-0.5 rounded font-label-sm text-label-sm font-semibold bg-primary text-on-primary shadow-sm">English</button>
            <button type="button" className="px-2.5 py-0.5 rounded font-label-sm text-label-sm font-medium text-on-surface-variant hover:text-primary transition-colors">हिन्दी</button>
          </div>
          <button aria-label="Toggle color mode" className="w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors" type="button">
            <Sun size={18} />
          </button>
          <Link className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded bg-secondary text-on-secondary hover:bg-[#155734] transition-all font-label-md text-label-md font-semibold border border-[#155734]" to="/eligibility">
            <UserCheck size={17} />
            <span>Check Eligibility</span>
          </Link>
          <div className="w-8 h-8 rounded border border-outline-variant bg-surface-container-low flex items-center justify-center shrink-0 text-primary">
            <CircleUserRound size={18} />
          </div>
          <button aria-label="Open navigation menu" className="lg:hidden w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest flex items-center justify-center text-on-surface" type="button">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
