import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, CalendarClock, CheckCircle2, Circle, ClipboardList, ExternalLink,
  GitCompare, Info, Loader2, Printer, Trash2, UserRound,
} from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import Illos from '../components/Illos';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { describeProfile, loadProfile } from '../lib/profile';
import { deriveChecklist } from '../lib/checklist';
import {
  dueReminders, loadChecklist, loadPlan, loadReminders, removeFromPlan,
  saveChecklist, setReminder,
} from '../lib/plan';

function SchemePlanCard({ scheme, t, reminder, checked, onToggleDocument, onSetReminder, onRemove, expanded, onToggleExpanded }) {
  const checklist = useMemo(() => deriveChecklist(scheme), [scheme]);
  const checkedCount = checklist.documents.filter((document) => checked.includes(document.id)).length;
  const progress = checklist.documents.length ? Math.round((checkedCount / checklist.documents.length) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const due = reminder?.date && reminder.date <= today;

  return (
    <article className="bg-white border border-border rounded overflow-hidden">
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {scheme.level === 'State' ? scheme.state || 'State scheme' : 'Central scheme'}
              </span>
              {scheme.category && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted">{scheme.category}</span>
              )}
              {due && (
                <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-low border border-border text-primary font-semibold">
                  {t('plan_reminder_due')}
                </span>
              )}
            </div>
            <h2 className="font-serif text-lg font-bold text-primary leading-snug">{scheme.scheme_name}</h2>
            <p className="text-xs text-muted mt-1 line-clamp-2">{scheme.benefits}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(scheme)}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-red-700"
            aria-label={t('plan_remove')}
          >
            <Trash2 size={14} />
            {t('plan_remove')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="px-3 py-2 rounded bg-primary text-white text-[11px] font-semibold inline-flex items-center gap-1.5"
            aria-expanded={expanded}
          >
            <ClipboardList size={14} />
            {t('plan_checklist_title')}
          </button>
          <a
            href={scheme.source_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-2 rounded border border-border text-[11px] font-semibold inline-flex items-center gap-1.5 ${scheme.source_url ? 'text-primary hover:bg-parchment' : 'text-muted pointer-events-none'}`}
          >
            <ExternalLink size={14} />
            {t('plan_open')}
          </a>
          <Link
            to={`/schemes?scheme=${scheme._id}`}
            className="px-3 py-2 rounded border border-border text-[11px] font-semibold text-primary hover:bg-parchment inline-flex items-center gap-1.5"
          >
            <Info size={14} />
            {t('browse_view_details')}
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
            <span>{t('plan_checklist_title')}</span>
            <span>{checkedCount}/{checklist.documents.length} {t('plan_progress')}</span>
          </div>
          <div className="h-1.5 rounded bg-parchment border border-border overflow-hidden">
            <div className="h-full bg-secondary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-parchment/60 p-5 flex flex-col gap-5">
          <section>
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">{t('plan_documents_title')}</h3>
            <p className="text-[11px] text-muted mb-3">{t('plan_checklist_hint')}</p>
            <ul className="grid gap-2">
              {checklist.documents.map((document) => {
                const isChecked = checked.includes(document.id);
                return (
                  <li key={document.id}>
                    <label className={`flex items-start gap-2.5 p-2.5 rounded border cursor-pointer ${isChecked ? 'border-secondary/40 bg-secondary-light/40' : 'border-border bg-white'}`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked}
                        onChange={() => onToggleDocument(document.id)}
                      />
                      {isChecked ? <CheckCircle2 size={17} className="text-secondary shrink-0 mt-0.5" /> : <Circle size={17} className="text-muted shrink-0 mt-0.5" />}
                      <span>
                        <span className={`block text-xs font-semibold ${isChecked ? 'text-secondary line-through' : 'text-primary'}`}>{document.label}</span>
                        <span className="block text-[11px] text-muted mt-0.5">{document.why}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">{t('plan_steps_title')}</h3>
            <ol className="list-decimal list-inside text-xs text-muted leading-relaxed space-y-1.5">
              {checklist.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>

          <section className="border-t border-border pt-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-1 inline-flex items-center gap-1.5">
              <CalendarClock size={14} /> {t('plan_reminder_title')}
            </h3>
            <p className="text-[11px] text-muted mb-2">{t('plan_reminder_hint')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={reminder?.date || ''}
                onChange={(event) => onSetReminder(event.target.value)}
                className="h-9 px-2.5 rounded border border-border bg-white text-xs text-primary focus:outline-none focus:border-primary"
                aria-label={t('plan_reminder_title')}
              />
              <span className="text-[11px] text-muted">
                {reminder?.date ? `${t('plan_reminder_set')}: ${reminder.date}` : t('plan_reminder_none')}
              </span>
            </div>
          </section>

          <p className="text-[10px] text-muted leading-relaxed border-t border-border pt-3">{t('plan_not_official')}</p>
        </div>
      )}
    </article>
  );
}

export default function Plan() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [planItems, setPlanItems] = useState(() => loadPlan());
  const [serverBookmarks, setServerBookmarks] = useState([]);
  const [profile] = useState(() => loadProfile());
  const [reminders, setReminders] = useState(() => loadReminders());
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

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

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    api.bookmarks()
      .then((data) => {
        if (!cancelled) setServerBookmarks((data.items || []).map((item) => item.scheme).filter(Boolean));
      })
      .catch(() => {
        /* local plan still works if bookmarks fail */
      });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  const planIds = useMemo(() => {
    const ids = new Set(planItems.map((item) => String(item.id)));
    serverBookmarks.forEach((scheme) => ids.add(String(scheme._id)));
    return ids;
  }, [planItems, serverBookmarks]);

  const selected = useMemo(
    () => schemes.filter((scheme) => planIds.has(String(scheme._id))),
    [schemes, planIds],
  );

  const due = useMemo(() => dueReminders(reminders), [reminders]);

  useEffect(() => {
    if (due.length === 0 || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    for (const reminder of due) {
      const key = `schemesaathi_notified_${reminder.id}_${reminder.date}`;
      if (sessionStorage.getItem(key)) continue;
      const scheme = schemes.find((item) => String(item._id) === String(reminder.id));
      try {
        new Notification(t('plan_reminder_notified'), {
          body: t('plan_reminder_notified_body').replace('{scheme}', scheme?.scheme_name || 'your scheme'),
          tag: key,
        });
        sessionStorage.setItem(key, '1');
      } catch {
        /* notifications are best-effort */
      }
    }
  }, [due, schemes, t]);

  const toggleDocument = (schemeId, documentId) => {
    const current = checked[schemeId] || loadChecklist(schemeId);
    const next = current.includes(documentId)
      ? current.filter((id) => id !== documentId)
      : [...current, documentId];
    setChecked((prev) => ({ ...prev, [schemeId]: next }));
    saveChecklist(schemeId, next);
  };

  const updateReminder = (schemeId, date) => {
    const next = setReminder(schemeId, { date });
    setReminders(next);
    setNotice(t('plan_reminder_saved'));
  };

  const removeScheme = async (scheme) => {
    removeFromPlan(scheme._id);
    setPlanItems(loadPlan());
    setNotice(t('browse_plan_removed'));
    if (user) {
      try {
        await api.removeBookmark(String(scheme._id));
        setServerBookmarks((prev) => prev.filter((item) => String(item._id) !== String(scheme._id)));
      } catch {
        /* local removal already succeeded */
      }
    }
  };

  const askNotifications = async () => {
    if (!('Notification' in window)) {
      setNotice(t('plan_reminder_permission_denied'));
      return;
    }
    const permission = await Notification.requestPermission();
    setNotice(permission === 'granted' ? t('plan_reminder_permission') : t('plan_reminder_permission_denied'));
  };

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader active="plan" />
      <main className="pt-28 max-w-5xl mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-center border-b border-border pb-6 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary mb-1">{t('plan_title')}</h1>
            <p className="text-sm text-muted max-w-2xl">{t('plan_subtitle')}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {due.length > 0 && (
                <button type="button" onClick={askNotifications} className="h-9 px-3 border border-border bg-surface-container-low text-primary text-[11px] font-semibold inline-flex items-center gap-1.5">
                  <Bell size={14} /> {t('plan_reminder_permission')}
                </button>
              )}
              {(profile || selected.length > 0) && (
                <button type="button" onClick={() => window.print()} className="h-9 px-3 border border-border bg-white text-primary text-[11px] font-semibold inline-flex items-center gap-1.5">
                  <Printer size={14} /> {t('plan_print')}
                </button>
              )}
            </div>
          </div>
          <div className="hidden lg:block w-full border-y border-border py-2">
            <Illos kind="notifications" />
          </div>
        </div>

        {notice && (
          <div className="mb-4 text-xs rounded border border-border bg-white px-3 py-2 text-primary flex items-center gap-2">
            <Info size={14} className="text-secondary shrink-0" /> <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 text-xs rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>
        )}

        <section className="border-y border-border py-4 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide mb-2 inline-flex items-center gap-1.5">
                <UserRound size={14} /> {t('plan_profile_title')}
              </h2>
              {profile ? (
                <p className="text-sm text-muted">{describeProfile(profile) || t('plan_profile_empty')}</p>
              ) : (
                <p className="text-sm text-muted">{t('plan_profile_empty')}</p>
              )}
            </div>
            <Link to="/eligibility" className="text-[11px] font-semibold text-primary hover:underline shrink-0">
              {t('plan_edit_profile')}
            </Link>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wide">{t('plan_saved_title')}</h2>
          <Link to="/compare" className="text-[11px] font-semibold text-secondary hover:underline inline-flex items-center gap-1">
            <GitCompare size={14} /> {t('plan_compare_cta')}
          </Link>
        </div>

        {loading && (
          <p className="text-sm text-muted inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</p>
        )}

        {!loading && selected.length === 0 && (
          <div className="bg-white border border-border rounded p-8 text-center">
            <ClipboardList size={30} className="text-muted mx-auto mb-3" />
            <p className="text-sm text-muted mb-4">{t('plan_saved_empty')}</p>
            <Link to="/schemes" className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-primary text-white text-xs font-semibold">
              {t('compare_go_browse')} <ExternalLink size={14} />
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {selected.map((scheme, index) => (
            <SchemePlanCard
              key={scheme._id}
              scheme={scheme}
              t={t}
              reminder={reminders[String(scheme._id)]}
              checked={checked[String(scheme._id)] || loadChecklist(String(scheme._id))}
              onToggleDocument={(documentId) => toggleDocument(String(scheme._id), documentId)}
              onSetReminder={(date) => updateReminder(String(scheme._id), date)}
              onRemove={removeScheme}
              expanded={expanded[String(scheme._id)] ?? index === 0}
              onToggleExpanded={() => setExpanded((prev) => ({ ...prev, [String(scheme._id)]: !(prev[String(scheme._id)] ?? index === 0) }))}
            />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
