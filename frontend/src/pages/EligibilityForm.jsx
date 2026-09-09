import { useState } from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

const API_BASE = 'http://localhost:5000';

const STATES = [
  'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Rajasthan', 'Maharashtra',
  'West Bengal', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Other',
];

const OCCUPATIONS = [
  'Farmer / Agricultural Worker',
  'Student',
  'Small Business / Street Vendor',
  'Homemaker',
  'Gig / Construction Worker',
  'Artisan / Craftsperson',
  'Unemployed / Job Seeker',
  'Salaried / Government Employee',
];

const SOCIAL_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];

function SchemeResultCard({ scheme }) {
  return (
    <div className="bg-white border border-border rounded-sm p-4 flex flex-col">
      <div className="flex items-start justify-between border-b border-border pb-2 mb-3">
        <h3 className="font-serif text-[16px] font-bold text-primary leading-tight">{scheme.scheme_name}</h3>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-secondary-light text-secondary border border-secondary/30 shrink-0">
          Verified
        </span>
      </div>
      <p className="text-[13px] text-muted mb-3">{scheme.description}</p>
      <div className="bg-parchment border border-border rounded-sm p-2.5 mb-3">
        <span className="text-[11px] text-muted block">Benefit</span>
        <span className="font-serif text-[15px] font-bold text-primary">{scheme.benefits}</span>
      </div>
      
       <a
  href={scheme.source_url}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-auto inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[12px] font-semibold py-2 rounded-sm transition-colors"
>
  <ExternalLink size={14} />
  Official Portal
</a>
    </div>
  );
}

export default function EligibilityForm() {
  const [form, setForm] = useState({
    state: 'Uttar Pradesh',
    area: 'Rural',
    age: 34,
    gender: 'Male',
    category: 'General',
    income: 150000,
    occupation: 'Farmer / Agricultural Worker',
    ownsLand: false,
    landAcres: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const buildQuery = () => {
    const parts = [
      `I am a ${form.age}-year-old ${form.gender.toLowerCase()},`,
      `living in a ${form.area.toLowerCase()} area of ${form.state}.`,
      `My social category is ${form.category}.`,
      `My annual household income is approximately ₹${Number(form.income).toLocaleString('en-IN')}.`,
      `My occupation is ${form.occupation}.`,
    ];
    if (form.ownsLand) {
      parts.push(`I own agricultural land${form.landAcres ? ` of about ${form.landAcres} acres` : ''}.`);
    }
    parts.push('What government welfare schemes am I eligible for?');
    return parts.join(' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: buildQuery() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader active="eligibility" />

      <main className="pt-28 max-w-5xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">Personalized Eligibility Assessment</h1>
          <p className="text-sm text-muted max-w-2xl">
            Fill in your details below. This builds a description of your situation and checks it against the same
            scheme database and AI used by the Chat Assistant — no separate scoring system, no fabricated match percentages.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded p-6 flex flex-col gap-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Domicile State</label>
              <select
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                className="h-11 border border-border rounded px-3 text-sm focus:outline-none focus:border-primary bg-parchment"
              >
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Area</label>
              <div className="grid grid-cols-2 gap-2 h-11 p-1 bg-parchment border border-border rounded">
                {['Rural', 'Urban'].map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => update('area', a)}
                    className={`rounded text-sm font-semibold transition-colors ${
                      form.area === a ? 'bg-primary text-white' : 'text-muted hover:text-primary'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Age</label>
              <input
                type="number"
                min={14}
                max={110}
                value={form.age}
                onChange={(e) => update('age', e.target.value)}
                className="h-11 border border-border rounded px-3 text-sm focus:outline-none focus:border-primary bg-parchment"
              />
            </div>
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => update('gender', g)}
                    className={`py-2 rounded text-sm font-medium border transition-colors ${
                      form.gender === g
                        ? 'bg-primary text-white border-primary'
                        : 'bg-parchment text-muted border-border hover:border-primary'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-primary">Social Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SOCIAL_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => update('category', c)}
                  className={`py-2 rounded text-sm font-medium border transition-colors ${
                    form.category === c
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-parchment text-muted border-border hover:border-secondary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-parchment border border-border rounded">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-primary">Annual Household Income</label>
              <span className="font-serif text-lg font-bold text-primary">
                ₹{Number(form.income).toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1000000}
              step={10000}
              value={form.income}
              onChange={(e) => update('income', e.target.value)}
              className="w-full accent-secondary"
            />
            <div className="flex justify-between text-[11px] text-muted">
              <span>₹0</span>
              <span>₹5L</span>
              <span>₹10L+</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Primary Occupation</label>
              <select
                value={form.occupation}
                onChange={(e) => update('occupation', e.target.value)}
                className="h-11 border border-border rounded px-3 text-sm focus:outline-none focus:border-primary bg-parchment"
              >
                {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Agricultural Land</label>
              <div className="p-2.5 bg-parchment border border-border rounded flex flex-col gap-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-primary">Do you own farm land?</span>
                  <input
                    type="checkbox"
                    checked={form.ownsLand}
                    onChange={(e) => update('ownsLand', e.target.checked)}
                    className="w-4 h-4 accent-secondary"
                  />
                </label>
                {form.ownsLand && (
                  <input
                    type="number"
                    placeholder="Approx. acres"
                    value={form.landAcres}
                    onChange={(e) => update('landAcres', e.target.value)}
                    className="h-9 border border-border rounded px-2 text-sm bg-white focus:outline-none focus:border-primary"
                  />
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 bg-secondary hover:bg-[#155332] text-white font-semibold text-sm py-3 rounded transition-colors disabled:opacity-50"
          >
            <ShieldCheck size={18} />
            {loading ? 'Checking eligibility…' : 'Check My Eligibility'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-4 mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4 mb-8">
            <div className="bg-white border border-border rounded p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-serif font-bold text-primary text-sm">SchemeSaathi AI</span>
                <span className="text-[11px] px-2 py-0.5 rounded-sm bg-secondary-light text-secondary font-semibold">
                  Grounded Response
                </span>
              </div>
              <p className="text-sm text-muted whitespace-pre-line leading-relaxed">{result.answer}</p>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.sources.map((s) => <SchemeResultCard key={s._id} scheme={s} />)}
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}