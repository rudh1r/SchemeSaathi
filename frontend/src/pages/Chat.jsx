import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

const SUGGESTED_PROMPTS = [
  "I'm a farmer with 1.5 acres, what schemes can I get?",
  "Schemes for a below-poverty-line household needing a house",
  "Health coverage for a senior citizen",
  "Support for a traditional artisan or craftsperson",
];

function SchemeCard({ scheme }) {
  return (
    <div className="bg-white border border-border rounded-sm flex flex-col p-4">
      <div className="flex items-start justify-between border-b border-border pb-2 mb-3">
        <div>
          <span className="text-[11px] font-semibold text-muted uppercase block">Central Scheme</span>
          <h3 className="font-serif text-[17px] font-bold text-primary leading-tight mt-0.5">{scheme.scheme_name}</h3>
        </div>
        <span className="inline-block bg-secondary-light border border-secondary/30 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-sm shrink-0">
          Verified
        </span>
      </div>

      <div className="bg-parchment border border-border rounded-sm p-3 mb-3">
        <span className="text-[11px] font-bold text-secondary uppercase block">Benefit</span>
        <span className="font-serif text-[18px] font-bold text-primary block leading-tight">{scheme.benefits}</span>
      </div>

      <div className="flex-1 text-[12px] space-y-1.5 mb-4 border-b border-border pb-3">
        <span className="text-[11px] font-bold text-primary uppercase block mb-1">Eligibility</span>
        {scheme.eligibility && Object.values(scheme.eligibility).map((v, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-secondary shrink-0">✓</span>
            <span className="text-muted">{v}</span>
          </div>
        ))}
      </div>

      
        href={scheme.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-primary hover:bg-primary-dark text-white text-[13px] font-semibold py-2 px-3 rounded-sm text-center block transition-colors"
      >
        Apply on Official Portal
      </a>
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
        <div className="w-9 h-9 rounded-sm bg-white border border-border flex items-center justify-center text-primary shrink-0 font-bold text-[13px]">
          You
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 pr-2 md:pr-12">
      <div className="w-9 h-9 rounded-sm bg-primary text-white flex items-center justify-center shrink-0 mt-1">
        🏛
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-serif font-bold text-[14px] text-primary">SchemeSaathi AI</span>
          <span className="bg-secondary-light text-secondary font-semibold px-2 py-0.5 rounded-sm text-[11px]">
            Grounded Response
          </span>
        </div>
        <div className="bg-white border border-border rounded-sm p-4 text-[14px] leading-relaxed text-muted mb-3 whitespace-pre-line">
          {message.text}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {message.sources.map((s) => <SchemeCard key={s._id} scheme={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar() {
  const items = [
    { label: 'AI Assistant', icon: '🤖', active: true },
    { label: 'Browse All Schemes', icon: '📖', active: false },
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
            <span className="text-[12px] font-bold text-primary block leading-tight">RAG Assistant Mode</span>
            <span className="text-[11px] text-muted block mt-0.5">Live MongoDB + Chroma Engine</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 flex flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.label}
            className={`flex items-center px-3 py-2.5 rounded-sm text-[14px] font-medium transition-colors ${
              item.active
                ? 'bg-primary text-white border-l-4 border-secondary font-semibold'
                : 'text-muted hover:bg-parchment hover:text-primary'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <Link to="/" className="flex items-center px-3 py-2.5 rounded-sm text-[14px] font-medium text-muted hover:bg-parchment hover:text-primary transition-colors">
          <span className="mr-3">🏠</span>
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
        <h2 className="font-serif font-semibold text-primary text-[15px]">SchemeSaathi • Welfare AI Advisor</h2>
        <p className="text-[12px] text-muted">Government of India & State Welfare Copilot (Demo)</p>
      </div>
      <span className="text-[11px] px-2 py-1 border border-border rounded-sm text-muted hidden sm:inline">
        256-bit SSL • Academic Project
      </span>
    </header>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! Describe your situation — occupation, income, land, location, or specific needs — and I'll find welfare schemes you may be eligible for, grounded in verified scheme data.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuery = async (text) => {
    if (!text.trim() || loading) return;
    const userMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', text: `Something went wrong: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.answer, sources: data.sources }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Could not reach the server. Is the backend running?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-parchment">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto px-6 py-5 max-w-5xl w-full mx-auto">
          {/* Verification ribbon */}
          <div className="w-full bg-secondary-light border-l-4 border-secondary border-y border-r border-border px-4 py-2.5 rounded-sm mb-6 flex items-center gap-2.5 text-[13px] text-primary font-medium">
            <span className="text-secondary">✓</span>
            Answers are grounded only in the verified scheme database — nothing is invented.
          </div>

          <div className="flex flex-col gap-6">
            {messages.map((m, i) => <ChatMessage key={i} message={m} />)}
            {loading && (
              <div className="flex items-center gap-3 pr-4 md:pr-24">
                <div className="w-9 h-9 rounded-sm bg-white border border-border flex items-center justify-center text-secondary shrink-0">
                  ⏳
                </div>
                <div className="bg-white border border-border rounded-sm px-3.5 py-2 flex items-center gap-2 text-[13px] text-muted">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse [animation-delay:200ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse [animation-delay:400ms]" />
                  </span>
                  Searching the scheme knowledge base and generating a grounded answer…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        {/* Sticky input dock */}
        <div className="border-t border-border bg-white p-3.5 shrink-0">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2">
              <span className="text-[11px] font-bold text-muted uppercase shrink-0">Try:</span>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendQuery(prompt)}
                  className="shrink-0 bg-parchment hover:bg-border text-primary text-[12px] px-2.5 py-1 rounded-sm border border-border transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="relative flex items-center bg-parchment border border-border-strong rounded-sm px-3 py-1.5 focus-within:border-primary focus-within:border-2 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendQuery(input)}
                placeholder="Ask in English (e.g. 'How do I apply for Kisan Credit Card?')"
                className="w-full bg-transparent text-[14px] text-primary placeholder:text-muted focus:outline-none"
              />
              <button
                onClick={() => sendQuery(input)}
                disabled={loading}
                className="h-9 px-4 rounded-sm bg-primary hover:bg-primary-dark text-white text-[13px] font-semibold transition-colors ml-2 shrink-0 disabled:opacity-50"
              >
                Ask
              </button>
            </div>
            <p className="flex items-center gap-1 mt-2 text-[11px] text-muted">
              This is an academic assistance tool. Always confirm details on the official scheme portal before applying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}