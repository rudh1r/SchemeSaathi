import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, GitCompare, Loader2, Printer, Trash2, X } from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { useLanguage } from '../context/LanguageContext';
import api from '../lib/api';
import { clearCompare, loadCompare, removeCompare } from '../lib/compare';
import { deriveChecklist } from '../lib/checklist';

function EligibilitySummary({ scheme }) {
  const entries = scheme.eligibility && typeof scheme.eligibility === 'object'
    ? Object.entries(scheme.eligibility)
    : [];
  if (entries.length === 0) {
    return <p className="text-xs text-muted">No structured eligibility summary.</p>;
  }
  return (
    <dl className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt className="text-[10px] uppercase tracking-wide text-muted">{key.replace(/_/g, ' ')}</dt>
          <dd className="text-xs text-primary leading-relaxed">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Compare() {
  const { t } = useLanguage();
  const [compareItems, setCompareItems] = useState(() => loadCompare());
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.schemes()
      .then((data) => {
        if (!cancelled) setSchemes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(() => {
    const ids = new Set(compareItems.map((item) => String(item.id)));
    return schemes.filter((scheme) => ids.has(String(scheme._id)));
  }, [schemes, compareItems]);

  const remove = (id) => {
    removeCompare(id);
    setCompareItems(loadCompare());
  };

  const clear = () => {
    clearCompare();
    setCompareItems([]);
  };

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader active="compare" />
      <main className="pt-28 max-w-7xl mx-auto px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary mb-1">{t('compare_title')}</h1>
            <p className="text-sm text-muted max-w-2xl">{t('compare_subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.length > 0 && (
              <>
                <button type="button" onClick={() => window.print()} className="h-9 px-3 rounded border border-border bg-white text-primary text-[11px] font-semibold inline-flex items-center gap-1.5">
                  <Printer size={14} /> {t('compare_print')}
                </button>
                <button type="button" onClick={clear} className="h-9 px-3 rounded border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1.5">
                  <X size={14} /> {t('compare_clear')}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 text-xs rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>
        )}

        {loading && (
          <p className="text-sm text-muted inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</p>
        )}

        {!loading && selected.length === 0 && (
          <div className="bg-white border border-border rounded p-10 text-center">
            <GitCompare size={34} className="text-muted mx-auto mb-3" />
            <p className="text-sm text-muted mb-4">{t('compare_empty')}</p>
            <Link to="/schemes" className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-primary text-white text-xs font-semibold">
              {t('compare_go_browse')} <ExternalLink size={14} />
            </Link>
          </div>
        )}

        {selected.length > 0 && (
          <div className="overflow-x-auto border border-border rounded bg-white">
            <table className="w-full min-w-[720px] border-collapse text-left align-top">
              <thead>
                <tr className="bg-parchment border-b border-border">
                  <th className="w-36 p-3 text-[11px] font-bold uppercase tracking-wide text-muted align-top">Scheme</th>
                  {selected.map((scheme) => (
                    <th key={scheme._id} className="p-3 align-top border-l border-border min-w-[240px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] uppercase text-muted">{scheme.level === 'State' ? scheme.state : 'Central'}</div>
                          <div className="font-serif text-sm font-bold text-primary leading-snug mt-0.5">{scheme.scheme_name}</div>
                        </div>
                        <button type="button" onClick={() => remove(scheme._id)} className="text-muted hover:text-red-700 shrink-0" aria-label={t('compare_remove')}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wide text-muted align-top">{t('compare_benefits')}</th>
                  {selected.map((scheme) => (
                    <td key={scheme._id} className="p-3 align-top border-l border-border">
                      <p className="text-xs text-muted leading-relaxed">{scheme.benefits || '—'}</p>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border bg-parchment/40">
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wide text-muted align-top">{t('compare_eligibility')}</th>
                  {selected.map((scheme) => (
                    <td key={scheme._id} className="p-3 align-top border-l border-border">
                      <EligibilitySummary scheme={scheme} />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wide text-muted align-top">{t('compare_apply')}</th>
                  {selected.map((scheme) => (
                    <td key={scheme._id} className="p-3 align-top border-l border-border">
                      <p className="text-xs text-muted leading-relaxed">{scheme.application_process || '—'}</p>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border bg-parchment/40">
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wide text-muted align-top">{t('compare_documents')}</th>
                  {selected.map((scheme) => (
                    <td key={scheme._id} className="p-3 align-top border-l border-border">
                      <ul className="list-disc list-inside text-xs text-muted space-y-1">
                        {deriveChecklist(scheme).documents.slice(0, 8).map((document) => (
                          <li key={document.id}>{document.label}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="p-3 text-[11px] font-bold uppercase tracking-wide text-muted align-top">{t('compare_source')}</th>
                  {selected.map((scheme) => (
                    <td key={scheme._id} className="p-3 align-top border-l border-border">
                      {scheme.source_url ? (
                        <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                          <ExternalLink size={13} /> {t('compare_source')}
                        </a>
                      ) : <span className="text-xs text-muted">—</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link to="/plan" className="text-xs font-semibold text-secondary hover:underline">{t('compare_open_plan')} →</Link>
          <span className="text-[11px] text-muted">{t('compare_limit')}</span>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
