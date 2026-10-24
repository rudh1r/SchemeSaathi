import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, PencilLine, AlertCircle, RotateCcw, ExternalLink } from 'lucide-react';
import SiteHeader from './SiteHeader';
import Markdown from '../components/Markdown';
import Illos from '../components/Illos';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api, ApiError, getSessionId, newSessionId } from '../lib/api';
import { loadProfile, describeProfile, STATUS_STYLES } from '../lib/profile';

function VerdictBadge({ status }) {
  if (!status) return null;
  const style = STATUS_STYLES[status] || STATUS_STYLES['Insufficient Information'];
  return (
    <span className={`inline-block border text-[10px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${style.className}`}>
      {style.label}
    </span>
  );
}

function SchemeCard({ scheme, assessment }) {
  const scope = scheme.level === 'State' ? scheme.state || 'State scheme' : 'Central Scheme';
  return (
    <div className="bg-white border border-border rounded-sm flex flex-col p-4">
      <div className="flex items-start justify-between gap-2 border-b border-border pb-2 mb-3">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-muted uppercase block">{scope}</span>
          <h3 className="font-serif text-[17px] font-bold text-primary leading-tight mt-0.5">{scheme.scheme_name}</h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="inline-block bg-secondary-light border border-secondary/30 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-sm">{scheme.source_url ? 'Source on file' : 'Directory entry'}</span>
          <VerdictBadge status={assessment?.status} />
        </div>
      </div>

      <div className="bg-parchment border border-border rounded-sm p-3 mb-3">
        <span className="text-[11px] font-bold text-secondary uppercase block">Benefit</span>
        <span className="font-serif text-[15px] font-bold text-primary block leading-tight">{scheme.benefits}</span>
      </div>

      <div className="flex-1 text-[12px] space-y-1.5 mb-4 border-b border-border pb-3">
        <span className="text-[11px] font-bold text-primary uppercase block mb-1">Eligibility</span>
        {assessment ? (
          <>
            {assessment.satisfied.slice(0, 3).map((c, i) => (
              <div key={`s${i}`} className="flex items-start gap-1.5">
                <span className="text-secondary shrink-0">✓</span>
                <span className="text-muted">{c.label}</span>
              </div>
            ))}
            {assessment.violated.slice(0, 2).map((c, i) => (
              <div key={`v${i}`} className="flex items-start gap-1.5">
                <span className="text-red-600 shrink-0">✕</span>
                <span className="text-red-600">{c.label}</span>
              </div>
            ))}
            {assessment.unresolved.slice(0, 2).map((c, i) => (
              <div key={`u${i}`} className="flex items-start gap-1.5">
                <span className="text-primary shrink-0">?</span>
                <span className="text-primary">{c.label}</span>
              </div>
            ))}
            {assessment.satisfied.length === 0 && assessment.violated.length === 0 && assessment.unresolved.length === 0 && (
              <p className="text-muted">No restrictive conditions recorded — open to all applicants.</p>
            )}
          </>
        ) : (
          scheme.eligibility && Object.values(scheme.eligibility).slice(0, 3).map((v, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-muted shrink-0">•</span>
              <span className="text-muted">{v}</span>
            </div>
          ))
        )}
      </div>

      {scheme.source_url ? (
        <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" className="w-full bg-primary hover:bg-primary-dark text-white text-[13px] font-semibold py-2 px-3 rounded-sm text-center inline-flex items-center justify-center gap-1.5 transition-colors">
          <span>Apply on Official Portal</span>
          <ExternalLink size={13} />
        </a>
      ) : (
        <span className="w-full bg-surface-container border border-border text-muted text-[13px] font-semibold py-2 px-3 rounded-sm text-center block">
          Contact your local office
        </span>
      )}
    </div>
  );
}

