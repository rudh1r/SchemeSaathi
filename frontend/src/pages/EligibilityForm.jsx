import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ExternalLink, Bookmark, BookmarkCheck, ChevronDown, AlertTriangle, CircleHelp, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { EMPTY_PROFILE, clearProfile, loadProfile, saveProfile, toApiProfile, STATUS_STYLES } from '../lib/profile';

const STATES = ['Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Rajasthan', 'Maharashtra', 'West Bengal', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Odisha', 'Jharkhand', 'Delhi', 'Other'];
const OCCUPATIONS = ['Farmer / Agricultural Worker', 'Student', 'Small Business / Street Vendor', 'Homemaker', 'Gig / Construction Worker', 'Artisan / Craftsperson', 'Unemployed / Job Seeker', 'Salaried / Government Employee'];
const SOCIAL_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];

const TABS = [
  { key: 'Eligible', label: 'Likely eligible', icon: CheckCircle2, tone: 'text-secondary' },
  { key: 'Insufficient Information', label: 'Need more info', icon: CircleHelp, tone: 'text-amber-600' },
  { key: 'Ineligible', label: 'Not eligible', icon: XCircle, tone: 'text-red-600' },
];

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES['Insufficient Information'];
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-sm border ${style.className}`}>{style.label}</span>;
}

function AssessmentCard({ assessment, bookmarked, onToggleBookmark, canBookmark }) {
  const [open, setOpen] = useState(false);
  const scheme = assessment.scheme || {};
  const checked = assessment.satisfied.length;
  const total = checked + assessment.violated.length + assessment.unresolved.length;

  return (
    <div className="bg-white border border-border rounded-sm p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border pb-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-serif text-[16px] font-bold text-primary leading-tight">{assessment.schemeName}</h3>
          <p className="text-[11px] text-muted mt-0.5">
            {scheme.level === 'State' ? scheme.state : 'Central scheme'}
            {scheme.category ? ` · ${scheme.category}` : ''}
          </p>
        </div>
        <StatusBadge status={assessment.status} />
      </div>

      <p className="text-[12px] text-muted leading-relaxed mb-3">{assessment.summary}</p>

      {scheme.benefits && (
        <div className="bg-parchment border border-border rounded-sm p-2.5 mb-3">
          <span className="text-[10px] text-muted uppercase font-bold block">Benefit</span>
          <span className="font-serif text-[14px] font-bold text-primary">{scheme.benefits}</span>
        </div>
      )}

      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between text-[11px] font-bold text-primary uppercase mb-2">
        <span>Why this result ({checked}/{total} checked)</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="flex flex-col gap-1.5 text-[11px] mb-3">
          {assessment.satisfied.map((item, i) => (
            <p key={`s${i}`} className="flex items-start gap-1.5 text-secondary">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
              <span>{item.label}</span>
            </p>
          ))}
          {assessment.violated.map((item, i) => (
            <p key={`v${i}`} className="flex items-start gap-1.5 text-red-600">
              <XCircle size={13} className="mt-0.5 shrink-0" />
              <span>{item.label} <span className="text-muted">(your profile: {String(item.profileValue)})</span></span>
            </p>
          ))}
          {assessment.unresolved.map((item, i) => (
            <p key={`u${i}`} className="flex items-start gap-1.5 text-amber-700">
              <CircleHelp size={13} className="mt-0.5 shrink-0" />
              <span>{item.label}{item.question ? ` — ${item.question}` : ''}</span>
            </p>
          ))}
          {!assessment.reviewed && (
            <p className="text-muted italic">Conditions for this scheme are automatically extracted and not yet hand-verified.</p>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-2 border-t border-border">
        {scheme.source_url ? (
          <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[12px] font-semibold py-2 rounded-sm transition-colors">
            <ExternalLink size={13} />
            Official portal
          </a>
        ) : (
          <span className="flex-1 inline-flex items-center justify-center gap-1.5 bg-surface-container border border-border text-muted text-[12px] font-semibold py-2 rounded-sm">
            Contact local office
          </span>
        )}
        <button
          onClick={() => onToggleBookmark(assessment.schemeId)}
          disabled={!canBookmark}
          title={canBookmark ? 'Save this scheme' : 'Sign in to save schemes'}
          className={`w-9 h-9 rounded-sm border flex items-center justify-center transition-colors ${bookmarked ? 'border-secondary text-secondary bg-secondary-light' : 'border-border text-muted hover:border-secondary'} disabled:opacity-40`}
        >
          {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function EligibilityForm() {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState(() => {
    const base = { ...EMPTY_PROFILE, state: 'Uttar Pradesh', age: 34, gender: 'Male', occupation: 'Farmer / Agricultural Worker', income: 150000 };
    const saved = loadProfile();
    if (!saved) return base;
    return {
      ...base,
      state: saved.state || base.state,
      area: saved.area || base.area,
      age: saved.age ?? base.age,
      gender: saved.gender || base.gender,
      category: saved.category || base.category,
      income: saved.income ?? base.income,
      occupation: saved.occupation || base.occupation,
      ownsLand: saved.land_owned ?? base.ownsLand,
      landAcres: saved.land_acres ?? base.landAcres,
    };
  });
  const [need, setNeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('Eligible');
  const [bookmarks, setBookmarks] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    api.bookmarks()
      .then((data) => setBookmarks(new Set(data.items.map((item) => String(item.scheme._id)))))
      .catch(() => {});
  }, [user]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    clearProfile();
    setForm({ ...EMPTY_PROFILE, state: 'Uttar Pradesh', age: 34, gender: 'Male', occupation: 'Farmer / Agricultural Worker', income: 150000 });
    setNeed('');
    setResult(null);
    setError(null);
    setTab('Eligible');
  };

  const profile = useMemo(() => toApiProfile(form), [form]);

  const groups = useMemo(() => {
    if (!result) return null;
    if (result.mode === 'full-corpus') {
      return {
        Eligible: result.eligible || [],
        'Insufficient Information': result.insufficient || [],
        Ineligible: result.ineligible || [],
      };
    }
    const grouped = { Eligible: [], 'Insufficient Information': [], Ineligible: [] };
    for (const item of result.results || []) grouped[item.status]?.push(item);
    return grouped;
  }, [result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      saveProfile(profile);
      if (user) updateProfile(profile).catch(() => {});

      const data = await api.matchEligibility({ profile, need: need.trim() || undefined, limit: 8 });
      setResult(data);
      const eligible = data.mode === 'full-corpus' ? data.totals.eligible : (data.results || []).filter((r) => r.status === 'Eligible').length;
      setTab(eligible > 0 ? 'Eligible' : 'Insufficient Information');
    } catch (err) {
      setError(err.message || 'Could not check eligibility right now.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (schemeId) => {
    if (!user) return;
    const key = String(schemeId);
    const next = new Set(bookmarks);
    try {
      if (next.has(key)) {
        await api.removeBookmark(key);
        next.delete(key);
      } else {
        await api.addBookmark(key);
        next.add(key);
      }
      setBookmarks(next);
    } catch (err) {
      setError(err.message);
    }
  };

  const missing = useMemo(() => {
    if (!result) return [];
    if (result.missing) return result.missing;
    return [];
  }, [result]);

  const totalScanned = result?.mode === 'full-corpus'
    ? (result.totals?.eligible || 0) + (result.totals?.insufficient || 0) + (result.totals?.ineligible || 0)
    : 0;

  const counts = useMemo(() => {
    if (!result || !groups) return null;
    if (result.mode === 'full-corpus' && result.totals) {
      return {
        Eligible: result.totals.eligible,
        'Insufficient Information': result.totals.insufficient,
        Ineligible: result.totals.ineligible,
      };
    }
    return {
      Eligible: groups.Eligible.length,
      'Insufficient Information': groups['Insufficient Information'].length,
      Ineligible: groups.Ineligible.length,
    };
  }, [result, groups]);

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader active="eligibility" />

      <main className="pt-28 max-w-5xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">{t('elig_title')}</h1>
          <p className="text-sm text-muted max-w-2xl">
            {t('elig_subtitle')}
          </p>
          <p className="text-[12px] text-muted max-w-2xl mt-2">
            Your answers are checked against explicit scheme conditions. A condition that cannot be verified is reported as
            <strong className="text-amber-700"> “Needs info”</strong> — never as eligible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded p-6 flex flex-col gap-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">{t('elig_state_label')}</label>
              <select value={form.state} onChange={(e) => update('state', e.target.value)} className="h-11 border border-border rounded px-3 text-sm focus:outline-none focus:border-primary bg-parchment">
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">{t('elig_area_label')}</label>
              <div className="grid grid-cols-2 gap-2 h-11 p-1 bg-parchment border border-border rounded">
                {[{ value: 'Rural', label: t('elig_rural') }, { value: 'Urban', label: t('elig_urban') }].map((a) => (
                  <button type="button" key={a.value} onClick={() => update('area', a.value)} className={`rounded text-sm font-semibold transition-colors ${form.area === a.value ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">{t('elig_age_label')}</label>
              <input type="number" min={1} max={110} value={form.age} onChange={(e) => update('age', e.target.value)} className="h-11 border border-border rounded px-3 text-sm focus:outline-none focus:border-primary bg-parchment" />
            </div>
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">{t('elig_gender_label')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ value: 'Male', label: t('elig_male') }, { value: 'Female', label: t('elig_female') }, { value: 'Other', label: t('elig_other') }].map((g) => (
                  <button type="button" key={g.value} onClick={() => update('gender', g.value)} className={`py-2 rounded text-sm font-medium border transition-colors ${form.gender === g.value ? 'bg-primary text-white border-primary' : 'bg-parchment text-muted border-border hover:border-primary'}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-primary">{t('elig_category_label')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SOCIAL_CATEGORIES.map((c) => (
                <button type="button" key={c} onClick={() => update('category', c)} className={`py-2 rounded text-sm font-medium border transition-colors ${form.category === c ? 'bg-secondary text-white border-secondary' : 'bg-parchment text-muted border-border hover:border-secondary'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-parchment border border-border rounded">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-primary">{t('elig_income_label')}</label>
              <span className="font-serif text-lg font-bold text-primary">₹{Number(form.income || 0).toLocaleString('en-IN')}</span>
            </div>
            <input type="range" min={0} max={1000000} step={10000} value={form.income} onChange={(e) => update('income', e.target.value)} className="w-full accent-secondary" />
            <div className="flex justify-between text-[11px] text-muted">
              <span>₹0</span>
              <span>₹5L</span>
              <span>₹10L+</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">{t('elig_occupation_label')}</label>
              <select value={form.occupation} onChange={(e) => update('occupation', e.target.value)} className="h-11 border border-border rounded px-3 text-sm focus:outline-none focus:border-primary bg-parchment">
                {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">{t('elig_land_label')}</label>
              <div className="p-2.5 bg-parchment border border-border rounded flex flex-col gap-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-primary">{t('elig_land_question')}</span>
                  <input type="checkbox" checked={form.ownsLand} onChange={(e) => update('ownsLand', e.target.checked)} className="w-4 h-4 accent-secondary" />
                </label>
                {form.ownsLand && (
                  <input type="number" step="0.1" min="0" placeholder={t('elig_land_placeholder')} value={form.landAcres} onChange={(e) => update('landAcres', e.target.value)} className="h-9 border border-border rounded px-2 text-sm bg-white focus:outline-none focus:border-primary" />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-primary">What kind of help are you looking for? (optional)</label>
            <input
              type="text"
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              placeholder="e.g. money for my daughter's college fees, a housing loan, a pension after 60"
              className="h-11 border border-border rounded px-3 text-sm focus:outline-none focus:border-primary bg-parchment"
            />
            <p className="text-[11px] text-muted">Leave this blank to check every scheme in the knowledge base.</p>
          </div>

          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 bg-secondary hover:bg-[#155332] text-white font-semibold text-sm py-3 rounded transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {loading ? t('elig_submit_loading') : t('elig_submit_btn')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded border border-border bg-white text-primary font-semibold text-sm hover:bg-parchment transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded p-4 mb-6">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && groups && (
          <div className="flex flex-col gap-5 mb-10">
            <div className="bg-white border border-border rounded p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif font-bold text-primary">Assessment complete</p>
                <p className="text-[12px] text-muted">
                  {counts.Eligible} likely eligible · {counts['Insufficient Information']} need more info · {counts.Ineligible} not eligible
                  {result.mode === 'full-corpus' ? ` · checked all ${totalScanned} schemes` : ` · ${result.retrieval?.candidates || 0} candidates`}
                </p>
              </div>
              {result.retrieval?.engine && (
                <span className="text-[11px] text-muted uppercase font-bold">{result.retrieval.engine}</span>
              )}
            </div>

            {missing.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <p className="text-[12px] font-bold text-amber-800 uppercase mb-1.5">Answer these to unlock more results</p>
                <ul className="text-[12px] text-amber-800 space-y-1 list-disc pl-4">
                  {missing.slice(0, 5).map((item) => <li key={item.attr}>{item.question}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 border border-border rounded bg-white p-1 text-xs">
              {TABS.map(({ key, label, icon: Icon, tone }) => (
                <button key={key} onClick={() => setTab(key)} className={`py-2 rounded font-bold flex items-center justify-center gap-1.5 ${tab === key ? 'bg-parchment text-primary border border-border' : 'text-muted hover:text-primary'}`}>
                  <Icon size={15} className={tone} />
                  {label} ({counts[key]})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups[tab].length === 0 && (
                <p className="text-sm text-muted">No schemes in this group{result.mode === 'full-corpus' ? '.' : ' — try removing the “what help” filter to search the whole knowledge base.'}</p>
              )}
              {groups[tab].map((assessment) => (
                <AssessmentCard
                  key={assessment.schemeId}
                  assessment={assessment}
                  bookmarked={bookmarks.has(String(assessment.schemeId))}
                  onToggleBookmark={toggleBookmark}
                  canBookmark={Boolean(user)}
                />
              ))}
            </div>

            {result.mode === 'full-corpus' && counts[tab] > groups[tab].length && (
              <p className="text-[11px] text-muted">
                Showing the top {groups[tab].length} of {counts[tab]} schemes in this group. Add a “what kind of help” description to narrow the list to the most relevant matches.
              </p>
            )}

            <p className="text-[11px] text-muted">
              This is an informational assessment, not an official eligibility decision. Conditions and amounts change — confirm on the official scheme page before applying.
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
