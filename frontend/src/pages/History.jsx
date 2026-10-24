import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  History as HistoryIcon, Bookmark, BookmarkX, Trash2, Loader2, AlertTriangle,
  MessageSquare, ArrowRight, LogIn, RotateCcw, Landmark,
} from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import Markdown from '../components/Markdown';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { STATUS_STYLES } from '../lib/profile';

const STATUS_CLASS = {
  Eligible: 'bg-secondary-light text-secondary border-secondary/30',
  'Insufficient Information': 'bg-surface-container-low text-primary border-border',
  Ineligible: 'bg-red-50 text-red-700 border-red-200',
};

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function History() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState('queries');
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyData, bookmarkData] = await Promise.all([
        api.history(100),
        api.bookmarks(),
      ]);
      setHistory(historyData.items || []);
      setBookmarks(bookmarkData.items || []);
    } catch (err) {
      setError(err.message || t('history_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch toggles the loading state
    load();
  }, [user, load]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  const deleteEntry = async (id) => {
    setBusyId(id);
    try {
      await api.deleteHistory(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setNotice(t('history_deleted'));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const clearAll = async () => {
    if (!window.confirm(t('history_confirm_clear'))) return;
    setBusyId('all');
    try {
      await api.clearHistory();
      setHistory([]);
      setNotice(t('history_cleared'));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeBookmark = async (schemeId) => {
    setBusyId(String(schemeId));
    try {
      await api.removeBookmark(String(schemeId));
      setBookmarks((prev) => prev.filter((item) => String(item.scheme?._id) !== String(schemeId)));
      setNotice(t('history_bookmark_removed'));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-parchment">
        <SiteHeader active="history" />
        <main className="pt-28 max-w-5xl mx-auto px-6 py-10 flex items-center gap-2 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" />
          {t('history_loading')}
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-parchment">
        <SiteHeader active="history" />
        <main className="pt-28 max-w-5xl mx-auto px-6 py-10">
          <div className="bg-white border border-border rounded p-8 max-w-md mx-auto text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-parchment border border-border flex items-center justify-center text-primary">
              <LogIn size={22} />
            </div>
            <h1 className="font-serif text-xl font-bold text-primary">{t('history_signin_title')}</h1>
            <p className="text-sm text-muted leading-relaxed">{t('history_signin_text')}</p>
            <Link
              to="/login"
              state={{ from: '/history' }}
              className="mt-1 px-4 py-2.5 rounded bg-secondary hover:bg-secondary-dark text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <LogIn size={16} />
              {t('browse_signin')}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader active="history" />

      <main className="pt-28 max-w-5xl mx-auto px-6 py-5">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary mb-1 inline-flex items-center gap-2">
              <HistoryIcon size={22} />
              {t('history_title')}
            </h1>
            <p className="text-sm text-muted max-w-2xl">{t('history_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="self-start inline-flex items-center gap-1.5 px-3 py-2 rounded border border-border bg-white text-xs font-semibold text-muted hover:text-primary disabled:opacity-50"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            {t('browse_retry')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-white border border-border rounded p-1 mb-5 text-sm max-w-md">
          <button
            type="button"
            onClick={() => setTab('queries')}
            className={`py-2 rounded font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${tab === 'queries' ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}
          >
            <MessageSquare size={15} />
            {t('history_tab_queries')}
            <span className="text-[11px] opacity-80">({history.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('bookmarks')}
            className={`py-2 rounded font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${tab === 'bookmarks' ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}
          >
            <Bookmark size={15} />
            {t('history_tab_bookmarks')}
            <span className="text-[11px] opacity-80">({bookmarks.length})</span>
          </button>
        </div>

        {notice && (
          <div className="mb-4 text-xs rounded border border-border bg-white px-3 py-2 text-primary">{notice}</div>
        )}
        {error && (
          <div className="mb-4 text-xs rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 inline-flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
            <button type="button" onClick={load} className="font-semibold underline ml-1">
              {t('browse_retry')}
            </button>
          </div>
        )}

        {loading && history.length === 0 && bookmarks.length === 0 && (
          <p className="text-muted text-sm inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {t('history_loading')}
          </p>
        )}

        {tab === 'queries' && !loading && (
          <section className="flex flex-col gap-3">
            {history.length === 0 ? (
              <div className="bg-white border border-border rounded p-8 text-center flex flex-col items-center gap-3">
                <MessageSquare size={26} className="text-muted" />
                <p className="text-sm text-muted max-w-sm">{t('history_empty_queries')}</p>
                <Link to="/chat" className="px-3.5 py-2 rounded bg-secondary text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-secondary-dark transition-colors">
                  {t('history_ask_btn')}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={busyId === 'all'}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {t('history_clear_all')}
                  </button>
                </div>
                {history.map((item) => (
                  <article key={item.id} className="bg-white border border-border rounded p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-primary text-sm break-words">{item.query}</p>
                        <p className="text-[11px] text-muted mt-0.5">{formatDate(item.created_at)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteEntry(item.id)}
                        disabled={busyId === item.id}
                        aria-label={t('history_delete')}
                        title={t('history_delete')}
                        className="shrink-0 w-8 h-8 rounded border border-border text-muted hover:text-red-600 hover:border-red-200 flex items-center justify-center disabled:opacity-50"
                      >
                        {busyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>

                    {item.answer && (
                      <div className="relative mt-3">
                        <div className="max-h-28 overflow-hidden text-xs text-muted leading-relaxed">
                          <Markdown text={item.answer} />
                        </div>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
                      </div>
                    )}

                    {item.schemes?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-[11px] font-bold uppercase text-muted mb-1.5">{t('history_schemes_label')}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.schemes.slice(0, 8).map((scheme, index) => (
                            <span
                              key={`${item.id}-${index}`}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_CLASS[scheme.status] || 'bg-parchment text-muted border-border'}`}
                            >
                              {scheme.name} · {STATUS_STYLES[scheme.status]?.label || scheme.status}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </>
            )}
          </section>
        )}

        {tab === 'bookmarks' && !loading && (
          <section className="flex flex-col gap-3">
            {bookmarks.length === 0 ? (
              <div className="bg-white border border-border rounded p-8 text-center flex flex-col items-center gap-3">
                <Bookmark size={26} className="text-muted" />
                <p className="text-sm text-muted max-w-sm">{t('history_empty_bookmarks')}</p>
                <Link to="/schemes" className="px-3.5 py-2 rounded bg-secondary text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-secondary-dark transition-colors">
                  {t('nav_schemes')}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              bookmarks.map((item) => {
                const scheme = item.scheme || {};
                return (
                  <article key={item.id} className="bg-white border border-border rounded p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                        <Landmark size={13} />
                        <span>{scheme.level || t('browse_level_central')}</span>
                        {scheme.category && <span>· {scheme.category}</span>}
                        {scheme.state && <span>· {scheme.state}</span>}
                      </div>
                      <h2 className="font-serif text-base font-bold text-primary mt-1">{scheme.scheme_name}</h2>
                      {scheme.benefits && <p className="text-xs text-muted mt-1 line-clamp-2">{scheme.benefits}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <Link to={`/schemes?scheme=${scheme._id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                          {t('history_view_details')}
                          <ArrowRight size={12} />
                        </Link>
                        {scheme.source_url && (
                          <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-secondary hover:underline">
                            {t('browse_official_link')}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBookmark(scheme._id)}
                      disabled={busyId === String(scheme._id)}
                      aria-label={t('browse_bookmark_remove')}
                      title={t('browse_bookmark_remove')}
                      className="shrink-0 w-8 h-8 rounded border border-border text-muted hover:text-red-600 hover:border-red-200 flex items-center justify-center disabled:opacity-50"
                    >
                      {busyId === String(scheme._id) ? <Loader2 size={14} className="animate-spin" /> : <BookmarkX size={14} />}
                    </button>
                  </article>
                );
              })
            )}
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
