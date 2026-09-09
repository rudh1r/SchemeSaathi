import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, UserPlus, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function Auth() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      <main className="pt-28 pb-16 max-w-7xl mx-auto px-6">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-xl shadow-[0_12px_40px_rgba(0,11,31,0.06)] p-8 flex flex-col gap-5 border border-border">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-1">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <h1 className="font-serif text-xl text-primary font-bold tracking-tight">Welcome to SchemeSaathi</h1>
              <p className="text-sm text-muted max-w-xs leading-relaxed">
                Sign in to save your queries, or continue as a guest from the Chat Assistant.
              </p>
            </div>

            <div className="grid grid-cols-2 bg-parchment p-1 rounded-full border border-border text-center">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`py-2 px-4 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signin' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'
                }`}
              >
                <LogIn size={16} />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className={`py-2 px-4 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'
                }`}
              >
                <UserPlus size={16} />
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
              {mode === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-primary">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 border border-border rounded-lg px-3 text-sm bg-parchment focus:outline-none focus:border-primary"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-primary">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border border-border rounded-lg px-3 text-sm bg-parchment focus:outline-none focus:border-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-primary">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border border-border rounded-lg px-3 text-sm bg-parchment focus:outline-none focus:border-primary"
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-5 bg-secondary hover:bg-[#155332] text-white font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="text-center text-sm text-muted">
              {mode === 'signin' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => setMode('register')} className="font-bold text-primary hover:underline">
                    Register here
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => setMode('signin')} className="font-bold text-primary hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </div>

            <div className="text-center text-[11px] text-muted flex items-center justify-center gap-1 pt-1">
              <Shield size={14} className="text-secondary" />
              This is an academic project — credentials are used only for demo purposes.
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}