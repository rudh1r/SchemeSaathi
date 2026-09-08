import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Mic, ChevronDown, Bookmark, CheckCircle2,
  Landmark, Info, Printer, Share2, ExternalLink,
  Bot, RotateCcw
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

  const eligibilityEntries = scheme.eligibility_criteria ? Object.entries(scheme.eligibility_criteria) : (scheme.eligibility ? Object.entries(scheme.eligibility) : []);

  return (
    <div className="bg-white rounded border border-border p-5 sticky top-20 flex flex-col gap-4">
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
          {eligibilityEntries.map(([key, value]) => {
            if (key === '_id' || typeof value === 'object') return null;
            return (
              <div key={key} className="p-2.5 border border-border rounded bg-parchment">
                <span className="font-semibold text-primary block capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-muted text-[11px]">{value}</span>
              </div>
            );
          })}
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
        // Handle wrapper structures like { success: true, data: [...] } or direct arrays
        const schemeList = Array.isArray(data) ? data : (data.data || []);
        setSchemes(schemeList);
        if (schemeList.length > 0) setSelectedId(schemeList[0]._id);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = schemes.filter((s) =>
    s.scheme_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedScheme = schemes.find((s) => s._id === selectedId);

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-white border-b border-border px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif font-bold text-primary text-lg">SchemeSaathi</Link>
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="text-muted hover:text-primary transition">Home</Link>
          <Link to="/chat" className="text-muted hover:text-primary transition">Chat Assistant</Link>
          <Link to="/schemes" className="text-primary font-semibold">Browse Schemes</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="w-full bg-primary text-white rounded p-6 mb-6">
          <h1 className="font-serif text-2xl font-bold">Welfare Scheme Directory</h1>
          <p className="text-sm text-white/70 mt-1">
            Browse all schemes currently in the SchemeSaathi database. For a personalized recommendation, use the Chat Assistant instead.
          </p>
        </div>

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
  );
}