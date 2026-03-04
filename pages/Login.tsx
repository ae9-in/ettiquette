import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      // FIX: Always release button loading state.
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="h-16 w-16 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-200 mx-auto mb-8 font-['Bangers'] italic">E</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3 italic font-['Bangers']">Etiquette LMS</h1>
          <p className="text-slate-500 font-medium">Sign in to access your workspace</p>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-100">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-12 text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
          Secure Enterprise Gateway • SSL Encrypted
        </p>
      </div>
    </div>
  );
};

export default Login;
