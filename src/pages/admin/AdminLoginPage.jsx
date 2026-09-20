import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (res?.user?.role !== 'admin') {
        setError('Access Denied: This account does not possess administrator credentials.');
        setLoading(false);
        return;
      }

      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] flex flex-col justify-between p-4 sm:p-6 lg:p-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#55694A] hover:text-[#362B21] font-sans font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-[#8F6E50] font-mono">
          SECURE STORE GATEWAY
        </span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 sm:p-10 shadow-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-[#4C5D41] text-[#FAF7F0] rounded-2xl flex items-center justify-center mx-auto shadow-md border border-[#6D7F62]/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold block">
            ADMINISTRATOR ACCESS
          </span>
          <h1 className="font-serif text-3xl text-[#362B21] font-light">
            Admin Portal
          </h1>
          <p className="text-xs text-[#544131]/80 font-sans leading-relaxed">
            Manage products, orders, customers, offers, and store operations from one place.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#B24C40]/10 border border-[#B24C40]/30 text-[#B24C40] text-xs font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-sans font-semibold text-[#4E3C2B] block">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8F6E50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Potteryrugs@gmail.com"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#362B21] placeholder-[#544131]/40 focus:outline-none focus:border-[#55694A] focus:ring-1 focus:ring-[#55694A] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-sans font-semibold text-[#4E3C2B] block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8F6E50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#362B21] placeholder-[#544131]/40 focus:outline-none focus:border-[#55694A] focus:ring-1 focus:ring-[#55694A] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#55694A] hover:bg-[#657C58] disabled:opacity-60 text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>{loading ? 'Verifying...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#DACDB3] text-center">
          <p className="text-[11px] text-[#544131]/70 font-sans">
            Production account credentials are encrypted with bcrypt & signed with JWT.
          </p>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center text-[10px] text-[#544131]/60 font-sans uppercase tracking-wider">
        HOUSE OF LOOM & CRAFT &bull; STORE OPERATIONS &bull; SECURE PORTAL
      </div>
    </div>
  );
}
