import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Mic, MicOff, Bookmark, BookmarkCheck, Landmark, Info, Printer, Share2,
  ExternalLink, Bot, SlidersHorizontal, X, Loader2, AlertTriangle, ListChecks,
  GitCompare, ClipboardPlus, ClipboardCheck, ArrowRight,
} from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { addCompare, loadCompare, removeCompare } from '../lib/compare';
import { addToPlan, loadPlan, removeFromPlan } from '../lib/plan';

const EMPTY_FILTERS = { search: '', state: '', category: '', level: '' };

function LevelBadge({ level, t }) {
  const isState = String(level || '').toLowerCase().startsWith('state');
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${isState ? 'bg-secondary-light text-secondary border-secondary/30' : 'bg-parchment text-primary border-border'}`}>
      {isState ? t('browse_level_state') : t('browse_level_central')}
    </span>
  );
}

function SchemeCard({ scheme, active, onSelect, bookmarked, onToggleBookmark, signedIn, compared, planned, onToggleCompare, onTogglePlan, t }) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded p-5 cursor-pointer transition-colors ${active ? 'border-2 border-primary' : 'border border-border hover:border-primary'}`}
    >
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <LevelBadge level={scheme.level} t={t} />
          {scheme.category && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-muted border border-border">
              {scheme.category}
            </span>
          )}
          {scheme.state && scheme.state !== 'All' && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-muted border border-border">
              {scheme.state}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label={compared ? t('browse_compare_remove') : t('browse_compare_add')}
            title={compared ? t('browse_compare_remove') : t('browse_compare_add')}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(scheme);
            }}
            className={`p-1 rounded transition-colors ${compared ? 'text-secondary bg-secondary-light' : 'text-muted hover:text-primary'}`}
          >
            <GitCompare size={17} />
          </button>
          <button
            type="button"
            aria-label={planned ? t('browse_plan_remove') : t('browse_plan_add')}
            title={planned ? t('browse_plan_remove') : t('browse_plan_add')}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlan(scheme);
            }}
            className={`p-1 rounded transition-colors ${planned ? 'text-secondary bg-secondary-light' : 'text-muted hover:text-primary'}`}
          >
            {planned ? <ClipboardCheck size={17} /> : <ClipboardPlus size={17} />}
          </button>
          <button
            type="button"
            aria-label={bookmarked ? t('browse_bookmark_remove') : t('browse_bookmark_add')}
            title={signedIn ? (bookmarked ? t('browse_bookmark_remove') : t('browse_bookmark_add')) : t('browse_bookmark_login')}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(scheme);
            }}
            className={`p-1 rounded transition-colors ${bookmarked ? 'text-secondary' : 'text-muted hover:text-primary'}`}
          >
            {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>
      <div className="pt-3">
        <h2 className="font-serif text-xl font-bold text-primary mb-1">{scheme.scheme_name}</h2>
        <p className="text-xs text-muted leading-relaxed mb-3 line-clamp-3">{scheme.description}</p>
        <div className="border border-border rounded bg-parchment p-2.5 mb-3">
          <div className="text-[11px] text-muted font-medium">{t('browse_benefit_label')}</div>
          <div className="font-serif text-sm font-bold text-primary mt-0.5 line-clamp-2">{scheme.benefits}</div>
        </div>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
          <span className="font-bold text-primary">{t('browse_view_details')} →</span>
          {scheme.source_url && (
            <a
              href={scheme.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted hover:text-primary inline-flex items-center gap-1"
            >
              <ExternalLink size={13} />
              <span>{t('browse_official_link')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DossierPanel({ scheme, t, bookmarked, onToggleBookmark, signedIn, compared, planned, onToggleCompare, onTogglePlan }) {
  const [tab, setTab] = useState('overview');

  if (!scheme) {
    return (
      <div className="bg-white rounded border border-border p-8 flex items-center justify-center text-muted text-sm">
        {t('browse_select_prompt')}
      </div>
    );
  }

  const eligibilityEntries =
    scheme.eligibility && typeof scheme.eligibility === 'object' && !Array.isArray(scheme.eligibility)
      ? Object.entries(scheme.eligibility)
      : [];
  const conditions = scheme.eligibility_rules?.conditions || [];
  const reviewed = Boolean(scheme.eligibility_rules?.reviewed);

  const share = async () => {
    const url = `${window.location.origin}/schemes?scheme=${scheme._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: scheme.scheme_name, text: scheme.description, url });
        return;
      } catch {
        /* user cancelled – fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(`${scheme.scheme_name} — ${url}`);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="bg-white rounded border border-border p-5 xl:sticky xl:top-24 flex flex-col gap-4">
      <div className="pb-3 border-b border-border flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded border border-border bg-parchment flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Landmark size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-primary uppercase mb-0.5">{t('browse_scheme_file')}</div>
            <h3 className="font-serif text-lg font-bold text-primary leading-snug">{scheme.scheme_name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={compared ? t('browse_compare_remove') : t('browse_compare_add')}
            title={compared ? t('browse_compare_remove') : t('browse_compare_add')}
            onClick={() => onToggleCompare(scheme)}
            className={`w-8 h-8 rounded border border-border bg-parchment hover:bg-white flex items-center justify-center ${compared ? 'text-secondary' : 'text-muted'}`}
          >
            <GitCompare size={16} />
          </button>
          <button
            type="button"
            aria-label={planned ? t('browse_plan_remove') : t('browse_plan_add')}
            title={planned ? t('browse_plan_remove') : t('browse_plan_add')}
            onClick={() => onTogglePlan(scheme)}
            className={`w-8 h-8 rounded border border-border bg-parchment hover:bg-white flex items-center justify-center ${planned ? 'text-secondary' : 'text-muted'}`}
          >
            {planned ? <ClipboardCheck size={16} /> : <ClipboardPlus size={16} />}
          </button>
          <button
            type="button"
            aria-label={bookmarked ? t('browse_bookmark_remove') : t('browse_bookmark_add')}
            onClick={() => onToggleBookmark(scheme)}
            className={`w-8 h-8 rounded border border-border bg-parchment hover:bg-white flex items-center justify-center ${bookmarked ? 'text-secondary' : 'text-muted'}`}
          >
            {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
          <button aria-label="Print" onClick={() => window.print()} className="w-8 h-8 rounded border border-border bg-parchment hover:bg-white text-muted flex items-center justify-center">
            <Printer size={16} />
          </button>
          <button aria-label="Share" onClick={share} className="w-8 h-8 rounded border border-border bg-parchment hover:bg-white text-muted flex items-center justify-center">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 border border-border rounded bg-parchment p-1 gap-1 text-[11px]">
        {[
          ['overview', t('browse_overview_tab')],
          ['eligibility', t('browse_eligibility_tab')],
          ['rules', t('browse_rules_tab')],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-1.5 rounded font-bold text-center ${tab === key ? 'bg-white text-primary border border-border' : 'text-muted hover:text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="flex flex-col gap-3 text-xs">
          <div className="p-3 border border-border rounded bg-parchment">
            <div className="font-bold text-primary mb-1">{t('browse_description_label')}</div>
            <p className="text-muted leading-relaxed">{scheme.description || t('browse_not_available')}</p>
          </div>
          <div className="p-3 border border-border rounded bg-parchment">
            <div className="text-[11px] text-muted">{t('browse_benefit_label')}</div>
            <div className="font-serif text-base font-bold text-primary mt-0.5">{scheme.benefits || t('browse_not_available')}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 border border-border rounded bg-white">
              <div className="text-[11px] text-muted">{t('browse_filter_level')}</div>
              <div className="font-semibold text-primary mt-0.5">
                <LevelBadge level={scheme.level} t={t} />
              </div>
            </div>
            <div className="p-2.5 border border-border rounded bg-white">
              <div className="text-[11px] text-muted">{t('browse_filter_state')}</div>
              <div className="font-semibold text-primary mt-0.5">{scheme.state && scheme.state !== 'All' ? scheme.state : t('browse_all_india')}</div>
            </div>
          </div>
          {scheme.application_process && (
            <div className="p-2.5 border border-border rounded bg-white flex items-start gap-2">
              <Info size={18} className="text-amber shrink-0 mt-0.5" />
              <div className="text-muted leading-relaxed">
                <strong className="text-primary font-semibold">{t('browse_how_to_apply')} </strong>
                {scheme.application_process}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'eligibility' && (
        <div className="flex flex-col gap-2 text-xs">
          {eligibilityEntries.length === 0 && (
            <p className="text-muted">{t('browse_no_eligibility_details')}</p>
          )}
          {eligibilityEntries.map(([key, value]) => (
            <div key={key} className="p-2.5 border border-border rounded bg-parchment">
              <span className="font-semibold text-primary block capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="text-muted text-[11px]">{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">{t('browse_rules_tab')}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${reviewed ? 'bg-secondary-light text-secondary border-secondary/30' : 'bg-parchment text-muted border-border'}`}>
              {reviewed ? t('browse_rules_reviewed') : t('browse_rules_auto')}
            </span>
          </div>
          {conditions.length === 0 && (
            <p className="text-muted">{t('browse_rules_none')}</p>
          )}
          {conditions.map((condition, index) => (
            <div key={`${condition.attr}-${index}`} className="p-2.5 border border-border rounded bg-parchment flex items-start gap-2">
              <ListChecks size={15} className="text-secondary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-primary">{condition.label || condition.attr}</div>
                <div className="text-muted text-[11px] mt-0.5">
                  {condition.attr} {condition.op} {JSON.stringify(condition.value)}
                  {condition.optional ? ` (${t('browse_rules_optional')})` : ''}
                </div>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted leading-relaxed border-t border-border pt-2">
            {t('browse_rules_disclaimer')}
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-border flex flex-col gap-1.5">
        {scheme.source_url ? (
          <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" className="w-full h-11 rounded bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors">
            <ExternalLink size={16} />
            <span>{t('browse_portal_btn')}</span>
          </a>
        ) : (
          <div className="w-full h-11 rounded border border-border bg-parchment text-muted font-semibold text-xs flex items-center justify-center">
            {t('browse_portal_unavailable')}
          </div>
        )}
        <Link
          to="/eligibility"
          className="w-full h-10 rounded border border-secondary text-secondary font-semibold text-xs flex items-center justify-center gap-2 hover:bg-secondary-light transition-colors"
        >
          <Bot size={15} />
          <span>{t('browse_check_my_eligibility')}</span>
        </Link>
        {!signedIn && (
          <p className="text-[11px] text-muted text-center">
            <Link to="/login" className="font-semibold text-primary hover:underline">{t('browse_signin')}</Link>{' '}
            {t('browse_bookmark_login_hint')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BrowseSchemes() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [schemes, setSchemes] = useState([]);
  const [filters, setFilters] = useState({ states: [], categories: [], levels: [] });
  const [bookmarkIds, setBookmarkIds] = useState(() => new Set());
  const [compareIds, setCompareIds] = useState(() => new Set(loadCompare().map((item) => String(item.id))));
  const [planIds, setPlanIds] = useState(() => new Set(loadPlan().map((item) => String(item.id))));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selectedId, setSelectedId] = useState(() => searchParams.get('scheme'));
  const [query, setQuery] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const debounceRef = useRef(null);

  // Load filter values once.
  useEffect(() => {
    api
      .schemeFilters()
      .then((data) => setFilters({ states: data.states || [], categories: data.categories || [], levels: data.levels || [] }))
      .catch(() => {
        /* filters are optional; the search box still works */
      });
  }, []);

  // Load bookmarks for signed-in users.
  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.bookmarks();
      setBookmarkIds(new Set((data.items || []).map((item) => String(item.scheme?._id))));
    } catch {
      setBookmarkIds(new Set());
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bookmark fetch updates state after the request
    loadBookmarks();
  }, [loadBookmarks]);

  // Debounce the search box into the server query.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // Fetch whenever the query changes (server-side filtering).
  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- the spinner must appear before the request resolves */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    api
      .schemes(query)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setSchemes(list);
        setSelectedId((current) => (list.some((s) => s._id === current) ? current : list[0]?._id ?? null));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  // Speech recognition (Web Speech API; gracefully degrades).
  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice(t('browse_mic_unsupported'));
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) setSearchInput(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error !== 'aborted' && event.error !== 'no-speech') setNotice(t('browse_mic_error'));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setNotice(t('browse_mic_error'));
    }
  };

  useEffect(() => () => recognitionRef.current?.abort?.(), []);

  const toggleBookmark = async (scheme) => {
    if (!user) {
      setNotice(t('browse_bookmark_login'));
      return;
    }
    const id = String(scheme._id);
    const wasBookmarked = bookmarkIds.has(id);
    setBookmarkIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasBookmarked) await api.removeBookmark(id);
      else await api.addBookmark(id);
      setNotice(wasBookmarked ? t('browse_bookmark_removed') : t('browse_bookmark_saved'));
    } catch (err) {
      setBookmarkIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
      setNotice(err.message);
    }
  };

  const toggleCompare = (scheme) => {
    const id = String(scheme._id);
    if (compareIds.has(id)) {
      removeCompare(id);
      setCompareIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setNotice(t('browse_compare_removed'));
      return;
    }
    const result = addCompare(scheme);
    if (!result.ok) {
      setNotice(t('browse_compare_limit'));
      return;
    }
    setCompareIds((prev) => new Set(prev).add(id));
    setNotice(t('browse_compare_saved'));
  };

  const togglePlan = (scheme) => {
    const id = String(scheme._id);
    if (planIds.has(id)) {
      removeFromPlan(id);
      setPlanIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setNotice(t('browse_plan_removed'));
      return;
    }
    const result = addToPlan(scheme);
    if (!result.ok) {
      setNotice(t('browse_plan_add'));
      return;
    }
    setPlanIds((prev) => new Set(prev).add(id));
    setNotice(t('browse_plan_saved'));
  };

  const activeFilters = useMemo(
    () => Boolean(query.search || query.state || query.category || query.level),
    [query],
  );

  const selectedScheme = schemes.find((s) => s._id === selectedId) || null;

  const setFilter = (key) => (event) => {
    const value = event.target.value;
    setQuery((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setQuery({ ...EMPTY_FILTERS });
  };

  const selectClass =
    'h-10 px-3 border border-border rounded bg-parchment text-xs font-medium text-primary focus:outline-none focus:border-primary focus:bg-white';

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader active="schemes" />

      <main className="pt-28 max-w-6xl mx-auto px-6 py-5">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">{t('browse_title')}</h1>
          <p className="text-sm text-muted max-w-2xl">{t('browse_subtitle')}</p>
        </div>

        <div className="w-full bg-white border border-border rounded p-4 mb-6 flex flex-col gap-3">
          <div className="relative flex items-center">
            <Search size={20} className="absolute left-3.5 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-11 pl-10 pr-12 border border-border rounded bg-parchment text-sm placeholder:text-muted focus:outline-none focus:border-primary focus:bg-white"
              placeholder={t('browse_search_placeholder')}
              type="text"
            />
            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? t('browse_mic_stop') : t('browse_mic_start')}
              title={listening ? t('browse_mic_stop') : t('browse_mic_start')}
              className={`absolute right-3 p-1.5 rounded transition-colors ${listening ? 'bg-red-50 text-red-600' : 'text-muted hover:text-primary'}`}
            >
              {listening ? <MicOff size={18} /> : <Mic size={19} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted mr-1">
              <SlidersHorizontal size={13} />
              {t('browse_filters_label')}
            </span>
            <select value={query.state} onChange={setFilter('state')} className={selectClass} aria-label={t('browse_filter_state')}>
              <option value="">{t('browse_all_states')}</option>
              {filters.states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <select value={query.category} onChange={setFilter('category')} className={selectClass} aria-label={t('browse_filter_category')}>
              <option value="">{t('browse_all_categories')}</option>
              {filters.categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select value={query.level} onChange={setFilter('level')} className={selectClass} aria-label={t('browse_filter_level')}>
              <option value="">{t('browse_all_levels')}</option>
              {filters.levels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            {activeFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 h-10 rounded border border-border text-[11px] font-semibold text-muted hover:text-primary hover:bg-parchment transition-colors"
              >
                <X size={13} />
                {t('browse_clear_filters')}
              </button>
            )}
            <span className="ml-auto text-[11px] text-muted">
              {schemes.length} {t('browse_results_suffix')}
            </span>
          </div>
        </div>

        {notice && (
          <div className="mb-4 text-xs rounded border border-border bg-white px-3 py-2 text-primary flex items-center gap-2">
            <Info size={14} className="text-amber shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 text-xs rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
            <button type="button" onClick={() => setQuery((prev) => ({ ...prev }))} className="ml-auto font-semibold underline">
              {t('browse_retry')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-7 flex flex-col gap-4">
            {loading && schemes.length === 0 && (
              <p className="text-muted text-sm inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {t('browse_loading')}
              </p>
            )}
            {!loading && !error && schemes.length === 0 && (
              <p className="text-muted text-sm">{t('browse_no_results')}</p>
            )}
            {schemes.map((scheme) => (
              <SchemeCard
                key={scheme._id}
                scheme={scheme}
                active={scheme._id === selectedId}
                onSelect={() => setSelectedId(scheme._id)}
                bookmarked={Boolean(user) && bookmarkIds.has(String(scheme._id))}
                onToggleBookmark={toggleBookmark}
                signedIn={Boolean(user)}
                compared={compareIds.has(String(scheme._id))}
                planned={planIds.has(String(scheme._id))}
                onToggleCompare={toggleCompare}
                onTogglePlan={togglePlan}
                t={t}
              />
            ))}
          </div>
          <div className="xl:col-span-5 order-first xl:order-none">
            <DossierPanel
              key={selectedScheme?._id || 'none'}
              scheme={selectedScheme}
              t={t}
              bookmarked={selectedScheme && Boolean(user) && bookmarkIds.has(String(selectedScheme._id))}
              onToggleBookmark={toggleBookmark}
              signedIn={Boolean(user)}
              compared={selectedScheme && compareIds.has(String(selectedScheme._id))}
              planned={selectedScheme && planIds.has(String(selectedScheme._id))}
              onToggleCompare={toggleCompare}
              onTogglePlan={togglePlan}
            />
          </div>
        </div>

        {compareIds.size > 0 && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-primary text-white rounded-full shadow-lg px-4 py-2.5 flex items-center gap-3 text-xs">
            <GitCompare size={15} />
            <span className="font-semibold">{compareIds.size} {t('nav_compare').toLowerCase()}</span>
            <Link to="/compare" className="inline-flex items-center gap-1 font-bold text-white hover:underline">
              {t('browse_compare_open')} <ArrowRight size={13} />
            </Link>
            {planIds.size > 0 && (
              <Link to="/plan" className="hidden sm:inline-flex items-center gap-1 text-white/80 hover:text-white">
                {t('browse_plan_open')}
              </Link>
            )}
          </div>
        )}

        <div className="w-full mt-8 rounded border border-border bg-white p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded border border-border bg-parchment flex items-center justify-center text-primary shrink-0">
              <Bot size={26} />
            </div>
            <div>
              <div className="text-xs font-bold text-primary">{t('browse_not_sure_title')}</div>
              <p className="text-xs text-muted leading-relaxed">{t('browse_not_sure_text')}</p>
            </div>
          </div>
          <Link to="/chat" className="px-3.5 py-2 rounded bg-secondary hover:bg-[#155332] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shrink-0">
            <Bot size={16} />
            <span>{t('browse_consult_btn')}</span>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
