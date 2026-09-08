import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Mic, Bookmark, Landmark, Info, Printer, Share2, ExternalLink, Bot, BookOpen, Home as HomeIcon
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

function SchemeCard({ scheme, active, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded p-5 cursor-pointer transition-colors ${
        active ? 'border-2 border-primary' : 'border border-border hover:border-primary'
      }`}
    >
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-parchment text-primary border border-border">
          Central Scheme
        </span>
        <button
          aria-label="Bookmark"
          onClick={(e) => e.stopPropagation()}
          className="text-muted hover:text-primary p-0.5"
        >
          <Bookmark size={19} />
        </button>
      </div>
      <div className="pt-3">
        <h2 className="font-serif text-xl font-bold text-primary mb-1">{scheme.scheme_name}</h2>
        <p className="text-xs text-muted leading-relaxed mb-3 line-clamp-3">{scheme.description}</p>
        <div className="border border-border rounded bg-parchment p-2.5 mb-3">
          <div className="text-[11px] text-muted font-medium">Benefit</div>
          <div className="font-serif text-sm font-bold text-primary mt-0.5">{scheme.benefits}</div>
        </div>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
          <span className="font-bold text-primary">View Details →</span>
        </div>
      </div>
    </div>
  );
}

function DossierPanel({ scheme }) {
  const [tab, setTab] = useState('overview');

  if (!scheme) {
    return (
      <div className="bg-white rounded border border-border p-8 flex items-center justify-center text-muted text-sm">
        Select a scheme to view details
      </div>
    );
  }

  const eligibilityEntries = scheme.eligibility ? Object.entries(scheme.eligibility) : [];

  return (
    <div className="bg-white rounded border border-border p-5 sticky top-6 flex flex-col gap-4">
      <div className="pb-3 border-b border-border flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded border border-border bg-parchment flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Landmark size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-primary uppercase mb-0.5">Scheme File</div>
            <h3 className="font-serif text-lg font-bold text-primary leading-snug">{scheme.scheme_name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button aria-label="Print" onClick={() => window.print()} className="w-8 h-8 rounded border border-border bg-parchment hover:bg-white text-muted flex items-center justify-center">
            <Printer size={16} />
          </button>
          <button aria-label="Share" className="w-8 h-8 rounded border border-border bg-parchment hover:bg-white text-muted flex items-center justify-center">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 border border-border rounded bg-parchment p-1 gap-1 text-xs">
        <button
          onClick={() => setTab('overview')}
          className={`py-1.5 rounded font-bold text-center ${tab === 'overview' ? 'bg-white text-primary border border-border' : 'text-muted hover:text-primary'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('eligibility')}
          className={`py-1.5 rounded font-bold text-center ${tab === 'eligibility' ? 'bg-white text-primary border border-border' : 'text-muted hover:text-primary'}`}
        >
          Eligibility
        </button>
      </div>

      {tab === 'overview' && (
        <div className="flex flex-col gap-3 text-xs">
          <div className="p-3 border border-border rounded bg-parchment">
            <div className="font-bold text-primary mb-1">Description</div>
            <p className="text-muted leading-relaxed">{scheme.description}</p>
          </div>
          <div className="p-3 border border-border rounded bg-parchment">
            <div className="text-[11px] text-muted">Benefit</div>
            <div className="font-serif text-base font-bold text-primary mt-0.5">{scheme.benefits}</div>
          </div>
          {scheme.application_process && (
            <div className="p-2.5 border border-border rounded bg-white flex items-start gap-2">
              <Info size={18} className="text-amber shrink-0 mt-0.5" />
              <div className="text-muted leading-relaxed">
                <strong className="text-primary font-semibold">How to apply: </strong>
                {scheme.application_process}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'eligibility' && (
        <div className="flex flex-col gap-2 text-xs">
          {eligibilityEntries.length === 0 && (
            <p className="text-muted">No eligibility details available for this scheme.</p>
          )}
          {eligibilityEntries.map(([key, value]) => (
            <div key={key} className="p-2.5 border border-border rounded bg-parchment">
              <span className="font-semibold text-primary block capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="text-muted text-[11px]">{value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-border flex flex-col gap-1.5">
        <a
          href={scheme.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 rounded bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
        >
          <ExternalLink size={16} />
          <span>Proceed to Official Government Portal</span>
        </a>
      </div>
    </div>
  );
}

function Sidebar() {
  const items = [
    { label: 'AI Assistant', icon: Bot, to: '/chat', active: false },
    { label: 'Browse All Schemes', icon: BookOpen, to: '/schemes', active: true },
  ];
  return (
    <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col pt-4 pb-6">
      <div className="px-4 mb-4 flex items-center gap-2 border-b border-border pb-3">
        <div>
          <span className="font-serif text-[18px] font-bold text-primary block leading-tight">SchemeSaathi</span>
          <span className="text-[11px] text-muted block">Civic Welfare Copilot</span>
        </div>
      </div>
      <div className="px-4 mb-3">
        <div className="p-2.5 rounded-sm bg-parchment border border-border flex items-start gap-2">
          <span className="text-secondary text-lg">✓</span>
          <div>
            <span className="text-[12px] font-bold text-primary block leading-tight">Scheme Directory</span>
            <span className="text-[11px] text-muted block mt-0.5">Live MongoDB Records</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex items-center px-3 py-2.5 rounded-sm text-[14px] font-medium transition-colors ${
              item.active
                ? 'bg-primary text-white border-l-4 border-secondary font-semibold'
                : 'text-muted hover:bg-parchment hover:text-primary'
            }`}
          >
            <item.icon size={18} className="mr-3" />
            {item.label}
          </Link>
        ))}
        <Link to="/" className="flex items-center px-3 py-2.5 rounded-sm text-[14px] font-medium text-muted hover:bg-parchment hover:text-primary transition-colors">
          <HomeIcon size={18} className="mr-3" />
          Home Portal
        </Link>
      </nav>
    </aside>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-border px-6 h-16 flex items-center justify-between shrink-0">
      <div>
        <h2 className="font-serif font-semibold text-primary text-[15px]">Welfare Scheme Directory</h2>
        <p className="text-[12px] text-muted">Browse all schemes currently in the database</p>
      </div>
      <span className="text-[11px] px-2 py-1 border border-border rounded-sm text-muted hidden sm:inline">
        256-bit SSL • Academic Project
      </span>
    </header>
  );
}

export default function BrowseSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/schemes`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch schemes');
        return res.json();
      })
      .then((data) => {
        setSchemes(data);
        if (data.length > 0) setSelectedId(data[0]._id);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = schemes.filter((s) =>
    s.scheme_name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const selectedScheme = schemes.find((s) => s._id === selectedId);

  return (
    <div className="flex h-screen bg-parchment">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto px-6 py-5 max-w-6xl w-full mx-auto">
          <div className="w-full bg-white border border-border rounded p-4 mb-6">
            <div className="relative flex items-center">
              <Search size={20} className="absolute left-3.5 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-10 border border-border rounded bg-parchment text-sm placeholder:text-muted focus:outline-none focus:border-primary focus:bg-white"
                placeholder="Search by scheme title or keyword (e.g. PM-KISAN, Ayushman, Pension)"
                type="text"
              />
              <Mic size={19} className="absolute right-3.5 text-muted" />
            </div>
          </div>

          {loading && <p className="text-muted text-sm">Loading schemes…</p>}
          {error && <p className="text-red-600 text-sm">Error: {error}</p>}

          {!loading && !error && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-7 flex flex-col gap-4">
                {filtered.length === 0 && (
                  <p className="text-muted text-sm">No schemes match your search.</p>
                )}
                {filtered.map((scheme) => (
                  <SchemeCard
                    key={scheme._id}
                    scheme={scheme}
                    active={scheme._id === selectedId}
                    onSelect={() => setSelectedId(scheme._id)}
                  />
                ))}
              </div>
              <div className="xl:col-span-5">
                <DossierPanel scheme={selectedScheme} />
              </div>
            </div>
          )}

          <div className="w-full mt-8 rounded border border-border bg-white p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded border border-border bg-parchment flex items-center justify-center text-primary shrink-0">
                <Bot size={26} />
              </div>
              <div>
                <div className="text-xs font-bold text-primary">Not sure which scheme fits you?</div>
                <p className="text-xs text-muted leading-relaxed">
                  Describe your situation to the AI assistant for a personalized match instead of browsing manually.
                </p>
              </div>
            </div>
            <Link
              to="/chat"
              className="px-3.5 py-2 rounded bg-secondary hover:bg-[#155332] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Bot size={16} />
              <span>Consult SchemeSaathi AI</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}