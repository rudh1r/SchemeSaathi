const BASE = 'http://localhost:5000';

async function j(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

(async () => {
  const profile = {
    age: 45, gender: 'Male', state: 'Uttar Pradesh', area: 'Rural',
    category: 'OBC', income: 150000, occupation: 'Farmer',
    land_owned: true, land_acres: 2, income_tax_payer: false,
  };

  const match = await j('/api/eligibility/match', { method: 'POST', body: JSON.stringify({ profile, limit: 5 }) });
  console.log('MATCH', match.status, JSON.stringify(match.data.totals));
  console.log('  top eligible:', (match.data.eligible || []).map((a) => a.schemeName).join(', '));
  console.log('  top insufficient:', (match.data.insufficient || []).slice(0, 3).map((a) => a.schemeName).join(', '));
  console.log('  missing:', (match.data.missing || []).map((m) => m.attr).join(', '));

  const check = await j('/api/eligibility/check', {
    method: 'POST',
    body: JSON.stringify({ schemeName: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)', profile }),
  });
  console.log('CHECK', check.status, check.data.assessment?.status, '|', check.data.assessment?.summary);

  const q = await j('/api/query', {
    method: 'POST',
    body: JSON.stringify({ query: 'I am a 45 year old farmer in UP with 2 acres. What schemes can help me?', profile, topK: 3 }),
  });
  console.log('QUERY', q.status, 'sources:', q.data.sources?.map((s) => `${s._rank}.${s.scheme_name} (${s._relevance})`).join(' | '));
  console.log('  verdicts:', q.data.assessments?.map((a) => `${a.schemeName}=${a.status}`).join('; '));
  console.log('  answer:', (q.data.answer || q.data.error || '').slice(0, 400).replace(/\n/g, ' '));

  const email = `smoke_${Date.now()}@example.com`;
  const reg = await j('/api/register', { method: 'POST', body: JSON.stringify({ name: 'Smoke Test', email, password: 'test1234' }) });
  console.log('REGISTER', reg.status, !!reg.data.token);
  const token = reg.data.token;
  const auth = { Authorization: `Bearer ${token}` };

  const q2 = await j('/api/query', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ query: 'What documents do I need for PM KISAN?', profile }),
  });
  console.log('QUERY(auth)', q2.status);

  const hist = await j('/api/history', { headers: auth });
  console.log('HISTORY', hist.status, 'count', hist.data.items?.length);
  console.log('  latest:', hist.data.items?.[0]?.query);

  const schemes = await j('/api/schemes?state=Uttar%20Pradesh');
  console.log('SCHEMES(UP)', schemes.status, 'n=', schemes.data.length);

  const bm = await j('/api/bookmarks', { method: 'POST', headers: auth, body: JSON.stringify({ schemeId: schemes.data[0]._id }) });
  console.log('BOOKMARK add', bm.status, bm.data.bookmarked);
  const bmList = await j('/api/bookmarks', { headers: auth });
  console.log('BOOKMARK list', bmList.status, bmList.data.total);
  const fb = await j('/api/feedback', { method: 'POST', body: JSON.stringify({ rating: 'up', answer: 'test' }) });
  console.log('FEEDBACK', fb.status, fb.data.recorded);
})();