function Feedback({ message }) {
  const [sent, setSent] = useState(null);
  if (!message.text || message.streaming) return null;
  if (!message.sources?.length && !message.attributes) return null;

  const send = async (rating) => {
    setSent(rating);
    try {
      await api.feedback({ rating, answer: message.text, meta: { session: message.sessionId } });
    } catch {
      /* feedback is best-effort */
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
      <span>Was this helpful?</span>
      <button
        onClick={() => send('up')}
        disabled={Boolean(sent)}
        className={`p-1 rounded border transition-colors ${sent === 'up' ? 'border-secondary text-secondary' : 'border-border hover:border-secondary'}`}
        aria-label="Helpful"
      >
        <ThumbsUp size={13} />
      </button>
      <button
        onClick={() => send('down')}
        disabled={Boolean(sent)}
        className={`p-1 rounded border transition-colors ${sent === 'down' ? 'border-red-400 text-red-500' : 'border-border hover:border-red-400'}`}
        aria-label="Not helpful"
      >
        <ThumbsDown size={13} />
      </button>
      {sent && <span>Thanks for the feedback.</span>}
    </div>
  );
}

function ChatMessage({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex items-start justify-end gap-3 pl-8 md:pl-28">
        <div className="flex flex-col items-end max-w-2xl">
          <div className="bg-primary text-white rounded-sm p-4">
            <p className="text-[15px] font-medium leading-normal">{message.text}</p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-sm bg-white border border-border flex items-center justify-center text-primary shrink-0 font-bold text-[13px]">You</div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 pr-2 md:pr-12">
      <div className="w-9 h-9 rounded-sm bg-primary text-white flex items-center justify-center shrink-0 mt-1">🏛</div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-serif font-bold text-[14px] text-primary">SchemeSaathi AI</span>
          <span className="bg-secondary-light text-secondary font-semibold px-2 py-0.5 rounded-sm text-[11px]">Grounded Response</span>
          {message.streaming && <span className="text-[11px] text-muted">typing…</span>}
        </div>
        {message.attributes && Object.keys(message.attributes).length > 0 && (
          <p className="text-[11px] text-muted mb-1.5">
            Checked against: <strong className="text-primary">{describeProfile(message.attributes)}</strong>
          </p>
        )}
        <div className="bg-white border border-border rounded-sm p-4 text-[14px] leading-relaxed text-muted mb-3 break-words">
          <Markdown text={message.text} />
          {message.streaming && <span className="inline-block w-1.5 h-4 bg-secondary align-middle ml-0.5 animate-pulse" />}
        </div>
        <Feedback message={message} />
        {message.sources && message.sources.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
            {message.sources.map((s) => (
              <SchemeCard
                key={s._id}
                scheme={s}
                assessment={message.assessments?.find((a) => String(a.schemeId) === String(s._id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState([{ role: 'assistant', text: t('chat_intro') }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(() => getSessionId());
  const [profile] = useState(() => loadProfile());
  const bottomRef = useRef(null);

  const SUGGESTED_PROMPTS = [t('prompt1'), t('prompt2'), t('prompt3'), t('prompt4')];
  const profileLine = describeProfile(profile);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    if (loading) return;
    setSessionId(newSessionId());
    setMessages([{ role: 'assistant', text: t('chat_intro') }]);
    setError(null);
    setInput('');
  };

  const patchLastAssistant = useCallback((patch) => {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].role === 'assistant') {
          next[i] = { ...next[i], ...(typeof patch === 'function' ? patch(next[i]) : patch) };
          break;
        }
      }
      return next;
    });
  }, []);

  const sendQuery = async (text) => {
    const query = text.trim();
    if (!query || loading) return;

    setError(null);
    setInput('');
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: query },
      { role: 'assistant', text: '', streaming: true, sources: [], assessments: [] },
    ]);

    let gotToken = false;

    try {
      await api.streamQuery(
        query,
        { profile: profile || undefined, sessionId },
        {
          onMeta: (meta) => {
            patchLastAssistant({ sources: meta.sources || [], assessments: meta.assessments || [], attributes: meta.attributes || {} });
          },
          onToken: (token) => {
            gotToken = true;
            patchLastAssistant((msg) => ({ text: (msg.text || '') + token }));
          },
          onDone: () => {
            patchLastAssistant({ streaming: false });
          },
        },
      );
    } catch (err) {
      // If streaming did not produce anything, fall back to the JSON endpoint.
      if (!gotToken) {
        try {
          const data = await api.query(query, { profile: profile || undefined, sessionId });
          patchLastAssistant({ text: data.answer, sources: data.sources || [], assessments: data.assessments || [], attributes: data.attributes || {}, streaming: false });
        } catch (fallbackErr) {
          const message = fallbackErr instanceof ApiError ? fallbackErr.message : 'The assistant is unavailable right now.';
          setError(message);
          patchLastAssistant({ text: `Sorry — ${message}`, streaming: false });
        }
      } else {
        patchLastAssistant({ streaming: false });
        if (err instanceof ApiError) setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <SiteHeader active="chat" />

      <div className="flex-1 flex flex-col pt-24 h-screen">
        <main className="flex-1 overflow-y-auto px-6 py-5 max-w-5xl w-full mx-auto">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] gap-5 items-center border-b border-border pb-4 mb-5">
            <div>
              <h1 className="font-serif text-xl font-bold text-primary">{t('nav_chat')}</h1>
              <p className="mt-1.5 flex items-start gap-2 text-[13px] text-primary font-medium leading-relaxed">
                <span className="mt-0.5 text-secondary">✓</span>
                <span>{t('chat_banner')}</span>
              </p>
            </div>
            <div className="hidden lg:block w-full border-y border-border py-1.5">
              <Illos kind="search" />
            </div>
          </div>

          <div className="w-full border-y border-border py-2 mb-5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <span className="text-muted">
              {profileLine ? (
                <>Saved profile: <strong className="text-primary">{profileLine}</strong> — details in your message take precedence.</>
              ) : (
                'No saved profile. Type your details in the message, or add a profile for personalised eligibility.'
              )}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/eligibility" className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline">
                <PencilLine size={13} />
                {profileLine ? 'Edit profile' : 'Add profile'}
              </Link>
              <span className="w-px h-3.5 bg-border" aria-hidden="true" />
              <button
                type="button"
                onClick={startNewChat}
                disabled={loading}
                className="inline-flex items-center gap-1 text-muted font-semibold hover:text-primary disabled:opacity-50"
              >
                <RotateCcw size={13} />
                New chat
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-sm px-3 py-2 mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {messages.map((m, i) => <ChatMessage key={i} message={m} />)}
            {loading && messages[messages.length - 1]?.text === '' && (
              <div className="flex items-center gap-3 pr-4 md:pr-24">
                <div className="w-9 h-9 rounded-sm bg-white border border-border flex items-center justify-center text-secondary shrink-0">⏳</div>
                <div className="bg-white border border-border rounded-sm px-3.5 py-2 flex items-center gap-2 text-[13px] text-muted">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse [animation-delay:200ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse [animation-delay:400ms]" />
                  </span>
                  {t('chat_thinking')}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        <div className="border-t border-border bg-white p-3.5 shrink-0">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 pb-2 mb-2">
              <span className="text-[11px] font-bold text-muted uppercase shrink-0">{t('chat_try_label')}</span>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button key={prompt} onClick={() => sendQuery(prompt)} className="bg-parchment hover:bg-border text-primary text-[12px] px-2.5 py-1 rounded-sm border border-border transition-colors text-left leading-snug max-w-full">{prompt}</button>
              ))}
            </div>
            <div className="relative flex items-center bg-parchment border border-border-strong rounded-sm px-3 py-1.5 focus-within:border-primary focus-within:border-2 transition-all">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendQuery(input)} placeholder={t('chat_placeholder')} className="w-full bg-transparent text-[14px] text-primary placeholder:text-muted focus:outline-none" />
              <button onClick={() => sendQuery(input)} disabled={loading} className="h-9 px-4 rounded-sm bg-primary hover:bg-primary-dark text-white text-[13px] font-semibold transition-colors ml-2 shrink-0 disabled:opacity-50">{t('chat_ask_btn')}</button>
            </div>
            <p className="flex flex-wrap items-center gap-1 mt-2 text-[11px] text-muted">
              <span>{t('chat_disclaimer')}</span>
              {user ? (
                <span>Signed in as {user.name}.</span>
              ) : (
                <Link to="/login" state={{ from: '/chat' }} className="text-secondary font-semibold hover:underline">
                  Sign in to save your query history.
                </Link>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
