import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PlatformAdminLogin() {
  const { signIn, user, profile, loading, profileError, signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (profileError) {
      setError(`Profile Error: ${profileError.message}`);
      setProcessing(false);
      return;
    }

    if (user && profile) {
      if (profile.role === 'platform_admin') {
        navigate('/admin', { replace: true });
      } else {
        // FIX: Prevent non-admin accounts from staying authenticated on admin route.
        signOut();
        setError('This account is not a platform admin.');
        setProcessing(false);
      }
    }
  }, [loading, user, profile, profileError, navigate, signOut]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      // FIX: Always clear processing state to avoid stuck UI.
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic font-['Bangers']">Platform Admin</h1>
          <p className="text-slate-500 font-medium">Restricted Access Area</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center text-3xl">
              Shield
            </div>
          </div>

          <p className="text-slate-600 mb-8 font-medium">
            Sign in with your platform admin credentials.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleAdminLogin}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={processing}
              className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {processing ? 'Connecting...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[10px] uppercase font-black text-slate-300 tracking-widest">
          Protected by Etiquette Security
        </p>
      </div>
    </div>
  );
}

